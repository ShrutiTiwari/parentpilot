// A real calendar date in YYYY-MM-DD form.
//
// Shape alone isn't enough: the AI returns placeholder components for a
// partially-known date (e.g. "2026-12-00" for a December event with no day
// given), which matches the regex but blows up a Postgres insert with
// 'date/time field value out of range'. Round-trip through Date to confirm
// the calendar date is real.
//
// Shared by the extraction pipeline (decides which events get staged) and the
// quality dashboard (counts the ones that didn't) so the two can't drift.
function isValidIsoDate(d) {
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const parsed = new Date(`${d}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d;
}

module.exports = { isValidIsoDate };
