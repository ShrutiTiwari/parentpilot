const assert = require('assert');
const svc = require('../src/services/qualityMetricsService');
const now = Date.parse('2026-11-16T12:00:00Z');
const ago = (min) => new Date(now - min * 60000).toISOString();
const ev = (title, date) => ({ title, date });

const queueRows = [
  // q1: 2 events extracted, 1 invalid date; one confirmed unchanged (time format differs), pending_review w/ 1 stale pending
  { id: 'q1', user_id: 'u1', raw_subject: 'Nativity', from_address: 'Office <office@school.sch.uk>', received_at: ago(60*24*9), status: 'pending_review',
    extracted_data: { events: [ev('Nativity','2026-12-10'), ev('Fayre','2026-12-00'), ev('Pickup','2026-12-11')], provider: 'gemini' } },
  // q2: failed parse
  { id: 'q2', user_id: null, raw_subject: 'x', from_address: 'a@b.com', received_at: ago(120), status: 'failed', error_message: 'Failed to parse AI response as JSON: blah', extracted_data: null },
  // q3: stuck
  { id: 'q3', user_id: 'u1', received_at: ago(30), status: 'processing' },
  // q4: in-flight
  { id: 'q4', user_id: 'u1', received_at: ago(2), status: 'processing' },
  // q5: no events found
  { id: 'q5', user_id: 'u1', received_at: ago(300), status: 'confirmed', extracted_data: { events: [], provider: 'claude', gemini_error: '429' } },
  // q6: confirmed with edits on date + venue, plus a confirmed-then-deleted, plus discarded
  { id: 'q6', user_id: 'u2', received_at: ago(600), status: 'confirmed', extracted_data: { events: [ev('Sports','2026-12-01'), ev('Disco','2026-12-02'), ev('Bake','2026-12-03')], provider: 'claude' } },
  // q7: dates all invalid -> failed
  { id: 'q7', user_id: 'u2', received_at: ago(700), status: 'failed', error_message: "Found 1 event(s) but couldn't determine a date", extracted_data: { events: [ev('Vague', null)], provider: 'gemini' } },
];
const stagingRows = [
  { id: 's1', queue_id: 'q1', title: 'Nativity', date: '2026-12-10', time_start: '14:00:00', venue: null, category: 'general', year_group: 'All', description: 'd', status: 'confirmed', event_id: 1, created_at: new Date(Date.parse(queueRows[0].received_at)+4000).toISOString() },
  { id: 's2', queue_id: 'q1', title: 'Pickup', date: '2026-12-11', status: 'pending', event_id: null, created_at: new Date(Date.parse(queueRows[0].received_at)+5000).toISOString() },
  { id: 's3', queue_id: 'q6', title: 'Sports', date: '2026-12-01', venue: 'Field', category: 'sports', year_group: 'Y3', status: 'confirmed', event_id: 2, created_at: new Date(Date.parse(queueRows[5].received_at)+10000).toISOString() },
  { id: 's4', queue_id: 'q6', title: 'Disco', date: '2026-12-02', status: 'confirmed', event_id: null, created_at: new Date(Date.parse(queueRows[5].received_at)+10000).toISOString() },
  { id: 's5', queue_id: 'q6', title: 'Bake', date: '2026-12-03', status: 'discarded', event_id: null, created_at: new Date(Date.parse(queueRows[5].received_at)+10000).toISOString() },
];
const eventRows = [
  { id: 1, title: 'Nativity ', date: '2026-12-10', time_start: '14:00', venue: '', category: 'General', year_group: 'All', description: 'd' },
  { id: 2, title: 'Sports', date: '2026-12-02', venue: 'Church', category: 'sports', year_group: 'Y3' },
];
const m = svc.computeQualityMetrics({ queueRows, stagingRows, eventRows, days: 30, now });
const c = m.coverage;
assert.deepStrictEqual([c.emails_received, c.emails_processed, c.emails_processing, c.emails_stuck, c.emails_failed, c.emails_pending_review, c.emails_confirmed, c.emails_no_events_found, c.emails_unmatched_parent], [7, 5, 1, 1, 2, 1, 1, 1, 1]);
const x = m.extraction;
assert.strictEqual(x.events_extracted, 7);
assert.strictEqual(x.events_staged, 5);
assert.strictEqual(x.events_dropped_invalid_date, 2);
assert.strictEqual(x.failures_by_reason.find(r => r.key==='unparseable_ai_output').count, 1);
assert.strictEqual(x.failures_by_reason.find(r => r.key==='no_valid_date').count, 1);
assert.deepStrictEqual(x.field_edit_counts.filter(f=>f.count).map(f=>f.field), ['date','venue']);
const p = m.parent_effort;
assert.deepStrictEqual([p.events_confirmed, p.events_confirmed_unchanged, p.events_confirmed_edited, p.events_confirmed_then_deleted, p.events_discarded, p.events_pending, p.events_pending_stale], [3,1,1,1,1,1,1]);
const r = m.reliability;
assert.strictEqual(r.failure_rate, 2/5);
assert.strictEqual(r.gemini_fallback_emails, 2);
assert.strictEqual(r.gemini_fallback_rate, 2/4);
assert.strictEqual(r.latency_ms.sample_emails, 2);
assert.strictEqual(r.latency_ms.median, 4000);
assert.strictEqual(r.latency_ms.p90, 10000);
assert.deepStrictEqual(m.funnel.emails.map(f=>f.count), [7,5,3,2,2]);
assert.deepStrictEqual(m.funnel.events.map(f=>f.count), [7,5,3]);
const byId = Object.fromEntries(m.problems.map(pr => [pr.queue_id, pr]));
assert.deepStrictEqual(Object.keys(byId).sort(), ['q1','q2','q3','q6','q7']);
assert.deepStrictEqual(byId.q1.issues.map(i=>i.type), ['dropped_events','stale_review']);
assert.deepStrictEqual(byId.q2.issues.map(i=>i.type), ['failed','unmatched_parent']);
assert.deepStrictEqual(byId.q6.issues.map(i=>i.type), ['heavy_edits']);
assert.deepStrictEqual(byId.q7.issues.map(i=>i.type), ['failed']); // dropped not double-reported on failed
assert.strictEqual(byId.q1.sender_domain, 'school.sch.uk');
assert.strictEqual(m.problems[0].severity, 'high');
assert.strictEqual(m.duplicates.measured, false);
// empty window
const e = svc.computeQualityMetrics({ queueRows: [], stagingRows: [], eventRows: [], days: 7, now });
assert.strictEqual(e.reliability.failure_rate, null);
assert.strictEqual(e.reliability.latency_ms.median, null);
console.log('all assertions passed');

// status overwrite: staging 'discarded' but linked to an event; queue 'discarded'
{
  const q = [{ id: 'm1', user_id: 'u', received_at: ago(100), status: 'discarded', extracted_data: { events: [ev('A','2026-12-01'), ev('B','2026-12-02')], provider: 'gemini' } }];
  const s = [
    { id: 'x1', queue_id: 'm1', title: 'A', date: '2026-12-01', status: 'discarded', event_id: 9, created_at: ago(99) },
    { id: 'x2', queue_id: 'm1', title: 'B', date: '2026-12-02', status: 'discarded', event_id: null, created_at: ago(99) },
  ];
  const mm = svc.computeQualityMetrics({ queueRows: q, stagingRows: s, eventRows: [{ id: 9, title: 'A', date: '2026-12-01' }], days: 7, now });
  assert.strictEqual(mm.parent_effort.events_confirmed, 1);
  assert.strictEqual(mm.parent_effort.events_confirmed_unchanged, 1);
  assert.strictEqual(mm.parent_effort.events_discarded, 1);
  assert.strictEqual(mm.coverage.emails_confirmed, 1);
  assert.strictEqual(mm.coverage.emails_discarded, 0);
  assert.deepStrictEqual(mm.data_integrity, { events_marked_discarded_but_confirmed: 1, emails_marked_discarded_but_confirmed: 1 });
  assert.deepStrictEqual(mm.problems[0].issues.map(i => i.type), ['status_mismatch']);
  console.log('mismatch assertions passed');
}

// funnel outcomes: sum to the staged step, mutually exclusive
{
  const o = (arr) => Object.fromEntries(arr.map(x => [x.key, x.count]));
  // main fixture: q1 (1 confirmed + 1 pending) → confirmed; q6 (2 confirmed + 1 discarded) → confirmed
  assert.deepStrictEqual(o(m.funnel.email_outcomes), { confirmed: 2, discarded: 0, pending: 0 });
  assert.deepStrictEqual(o(m.funnel.event_outcomes), { confirmed: 3, discarded: 1, pending: 1 });
  const q = [
    { id: 'a', user_id: 'u', received_at: ago(10), status: 'pending_review', extracted_data: { events: [ev('A','2026-12-01'), ev('B','2026-12-02')] } },
    { id: 'b', user_id: 'u', received_at: ago(10), status: 'discarded', extracted_data: { events: [ev('C','2026-12-01')] } },
  ];
  const s = [
    { id: 'a1', queue_id: 'a', title: 'A', date: '2026-12-01', status: 'pending', event_id: null, created_at: ago(9) },
    { id: 'a2', queue_id: 'a', title: 'B', date: '2026-12-02', status: 'discarded', event_id: null, created_at: ago(9) },
    { id: 'b1', queue_id: 'b', title: 'C', date: '2026-12-01', status: 'discarded', event_id: null, created_at: ago(9) },
  ];
  const r2 = svc.computeQualityMetrics({ queueRows: q, stagingRows: s, eventRows: [], days: 7, now });
  assert.deepStrictEqual(o(r2.funnel.email_outcomes), { confirmed: 0, discarded: 1, pending: 1 });
  assert.deepStrictEqual(o(r2.funnel.event_outcomes), { confirmed: 0, discarded: 2, pending: 1 });
  const sum = (arr) => arr.reduce((t, x) => t + x.count, 0);
  for (const r of [m, r2]) {
    assert.strictEqual(sum(r.funnel.email_outcomes), r.funnel.emails.find(f => f.key === 'staged').count);
    assert.strictEqual(sum(r.funnel.event_outcomes), r.funnel.events.find(f => f.key === 'staged').count);
  }
  console.log('outcome assertions passed');
}
