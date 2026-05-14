const { GoogleGenerativeAI } = require('@google/generative-ai');

const EXTRACTION_PROMPT = `You are an AI assistant helping parents manage school events.

Extract ALL school events from the following email. For each event return a JSON object.

Return ONLY a valid JSON array, nothing else. No markdown, no explanation.

Required format:
[
  {
    "title": "string",
    "date": "YYYY-MM-DD",
    "time_start": "HH:MM" or null,
    "time_end": "HH:MM" or null,
    "venue": "string or null",
    "year_group": "Year 1-6 or All",
    "category": "holiday|sports|swimming|music|parent|report|exam|trip|general",
    "description": "any extra details e.g. bring £5, wear PE kit",
    "actions": [
      { "text": "action the parent needs to take", "deadline": "YYYY-MM-DD or null" }
    ],
    "confidence_score": 0.0-1.0
  }
]

Rules:
- If no year is specified, use the current year (2026) for future dates, 2027 for past dates
- If no time is specified, use null
- Extract EVERY event mentioned, even if briefly
- confidence_score reflects how certain you are about the date/details
- actions should be concrete parent tasks (e.g. "Return permission slip", "Pay £5 online")
`;

async function extractEventsFromEmail({ subject, body, html }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const emailContent = `Subject: ${subject || '(no subject)'}

${body || html || '(no content)'}`;

  const result = await model.generateContent(EXTRACTION_PROMPT + '\n\nEmail:\n' + emailContent);
  const text = result.response.text().trim()
    .replace(/^```json\n?/, '').replace(/\n?```$/, '');

  let events;
  try {
    events = JSON.parse(text);
  } catch (e) {
    throw new Error('Failed to parse Gemini response as JSON: ' + text.substring(0, 200));
  }

  if (!Array.isArray(events)) events = [events];

  // Overall confidence = average of individual scores
  const avgConfidence = events.reduce((sum, e) => sum + (e.confidence_score || 0.8), 0) / events.length;

  return { events, confidence_score: Math.round(avgConfidence * 100) / 100 };
}

module.exports = { extractEventsFromEmail };
