const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const FALLBACK_PROMPT = `You are an AI assistant helping parents manage school events.

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

// ─── Prompt cache — refreshed every 5 minutes ─────────────────────────────────
let cachedPrompt = null;
let cacheExpiry = 0;

async function getActivePrompt() {
  if (cachedPrompt && Date.now() < cacheExpiry) return cachedPrompt;
  try {
    const db = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await db
      .from('prompt_versions')
      .select('prompt_text')
      .eq('status', 'active')
      .order('activated_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !data) throw new Error('no active prompt');
    cachedPrompt = data.prompt_text;
    cacheExpiry = Date.now() + 5 * 60 * 1000;
    return cachedPrompt;
  } catch {
    return FALLBACK_PROMPT;
  }
}

function parseEventsJson(text) {
  const cleaned = text.trim()
    .replace(/^```json\n?/, '').replace(/\n?```$/, '');
  let events;
  try {
    events = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON: ' + cleaned.substring(0, 200));
  }
  if (!Array.isArray(events)) events = [events];
  const avgConfidence = events.reduce((sum, e) => sum + (e.confidence_score || 0.8), 0) / events.length;
  return { events, confidence_score: Math.round(avgConfidence * 100) / 100 };
}

async function extractWithGemini(emailContent, prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt + '\n\nEmail:\n' + emailContent);
  return result.response.text();
}

async function extractWithClaude(emailContent, prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: prompt + '\n\nEmail:\n' + emailContent
    }]
  });
  return message.content[0].text;
}

async function extractEventsFromEmail({ subject, body, html }) {
  const emailContent = `Subject: ${subject || '(no subject)'}

${body || html || '(no content)'}`;

  const prompt = await getActivePrompt();

  // Try Gemini first, fall back to Claude if quota exceeded
  let text;
  try {
    text = await extractWithGemini(emailContent, prompt);
  } catch (err) {
    if (err.message && err.message.includes('429')) {
      console.warn('Gemini quota exceeded, falling back to Claude');
      text = await extractWithClaude(emailContent, prompt);
    } else {
      throw err;
    }
  }

  return parseEventsJson(text);
}

function invalidatePromptCache() {
  cachedPrompt = null;
  cacheExpiry = 0;
}

module.exports = { extractEventsFromEmail, getActivePrompt, invalidatePromptCache };
