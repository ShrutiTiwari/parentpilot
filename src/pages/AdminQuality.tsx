import React, { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { adminHeaders } from '@/config/admin';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// ─── Types (mirror backend/src/services/qualityMetricsService.js) ────────────

interface FunnelStep { key: string; label: string; count: number }
interface Issue { type: string; severity: 'high' | 'medium' | 'low'; detail: string }
interface Problem {
  queue_id: string;
  received_at: string;
  sender_domain: string | null;
  subject: string | null;
  status: string;
  event_count: number;
  severity: 'high' | 'medium' | 'low';
  issues: Issue[];
}
interface NotMeasured { measured: false; reason: string }

interface QualityMetrics {
  window: { days: number; from: string; to: string };
  thresholds: { stuck_after_minutes: number; stale_review_days: number };
  coverage: Record<string, number>;
  extraction: {
    events_extracted: number;
    events_staged: number;
    events_dropped_invalid_date: number;
    emails_with_dropped_events: number;
    emails_failed: number;
    failures_by_reason: { key: string; label: string; count: number }[];
    events_confirmed_edited: number;
    field_edit_counts: { field: string; count: number }[];
  };
  duplicates: NotMeasured;
  parent_effort: Record<string, number | null>;
  reliability: {
    failure_rate: number | null;
    emails_stuck: number;
    latency_ms: { median: number | null; p90: number | null; sample_emails: number };
    gemini_fallback_emails: number;
    gemini_fallback_rate: number | null;
    retries: NotMeasured;
  };
  funnel: { emails: FunnelStep[]; events: FunnelStep[]; email_outcomes: FunnelStep[]; event_outcomes: FunnelStep[] };
  data_integrity: { events_marked_discarded_but_confirmed: number; emails_marked_discarded_but_confirmed: number };
  problems: Problem[];
  problems_total: number;
}

interface FieldChange { field: string; ai_value: string | null; confirmed_value: string | null }
interface EmailDetail {
  email: {
    id: string;
    subject: string | null;
    from_address: string | null;
    to_address: string | null;
    parent_matched: boolean;
    received_at: string;
    updated_at: string | null;
    status: string;
    state: string;
    error_message: string | null;
    failure_reason: string | null;
    provider: string | null;
    gemini_error: string | null;
    confidence_score: number | null;
    latency_ms: number | null;
    body?: string | null;
  };
  issues: Issue[];
  extracted_count: number;
  dropped_events: { title: string | null; date: string | null }[];
  staged_events: {
    staging_id: string;
    title: string;
    date: string;
    outcome: string;
    stored_status: string;
    confidence_score: number | null;
    event_id: number | null;
    pending_days: number | null;
    ai_values: Record<string, string | null>;
    changes: FieldChange[];
  }[];
}

interface ElasticStatus { ok: boolean; configured: boolean; error?: string }

// ─── Formatting ──────────────────────────────────────────────────────────────

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));
const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);
const share = (n: number, d: number) => (d > 0 ? ` (${Math.round((n / d) * 100)}%)` : '');

function duration(ms: number | null) {
  if (ms === null) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)} min`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)} h`;
  return `${(ms / 86_400_000).toFixed(1)} days`;
}

const dateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const STATE_LABELS: Record<string, string> = {
  processing: 'Processing',
  stuck: 'Stuck',
  pending_review: 'Awaiting review',
  confirmed: 'Confirmed',
  no_events_found: 'No events found',
  discarded: 'Discarded',
  failed: 'Failed',
  confirmed_then_deleted: 'Confirmed, event since deleted',
  pending: 'Pending review',
};

const ISSUE_LABELS: Record<string, string> = {
  failed: 'Failed',
  stuck: 'Stuck',
  unmatched_parent: 'No parent matched',
  dropped_events: 'Events dropped',
  stale_review: 'Stale review',
  status_mismatch: 'Status mismatch',
  heavy_edits: 'Heavy edits',
};

const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-50 text-gray-600 border-gray-200',
};

// ─── Small building blocks ───────────────────────────────────────────────────

function Unit({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">{children}</span>;
}

function NotMeasuredPill({ reason }: { reason: string }) {
  return (
    <span title={reason} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full cursor-help whitespace-nowrap">
      Not measured
    </span>
  );
}

function Row({ label, value, unit, muted }: { label: string; value: React.ReactNode; unit?: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className={`shrink-0 max-w-[60%] ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className="min-w-0 break-words font-medium text-gray-900 tabular-nums text-right">
        {value} {unit && <Unit>{unit}</Unit>}
      </span>
    </div>
  );
}

function MetricCard({ title, headline, headlineLabel, children, note }: {
  title: string;
  headline: React.ReactNode;
  headlineLabel: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      <div className="mt-2 mb-3">
        <div className="text-2xl font-bold text-gray-900 tabular-nums">{headline}</div>
        <div className="text-xs text-gray-500">{headlineLabel}</div>
      </div>
      <div className="divide-y divide-gray-100 flex-1">{children}</div>
      {note && <p className="text-xs text-gray-400 mt-3 leading-snug">{note}</p>}
    </div>
  );
}

const OUTCOME_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500',
  discarded: 'bg-gray-400',
  pending: 'bg-amber-400',
};

// Where the staged items went. Segments are exits from the 'staged' step,
// so they sum to it — shown beside the funnel rather than as another step.
function OutcomeSplit({ unit, stagedCount, outcomes }: { unit: string; stagedCount: number; outcomes: FunnelStep[] }) {
  return (
    <div className="mt-2 rounded-lg border border-gray-100 p-3">
      <div className="text-xs text-gray-500 mb-1.5">
        Outcome of the {stagedCount} staged {unit}
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
        {stagedCount > 0 && outcomes.map(o => (
          <div key={o.key} className={OUTCOME_COLORS[o.key]} style={{ width: `${(o.count / stagedCount) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-600">
        {outcomes.map(o => (
          <span key={o.key} className="inline-flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${OUTCOME_COLORS[o.key]}`} />
            {o.label} <span className="font-semibold text-gray-900 tabular-nums">{o.count}</span>
            <span className="text-gray-400">{share(o.count, stagedCount).trim()}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Funnel({ title, unit, steps, outcomes }: { title: string; unit: string; steps: FunnelStep[]; outcomes: FunnelStep[] }) {
  const top = steps[0]?.count || 0;
  const stagedCount = steps.find(s => s.key === 'staged')?.count ?? 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <Unit>{unit}</Unit>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="rounded-lg border border-gray-100 p-3">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">→</span>}
              {s.label}
            </div>
            <div className="text-lg font-semibold text-gray-900 tabular-nums">{s.count}</div>
            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: top ? `${(s.count / top) * 100}%` : '0%' }} />
            </div>
            <div className="text-[11px] text-gray-400 mt-1">{top ? `${Math.round((s.count / top) * 100)}% of ${steps[0].label.toLowerCase()}` : '—'}</div>
          </div>
        ))}
      </div>
      <OutcomeSplit unit={unit} stagedCount={stagedCount} outcomes={outcomes} />
    </div>
  );
}

// ─── Drill-down ──────────────────────────────────────────────────────────────

function EmailDetailSheet({ queueId, onClose }: { queueId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);

  const load = useCallback(async (includeBody: boolean) => {
    if (!queueId) return;
    setError(null);
    const res = await fetch(API_ENDPOINTS.admin.qualityEmail(queueId, includeBody), { headers: adminHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    setDetail(data);
  }, [queueId]);

  useEffect(() => {
    setDetail(null);
    load(false).catch(err => setError(errorMessage(err)));
  }, [load]);

  const showBody = async () => {
    setLoadingBody(true);
    try { await load(true); } catch (err) { setError(errorMessage(err)); } finally { setLoadingBody(false); }
  };

  return (
    <Sheet open={!!queueId} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto overflow-x-hidden">
        <SheetHeader>
          <SheetTitle className="text-left">{detail?.email.subject || 'Email'}</SheetTitle>
          <SheetDescription className="text-left font-mono text-xs">{queueId}</SheetDescription>
        </SheetHeader>

        {error && <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}
        {!detail && !error && <p className="mt-4 text-sm text-gray-400">Loading…</p>}

        {detail && (
          <div className="mt-4 space-y-5 text-sm">
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</h3>
              <Row label="State" value={STATE_LABELS[detail.email.state] || detail.email.state} />
              {detail.email.state !== detail.email.status && <Row label="Stored status" value={detail.email.status} muted />}
              <Row label="Received" value={dateTime(detail.email.received_at)} />
              <Row label="From" value={detail.email.from_address || '—'} />
              <Row label="Delivered to" value={detail.email.to_address || 'not recorded'} />
              <Row label="Parent matched" value={detail.email.parent_matched ? 'Yes' : 'No'} />
              <Row label="AI provider" value={detail.email.provider || '—'} />
              <Row label="Received → first staged" value={duration(detail.email.latency_ms)} />
              {detail.email.gemini_error && (
                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-800 break-words">
                  <div className="font-semibold">Gemini failed, fell back to {detail.email.provider || 'another provider'}</div>
                  {detail.email.gemini_error}
                </div>
              )}
              {detail.email.error_message && (
                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-xs text-red-700 break-words">
                  {detail.email.failure_reason && <div className="font-semibold">{detail.email.failure_reason}</div>}
                  {detail.email.error_message}
                </div>
              )}
            </section>

            {detail.issues.length > 0 && (
              <section className="flex flex-wrap gap-1.5">
                {detail.issues.map(i => (
                  <span key={i.type} title={i.detail} className={`text-xs border px-2 py-0.5 rounded-full ${SEVERITY_STYLES[i.severity]}`}>
                    {ISSUE_LABELS[i.type] || i.type}
                  </span>
                ))}
              </section>
            )}

            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Events · {detail.extracted_count} extracted, {detail.staged_events.length} staged
              </h3>
              {detail.dropped_events.map((e, i) => (
                <div key={i} className="border border-amber-100 bg-amber-50 rounded-lg p-2 mb-2 text-xs text-amber-800">
                  Dropped (no valid date): <span className="font-medium">{e.title || '(untitled)'}</span> — date "{e.date ?? 'null'}"
                </div>
              ))}
              <div className="space-y-2">
                {detail.staged_events.map(s => (
                  <div key={s.staging_id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-900">{s.title}</div>
                        <div className="text-xs text-gray-500">{s.date}{s.confidence_score !== null && ` · confidence ${s.confidence_score}`}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">{STATE_LABELS[s.outcome] || s.outcome}</span>
                        {s.stored_status !== s.outcome && s.outcome !== 'confirmed_then_deleted' && (
                          <div className="text-[11px] text-amber-600 mt-1">stored as '{s.stored_status}'</div>
                        )}
                      </div>
                    </div>
                    {s.outcome === 'confirmed' && (
                      s.changes.length === 0 ? (
                        <p className="text-xs text-green-700 mt-2">Confirmed without changes</p>
                      ) : (
                        <table className="w-full mt-2 text-xs">
                          <thead>
                            <tr className="text-gray-400 text-left"><th className="font-medium py-1">Field</th><th className="font-medium">AI extracted</th><th className="font-medium">Confirmed</th></tr>
                          </thead>
                          <tbody>
                            {s.changes.map(c => (
                              <tr key={c.field} className="border-t border-gray-100 align-top">
                                <td className="py-1 pr-2 text-gray-600">{c.field}</td>
                                <td className="py-1 pr-2"><span className="text-red-600 bg-red-50 px-1 rounded break-words">{c.ai_value || '(empty)'}</span></td>
                                <td className="py-1"><span className="text-green-700 bg-green-50 px-1 rounded break-words">{c.confirmed_value || '(empty)'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    )}
                    {s.pending_days !== null && <p className="text-xs text-gray-500 mt-2">Waiting {s.pending_days.toFixed(1)} days</p>}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email body</h3>
              {detail.email.body === undefined ? (
                <button onClick={showBody} disabled={loadingBody} className="text-sm text-blue-600 hover:underline disabled:opacity-50">
                  {loadingBody ? 'Loading…' : 'Show body (contains parent/school content)'}
                </button>
              ) : (
                <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                  {detail.email.body || '(empty)'}
                </pre>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminQuality() {
  const [days, setDays] = useState<7 | 30>(7);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [elastic, setElastic] = useState<ElasticStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.admin.quality(days), { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMetrics(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch(API_ENDPOINTS.admin.elasticStatus, { headers: adminHeaders() })
      .then(r => (r.ok ? r.json() : null))
      .then(setElastic)
      .catch(() => setElastic(null));
  }, []);

  const m = metrics;
  const c = m?.coverage;
  const pe = m?.parent_effort;
  const integrity = m?.data_integrity;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quality &amp; Reliability</h1>
            <p className="text-sm text-gray-500 mt-1">
              Emails that reached PowerParent in the last {days} days, and the events extracted from them
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              {([7, 30] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-sm rounded-md ${days === d ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <button onClick={load} disabled={loading} className="text-sm text-blue-600 hover:underline disabled:opacity-50">
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <a href="/admin" className="text-sm text-blue-600 hover:underline">← Admin</a>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        {integrity && (integrity.events_marked_discarded_but_confirmed > 0 || integrity.emails_marked_discarded_but_confirmed > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">Data integrity: </span>
            {integrity.events_marked_discarded_but_confirmed} event(s) are stored as discarded but were confirmed into the calendar
            (their staging row links to a real event), and {integrity.emails_marked_discarded_but_confirmed} email(s) were closed as discarded as a result.
            The counts below treat them as confirmed. Filter the table by “Status mismatch” to inspect.
          </div>
        )}

        {m && c && pe && (
          <>
            {/* Five summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <MetricCard
                title="Email processing coverage"
                headline={<>{c.emails_received} <Unit>emails</Unit></>}
                headlineLabel="received"
                note="Only mail that reached PowerParent. Forwards that never arrived can't be counted."
              >
                <Row label="Processed" value={`${c.emails_processed}${share(c.emails_processed, c.emails_received)}`} unit="emails" />
                <Row label="Awaiting review" value={c.emails_pending_review} unit="emails" />
                <Row label="Confirmed" value={c.emails_confirmed} unit="emails" />
                <Row label="No events found" value={c.emails_no_events_found} unit="emails" />
                <Row label="Discarded" value={c.emails_discarded} unit="emails" />
                <Row label="Failed" value={c.emails_failed} unit="emails" />
                <Row label="Processing / stuck" value={`${c.emails_processing} / ${c.emails_stuck}`} unit="emails" />
                <Row label="No parent matched" value={`${c.emails_unmatched_parent}${share(c.emails_unmatched_parent, c.emails_received)}`} unit="emails" />
              </MetricCard>

              <MetricCard
                title="Extraction quality"
                headline={<>{m.extraction.events_extracted} <Unit>events</Unit></>}
                headlineLabel={`extracted · ${m.extraction.events_staged} staged`}
                note="Parent edits are a proxy, not AI accuracy: parents may edit correct values or keep wrong ones, and edits made after confirming are included."
              >
                <Row label="Dropped: no valid date" value={m.extraction.events_dropped_invalid_date} unit="events" />
                <Row label="Emails with dropped events" value={m.extraction.emails_with_dropped_events} unit="emails" />
                <Row label="Extraction failures" value={m.extraction.emails_failed} unit="emails" />
                {m.extraction.failures_by_reason.filter(r => r.count > 0).map(r => (
                  <Row key={r.key} label={`· ${r.label}`} value={r.count} unit="emails" muted />
                ))}
                <Row label="Edited by parent" value={m.extraction.events_confirmed_edited} unit="events" />
                {m.extraction.field_edit_counts.filter(f => f.count > 0).map(f => (
                  <Row key={f.field} label={`· ${f.field}`} value={f.count} unit="events" muted />
                ))}
              </MetricCard>

              <MetricCard
                title="Duplicate & action quality"
                headline={<NotMeasuredPill reason={m.duplicates.reason} />}
                headlineLabel={m.duplicates.reason}
              >
                <Row label="Duplicates detected" value={<NotMeasuredPill reason={m.duplicates.reason} />} />
                <Row label="Possible matches flagged" value={<NotMeasuredPill reason={m.duplicates.reason} />} />
                <Row label="Unresolved cases" value={<NotMeasuredPill reason={m.duplicates.reason} />} />
                <Row
                  label="Duplicate-check service (now)"
                  value={elastic === null ? '—' : elastic.ok ? 'Reachable' : elastic.configured ? 'Unreachable' : 'Not configured'}
                />
              </MetricCard>

              <MetricCard
                title="Parent effort"
                headline={<>{pe.events_confirmed_unchanged} <Unit>events</Unit></>}
                headlineLabel={`confirmed without changes, of ${pe.events_confirmed} confirmed`}
              >
                <Row label="Confirmed, edited" value={pe.events_confirmed_edited} unit="events" />
                <Row label="Confirmed, since deleted" value={pe.events_confirmed_then_deleted} unit="events" />
                <Row label="Discarded" value={pe.events_discarded} unit="events" />
                <Row label="Pending review" value={pe.events_pending} unit="events" />
                <Row label={`Pending > ${m.thresholds.stale_review_days} days`} value={pe.events_pending_stale} unit="events" />
                <Row label="Oldest pending" value={pe.oldest_pending_days === null ? '—' : `${(pe.oldest_pending_days as number).toFixed(1)} days`} />
                <Row label="Emails awaiting review" value={pe.emails_pending_review} unit="emails" />
              </MetricCard>

              <MetricCard
                title="Processing reliability"
                headline={pct(m.reliability.failure_rate)}
                headlineLabel="of processed emails currently failed"
                note={`Failure rate reflects current state; a successful retry clears it. Latency covers ${m.reliability.latency_ms.sample_emails} email(s) that produced staged events; retried emails include the wait before the retry.`}
              >
                <Row label={`Stuck > ${m.thresholds.stuck_after_minutes} min`} value={m.reliability.emails_stuck} unit="emails" />
                <Row label="Latency median" value={duration(m.reliability.latency_ms.median)} />
                <Row label="Latency p90" value={duration(m.reliability.latency_ms.p90)} />
                <Row label="Fell back to Claude" value={`${m.reliability.gemini_fallback_emails} (${pct(m.reliability.gemini_fallback_rate)})`} unit="emails" />
                <Row label="Retry outcomes" value={<NotMeasuredPill reason={m.reliability.retries.reason} />} />
              </MetricCard>
            </div>

            {/* Funnel */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-5">
              <h2 className="text-base font-semibold text-gray-800">Processing funnel</h2>
              <Funnel title="Emails" unit="emails" steps={m.funnel.emails} outcomes={m.funnel.email_outcomes} />
              <Funnel title="Events from those emails" unit="events" steps={m.funnel.events} outcomes={m.funnel.event_outcomes} />
            </div>

            {/* Problems */}
            <ProblemsTable problems={m.problems} total={m.problems_total} onSelect={setSelected} />
          </>
        )}
      </div>

      <EmailDetailSheet queueId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ProblemsTable({ problems, total, onSelect }: { problems: Problem[]; total: number; onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const types = [...new Set(problems.flatMap(p => p.issues.map(i => i.type)))];
  const shown = filter === 'all' ? problems : problems.filter(p => p.issues.some(i => i.type === filter));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Needs investigation</h2>
          <p className="text-xs text-gray-500">
            One row per email; event-level issues are rolled up to their email. {total > problems.length && `Showing ${problems.length} of ${total}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...types].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`text-xs px-2.5 py-1 rounded-full border ${filter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {t === 'all' ? `All (${problems.length})` : `${ISSUE_LABELS[t] || t} (${problems.filter(p => p.issues.some(i => i.type === t)).length})`}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">Nothing to investigate in this window</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="font-medium py-2 pr-3">Received</th>
                <th className="font-medium py-2 pr-3">Sender</th>
                <th className="font-medium py-2 pr-3">Subject</th>
                <th className="font-medium py-2 pr-3">Email state</th>
                <th className="font-medium py-2">Issues</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(p => (
                <tr
                  key={p.queue_id}
                  onClick={() => onSelect(p.queue_id)}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer align-top"
                >
                  <td className="py-2 pr-3 whitespace-nowrap text-gray-600">{dateTime(p.received_at)}</td>
                  <td className="py-2 pr-3 text-gray-600">{p.sender_domain || '—'}</td>
                  <td className="py-2 pr-3 text-gray-900 max-w-xs truncate">{p.subject || '(no subject)'}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-gray-600">{STATE_LABELS[p.status] || p.status}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {p.issues.map(i => (
                        <span key={i.type} title={i.detail} className={`text-xs border px-2 py-0.5 rounded-full ${SEVERITY_STYLES[i.severity]}`}>
                          {ISSUE_LABELS[i.type] || i.type}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{p.issues.map(i => i.detail).join(' · ')}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
