// ─── Unified extraction prompt ────────────────────────────────────────────────
// Used for both email text and image/PDF extraction.
// Output schema matches the events + todos DB tables directly.

const EXTRACTION_PROMPT = `You are an AI assistant helping parents manage their family calendar.

Extract ALL events from the content provided — school events (trips, sports day, parents' evening) as well as personal/family events (medical appointments, clubs, birthdays, any dated commitment). Do not filter to school-only; the parent decides afterward whether each extracted event is a school or personal event. For each event return a JSON object.

Return ONLY a valid JSON array, nothing else. No markdown, no explanation.

Required format:
[
  {
    "title": "string",
    "date": "YYYY-MM-DD",
    "time_start": "HH:MM" or null,
    "time_end": "HH:MM" or null,
    "venue": "string or null",
    "year_group": "Reception" | "Year 1" | "Year 2" | "Year 3" | "Year 4" | "Year 5" | "Year 6" | "All",
    "category": "holiday" | "sports" | "swimming" | "music" | "parent" | "report" | "exam" | "trip" | "general",
    "description": "any extra context e.g. bring £5, wear PE kit, selected by PE staff",
    "actions": [
      { "text": "concrete action the parent needs to take", "deadline": "YYYY-MM-DD or null" }
    ],
    "confidence_score": 0.0-1.0
  }
]

Rules:
- Extract EVERY event mentioned, even if briefly referenced, AS LONG AS you can determine a specific date for it
- date is required (YYYY-MM-DD) and must never be null — if a mention has no determinable date, leave it out of the output entirely rather than guessing or returning date: null
- if no year is specified use 2026 for future dates, 2027 for dates that have already passed
- time_start / time_end in 24-hr HH:MM format; use null if not specified
- year_group: use "All" if not specified, applies to whole school, or the event is personal/non-school (e.g. a medical appointment)
- category: use "general" for personal/family events that don't fit the other categories (e.g. medical appointments, birthdays)
- actions must be concrete parent tasks with realistic deadlines, e.g.:
    "Return permission slip" deadline 1 week before event
    "Pay £5 online" deadline 2 weeks before event
    "Pack swimming kit" deadline day before event
- description captures freetext detail from the source that doesn't fit other fields
- confidence_score: how certain you are about the extracted date and details (0.0–1.0)
`;

// ─── Legacy image-only prompt (retired) ───────────────────────────────────────
// Replaced by EXTRACTION_PROMPT above. Kept for reference only.
// Issues: non-standard date format, single time string, camelCase yearGroup,
//         hardcoded todos instead of extracted actions, no description field,
//         bad example (swimming lesson labelled as music category).
//
// const IMAGE_EXTRACTION_PROMPT = `
// You are a helpful assistant that extracts structured event data from school notices...
// [full old prompt omitted for brevity — see git history]
// `;

module.exports = {
  EXTRACTION_PROMPT,
  // Re-export under old name so any other callers don't break immediately
  IMAGE_EXTRACTION_PROMPT: EXTRACTION_PROMPT,
};
