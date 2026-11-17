// ─────────────────────────────────────────────────────────────────────────────
// Quality & Reliability metrics for the inbound-email pipeline (admin only).
//
// Read-only: derived entirely from email_ingestion_queue, event_staging and
// events. Nothing here writes to the DB.
//
// Units matter: every count is either EMAILS (queue rows) or EVENTS (items
// extracted from an email). The cohort is "emails received in the window" —
// event counts are the events belonging to those emails, so both units
// describe the same set of mail.
//
// What this can't see, and reports as not measured rather than guessing:
//   - duplicate checks: check-conflicts runs client-side, results not stored
//   - retries: a retry overwrites the previous attempt, no attempt count kept
//   - mail that never reached Postmark/PowerParent
// ─────────────────────────────────────────────────────────────────────────────

const { isValidIsoDate } = require('../utils/dateValidation');

const STUCK_AFTER_MINUTES = 10;
const STALE_REVIEW_DAYS = 7;
const PAGE_SIZE = 1000;     // Supabase/PostgREST default max rows per request
const ID_CHUNK = 200;       // keep .in() filters well under URL length limits
const MAX_PROBLEMS = 200;

// Fields compared between the AI's staged version and the confirmed event.
// school/event_type are deliberately excluded — they're chosen by the parent
// on the review card, not extracted values the AI could get "wrong".
const COMPARED_FIELDS = ['title', 'date', 'time_start', 'time_end', 'venue', 'category', 'year_group', 'description'];

const FAILURE_REASONS = {
  unparseable_ai_output: 'AI response not valid JSON',
  no_valid_date: 'Events found but no valid date',
  staging_save_failed: 'Saving extracted events failed',
  provider_or_other: 'AI provider / other error',
};

const NOT_MEASURED = {
  duplicates: 'Duplicate checks run in the browser at review time and their results are not stored.',
  retries: 'A retry overwrites the previous attempt; no attempt count or history is stored.',
};

// ─── Fetching ────────────────────────────────────────────────────────────────

async function fetchAllPages(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function fetchByIds(db, table, columns, column, ids) {
  const unique = [...new Set(ids.filter(id => id !== null && id !== undefined))];
  const rows = [];
  for (let i = 0; i < unique.length; i += ID_CHUNK) {
    const chunk = unique.slice(i, i + ID_CHUNK);
    rows.push(...await fetchAllPages(() => db.from(table).select(columns).in(column, chunk)));
  }
  return rows;
}

const QUEUE_COLUMNS = 'id, user_id, raw_subject, from_address, to_address, received_at, status, extracted_data, confidence_score, error_message, updated_at';
const STAGING_COLUMNS = 'id, queue_id, title, date, time_start, time_end, venue, year_group, category, description, confidence_score, status, event_id, school_id, created_at, updated_at';
const EVENT_COLUMNS = 'id, title, date, time_start, time_end, venue, year_group, category, description, created_at';

async function fetchQualityData(db, { since }) {
  const queueRows = await fetchAllPages(() => db
    .from('email_ingestion_queue')
    .select(QUEUE_COLUMNS)
    .gte('received_at', since.toISOString())
    .order('received_at', { ascending: false }));

  const stagingRows = await fetchByIds(db, 'event_staging', STAGING_COLUMNS, 'queue_id', queueRows.map(q => q.id));
  const eventRows = await fetchByIds(db, 'events', EVENT_COLUMNS, 'id', stagingRows.map(s => s.event_id));

  return { queueRows, stagingRows, eventRows };
}

// ─── Pure helpers ────────────────────────────────────────────────────────────

function normaliseField(field, value) {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  // Postgres TIME comes back as HH:MM:SS; the review UI sends HH:MM.
  if (field === 'time_start' || field === 'time_end') return s.slice(0, 5);
  if (field === 'date') return s.slice(0, 10);
  if (field === 'category') return s.toLowerCase();
  return s;
}

function diffStagingAgainstEvent(staging, event) {
  return COMPARED_FIELDS
    .filter(f => normaliseField(f, staging[f]) !== normaliseField(f, event[f]))
    .map(f => ({ field: f, ai_value: staging[f] ?? null, confirmed_value: event[f] ?? null }));
}

function classifyFailure(message) {
  const m = message || '';
  if (/^Failed to parse AI response/i.test(m)) return 'unparseable_ai_output';
  if (/couldn't determine a date/i.test(m)) return 'no_valid_date';
  if (/^Failed to save extracted events/i.test(m)) return 'staging_save_failed';
  return 'provider_or_other';
}

function extractedEventsOf(queueRow) {
  const events = queueRow.extracted_data?.events;
  return Array.isArray(events) ? events : [];
}

function senderDomain(address) {
  if (!address) return null;
  const match = String(address).match(/@([^>\s]+)/);
  return match ? match[1].toLowerCase() : null;
}

function truncate(s, n) {
  if (!s) return s ?? null;
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function percentile(sorted, q) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
}

const ratio = (num, den) => (den > 0 ? num / den : null);
const DAY_MS = 24 * 60 * 60 * 1000;

// Per-email facts, shared by the dashboard aggregate and the drill-down.
function analyseEmail(queueRow, stagingForEmail, eventsById, now) {
  const extracted = extractedEventsOf(queueRow);
  const droppedEvents = extracted.filter(e => !isValidIsoDate(e?.date));
  const ageMs = now - new Date(queueRow.received_at).getTime();

  const staged = stagingForEmail.map(s => {
    const event = s.event_id != null ? eventsById.get(s.event_id) : null;
    // event_id is the source of truth for "confirmed": only the confirm
    // endpoint ever sets it. Production has rows with status 'discarded'
    // but an event_id (status overwritten after confirm — cause unknown),
    // so trusting status alone would report confirmed events as discarded.
    let outcome = s.status;                          // pending | confirmed | discarded
    if (s.event_id != null) outcome = event ? 'confirmed' : 'confirmed_then_deleted';
    else if (s.status === 'confirmed') outcome = 'confirmed_then_deleted';   // event deleted → event_id nulled
    const statusMismatch = s.event_id != null && s.status !== 'confirmed';
    const changes = outcome === 'confirmed' ? diffStagingAgainstEvent(s, event) : [];
    const pendingDays = outcome === 'pending' ? (now - new Date(s.created_at).getTime()) / DAY_MS : null;
    return { staging: s, event, outcome, changes, pendingDays, statusMismatch };
  });
  const hasConfirmedEvent = staged.some(s => s.outcome === 'confirmed' || s.outcome === 'confirmed_then_deleted');

  const firstStagedAt = stagingForEmail.length
    ? Math.min(...stagingForEmail.map(s => new Date(s.created_at).getTime()))
    : null;

  let emailState = queueRow.status;
  if (queueRow.status === 'processing') {
    emailState = ageMs > STUCK_AFTER_MINUTES * 60 * 1000 ? 'stuck' : 'processing';
  } else if (queueRow.status === 'confirmed' && extracted.length === 0 && stagingForEmail.length === 0) {
    // 'confirmed' is also what the pipeline writes when the AI found nothing.
    emailState = 'no_events_found';
  } else if (queueRow.status === 'discarded' && hasConfirmedEvent) {
    // Knock-on of the staging status overwrite above: the close-out logic
    // saw no 'confirmed' staging rows and marked the whole email discarded.
    emailState = 'confirmed';
  }

  return {
    emailState,
    emailStatusMismatch: emailState !== queueRow.status && queueRow.status === 'discarded',
    extractedCount: extracted.length,
    droppedEvents,
    staged,
    latencyMs: firstStagedAt !== null ? firstStagedAt - new Date(queueRow.received_at).getTime() : null,
    provider: queueRow.extracted_data?.provider || null,
    geminiError: queueRow.extracted_data?.gemini_error || null,
    failureReason: queueRow.status === 'failed' ? classifyFailure(queueRow.error_message) : null,
  };
}

function problemIssues(queueRow, a) {
  const issues = [];
  if (a.emailState === 'failed') {
    issues.push({ type: 'failed', severity: 'high', detail: `${FAILURE_REASONS[a.failureReason]}: ${truncate(queueRow.error_message, 140) || 'no message'}` });
  }
  if (a.emailState === 'stuck') {
    issues.push({ type: 'stuck', severity: 'high', detail: `Still processing after ${STUCK_AFTER_MINUTES}+ minutes` });
  }
  if (!queueRow.user_id) {
    issues.push({ type: 'unmatched_parent', severity: 'medium', detail: queueRow.to_address ? 'Recipient address did not match a parent' : 'No parent matched (recipient address not recorded)' });
  }
  if (a.droppedEvents.length && a.emailState !== 'failed') {
    issues.push({ type: 'dropped_events', severity: 'medium', detail: `${a.droppedEvents.length} event(s) dropped: no valid date` });
  }
  const stale = a.staged.filter(s => s.pendingDays !== null && s.pendingDays > STALE_REVIEW_DAYS);
  if (stale.length) {
    issues.push({ type: 'stale_review', severity: 'medium', detail: `${stale.length} event(s) awaiting review > ${STALE_REVIEW_DAYS} days` });
  }
  const mismatched = a.staged.filter(s => s.statusMismatch).length;
  if (mismatched) {
    issues.push({ type: 'status_mismatch', severity: 'medium', detail: `${mismatched} confirmed event(s) stored as '${a.staged.find(s => s.statusMismatch).staging.status}'` });
  }
  // "Heavy" = date changed (highest-stakes field) or 2+ fields changed.
  const heavy = a.staged.filter(s => s.changes.some(c => c.field === 'date') || s.changes.length >= 2);
  if (heavy.length) {
    issues.push({ type: 'heavy_edits', severity: 'low', detail: `${heavy.length} confirmed event(s) with date changed or 2+ fields edited` });
  }
  return issues;
}

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

// ─── Aggregate ───────────────────────────────────────────────────────────────

function computeQualityMetrics({ queueRows, stagingRows, eventRows, days, now = Date.now() }) {
  const eventsById = new Map(eventRows.map(e => [e.id, e]));
  const stagingByQueue = new Map();
  for (const s of stagingRows) {
    if (!stagingByQueue.has(s.queue_id)) stagingByQueue.set(s.queue_id, []);
    stagingByQueue.get(s.queue_id).push(s);
  }

  const emailStates = { processing: 0, stuck: 0, pending_review: 0, confirmed: 0, no_events_found: 0, discarded: 0, failed: 0, other: 0 };
  const failuresByReason = Object.fromEntries(Object.keys(FAILURE_REASONS).map(k => [k, 0]));
  const fieldEditCounts = Object.fromEntries(COMPARED_FIELDS.map(f => [f, 0]));
  const latencies = [];
  const problems = [];

  let emailsUnmatched = 0, emailsWithDropped = 0, emailsExtracted = 0, emailsStaged = 0, emailsWithConfirmed = 0;
  let emailsWithProvider = 0, emailsClaudeFallback = 0;
  let eventsExtracted = 0, eventsDropped = 0, eventsStaged = 0;
  let eventsConfirmed = 0, eventsUnchanged = 0, eventsEdited = 0, eventsConfirmedThenDeleted = 0;
  let eventsDiscarded = 0, eventsPending = 0, eventsPendingStale = 0, oldestPendingDays = null;
  let stagingStatusMismatch = 0, emailStatusMismatch = 0;
  // How staged emails ended up. Mutually exclusive, sums to emails staged:
  // any confirmed event wins, else any pending, else all were discarded.
  const emailOutcomes = { confirmed: 0, pending: 0, discarded: 0 };

  for (const q of queueRows) {
    const a = analyseEmail(q, stagingByQueue.get(q.id) || [], eventsById, now);

    emailStates[a.emailState in emailStates ? a.emailState : 'other'] += 1;
    if (!q.user_id) emailsUnmatched += 1;
    if (a.failureReason) failuresByReason[a.failureReason] += 1;
    if (a.provider) {
      emailsWithProvider += 1;
      if (a.provider === 'claude') emailsClaudeFallback += 1;
    }

    eventsExtracted += a.extractedCount;
    if (a.extractedCount > 0) emailsExtracted += 1;
    eventsDropped += a.droppedEvents.length;
    if (a.droppedEvents.length) emailsWithDropped += 1;
    eventsStaged += a.staged.length;
    if (a.staged.length) emailsStaged += 1;
    if (a.latencyMs !== null) latencies.push(a.latencyMs);

    if (a.emailStatusMismatch) emailStatusMismatch += 1;
    let hasConfirmed = false;
    for (const s of a.staged) {
      if (s.statusMismatch) stagingStatusMismatch += 1;
      if (s.outcome === 'confirmed' || s.outcome === 'confirmed_then_deleted') {
        eventsConfirmed += 1;
        hasConfirmed = true;
      }
      if (s.outcome === 'confirmed_then_deleted') eventsConfirmedThenDeleted += 1;
      if (s.outcome === 'confirmed') {
        if (s.changes.length) {
          eventsEdited += 1;
          for (const c of s.changes) fieldEditCounts[c.field] += 1;
        } else {
          eventsUnchanged += 1;
        }
      }
      if (s.outcome === 'discarded') eventsDiscarded += 1;
      if (s.outcome === 'pending') {
        eventsPending += 1;
        if (s.pendingDays > STALE_REVIEW_DAYS) eventsPendingStale += 1;
        oldestPendingDays = Math.max(oldestPendingDays ?? 0, s.pendingDays);
      }
    }
    if (hasConfirmed) emailsWithConfirmed += 1;
    if (a.staged.length) {
      if (hasConfirmed) emailOutcomes.confirmed += 1;
      else if (a.staged.some(s => s.outcome === 'pending')) emailOutcomes.pending += 1;
      else emailOutcomes.discarded += 1;
    }

    const issues = problemIssues(q, a);
    if (issues.length) {
      problems.push({
        queue_id: q.id,
        received_at: q.received_at,
        sender_domain: senderDomain(q.from_address),
        subject: truncate(q.raw_subject, 80),
        status: a.emailState,
        event_count: a.extractedCount,
        severity: issues.reduce((best, i) => (SEVERITY_RANK[i.severity] < SEVERITY_RANK[best] ? i.severity : best), 'low'),
        issues,
      });
    }
  }

  problems.sort((x, y) => SEVERITY_RANK[x.severity] - SEVERITY_RANK[y.severity] || new Date(y.received_at) - new Date(x.received_at));
  latencies.sort((x, y) => x - y);

  const emailsReceived = queueRows.length;
  const emailsProcessed = emailsReceived - emailStates.processing - emailStates.stuck;

  return {
    window: { days, from: new Date(now - days * DAY_MS).toISOString(), to: new Date(now).toISOString() },
    thresholds: { stuck_after_minutes: STUCK_AFTER_MINUTES, stale_review_days: STALE_REVIEW_DAYS },

    coverage: {
      emails_received: emailsReceived,
      emails_processed: emailsProcessed,
      emails_processing: emailStates.processing,
      emails_stuck: emailStates.stuck,
      emails_failed: emailStates.failed,
      emails_pending_review: emailStates.pending_review,
      emails_confirmed: emailStates.confirmed,
      emails_no_events_found: emailStates.no_events_found,
      emails_discarded: emailStates.discarded,
      emails_other_status: emailStates.other,
      emails_unmatched_parent: emailsUnmatched,
    },

    extraction: {
      events_extracted: eventsExtracted,
      events_staged: eventsStaged,
      events_dropped_invalid_date: eventsDropped,
      emails_with_dropped_events: emailsWithDropped,
      emails_failed: emailStates.failed,
      failures_by_reason: Object.entries(failuresByReason).map(([key, count]) => ({ key, label: FAILURE_REASONS[key], count })),
      // Proxy only: parent edits ≠ AI accuracy (a parent may edit a correct
      // value, or leave a wrong one, and post-confirm edits are included).
      events_confirmed_edited: eventsEdited,
      field_edit_counts: COMPARED_FIELDS.map(f => ({ field: f, count: fieldEditCounts[f] })),
    },

    duplicates: {
      measured: false,
      reason: NOT_MEASURED.duplicates,
    },

    parent_effort: {
      events_confirmed: eventsConfirmed,
      events_confirmed_unchanged: eventsUnchanged,
      events_confirmed_edited: eventsEdited,
      events_confirmed_then_deleted: eventsConfirmedThenDeleted,
      events_discarded: eventsDiscarded,
      events_pending: eventsPending,
      events_pending_stale: eventsPendingStale,
      oldest_pending_days: oldestPendingDays,
      emails_pending_review: emailStates.pending_review,
    },

    reliability: {
      // Current state, not first-attempt: a successful retry clears 'failed'.
      failure_rate: ratio(emailStates.failed, emailsProcessed),
      emails_stuck: emailStates.stuck,
      // Received → first event staged. Only emails that produced staged
      // events; a retried email includes the wait before the retry.
      latency_ms: { median: percentile(latencies, 0.5), p90: percentile(latencies, 0.9), sample_emails: latencies.length },
      gemini_fallback_emails: emailsClaudeFallback,
      gemini_fallback_rate: ratio(emailsClaudeFallback, emailsWithProvider),
      retries: { measured: false, reason: NOT_MEASURED.retries },
    },

    funnel: {
      emails: [
        { key: 'received', label: 'Received', count: emailsReceived },
        { key: 'processed', label: 'Processed', count: emailsProcessed },
        { key: 'extracted', label: 'Extracted ≥1 event', count: emailsExtracted },
        { key: 'staged', label: 'Staged for review', count: emailsStaged },
        { key: 'confirmed', label: '≥1 event confirmed', count: emailsWithConfirmed },
      ],
      events: [
        { key: 'extracted', label: 'Extracted', count: eventsExtracted },
        { key: 'staged', label: 'Staged (valid date)', count: eventsStaged },
        { key: 'confirmed', label: 'Confirmed', count: eventsConfirmed },
      ],
      // Exits from the 'staged' step — each sums to that step's count.
      email_outcomes: [
        { key: 'confirmed', label: '≥1 event confirmed', count: emailOutcomes.confirmed },
        { key: 'discarded', label: 'All events discarded', count: emailOutcomes.discarded },
        { key: 'pending', label: 'Awaiting review', count: emailOutcomes.pending },
      ],
      event_outcomes: [
        { key: 'confirmed', label: 'Confirmed', count: eventsConfirmed },
        { key: 'discarded', label: 'Discarded', count: eventsDiscarded },
        { key: 'pending', label: 'Awaiting review', count: eventsPending },
      ],
    },

    // Rows whose stored status contradicts their links. Counted above by
    // their effective outcome; surfaced here so the bug stays visible.
    data_integrity: {
      events_marked_discarded_but_confirmed: stagingStatusMismatch,
      emails_marked_discarded_but_confirmed: emailStatusMismatch,
    },

    problems: problems.slice(0, MAX_PROBLEMS),
    problems_total: problems.length,
  };
}

// ─── Drill-down ──────────────────────────────────────────────────────────────

async function fetchEmailDetail(db, id, { includeBody = false, now = Date.now() } = {}) {
  const columns = includeBody ? `${QUEUE_COLUMNS}, raw_body, raw_html` : QUEUE_COLUMNS;
  const { data: queueRow, error } = await db.from('email_ingestion_queue').select(columns).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!queueRow) return null;

  const stagingRows = await fetchAllPages(() => db
    .from('event_staging').select(STAGING_COLUMNS).eq('queue_id', id).order('created_at', { ascending: true }));
  const eventRows = await fetchByIds(db, 'events', EVENT_COLUMNS, 'id', stagingRows.map(s => s.event_id));
  const a = analyseEmail(queueRow, stagingRows, new Map(eventRows.map(e => [e.id, e])), now);

  return {
    email: {
      id: queueRow.id,
      subject: queueRow.raw_subject,
      from_address: queueRow.from_address,
      to_address: queueRow.to_address,
      parent_matched: !!queueRow.user_id,
      received_at: queueRow.received_at,
      updated_at: queueRow.updated_at,
      status: queueRow.status,
      state: a.emailState,
      error_message: queueRow.error_message,
      failure_reason: a.failureReason ? FAILURE_REASONS[a.failureReason] : null,
      provider: a.provider,
      gemini_error: a.geminiError,
      confidence_score: queueRow.confidence_score,
      latency_ms: a.latencyMs,
      ...(includeBody ? { raw_body: queueRow.raw_body ?? null, raw_html: queueRow.raw_html ?? null } : {}),
    },
    issues: problemIssues(queueRow, a),
    extracted_count: a.extractedCount,
    dropped_events: a.droppedEvents.map(e => ({ title: e?.title ?? null, date: e?.date ?? null })),
    staged_events: a.staged.map(s => ({
      staging_id: s.staging.id,
      title: s.staging.title,
      date: s.staging.date,
      outcome: s.outcome,
      stored_status: s.staging.status,
      confidence_score: s.staging.confidence_score,
      event_id: s.staging.event_id,
      pending_days: s.pendingDays,
      ai_values: Object.fromEntries(COMPARED_FIELDS.map(f => [f, s.staging[f] ?? null])),
      changes: s.changes,
    })),
  };
}

module.exports = {
  fetchQualityData,
  computeQualityMetrics,
  fetchEmailDetail,
  // exported for tests
  normaliseField,
  diffStagingAgainstEvent,
  classifyFailure,
  senderDomain,
};
