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
  let cleaned = text.trim()
    .replace(/^```json\n?/, '').replace(/\n?```$/, '');

  // Models sometimes add explanatory prose before/after the array despite
  // being told not to (e.g. "[]\n```\nThe email contains no events...").
  // Extract just the outermost [...] or {...} rather than trusting the
  // whole trimmed response to be pure JSON.
  const start = cleaned.search(/[[{]/);
  if (start > 0) cleaned = cleaned.slice(start);
  const openChar = cleaned[0];
  const closeChar = openChar === '[' ? ']' : '}';
  const end = cleaned.lastIndexOf(closeChar);
  if (end !== -1 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);

  let events;
  try {
    events = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON: ' + cleaned.substring(0, 200));
  }
  // Models sometimes wrap the array in an object (e.g. { "events": [...] })
  // instead of returning it bare, despite the prompt's required format.
  if (!Array.isArray(events) && Array.isArray(events?.events)) events = events.events;
  if (!Array.isArray(events)) events = [events];
  const avgConfidence = events.length
    ? events.reduce((sum, e) => sum + (e.confidence_score || 0.8), 0) / events.length
    : 0;
  return { events, confidence_score: Math.round(avgConfidence * 100) / 100 };
}

// ─── Provider methods ─────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callClaude(prompt, maxTokens = 8192) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].text;
}

// ─── Shared AI call — swap providers by commenting/uncommenting ───────────────
async function callAI(prompt, maxTokens = 8192) {
  try {
    return await callGemini(prompt);           // PRIMARY: Gemini 2.5 Flash
  } catch (err) {
    console.warn('Gemini failed, falling back to Claude:', err.message);
    return await callClaude(prompt, maxTokens); // FALLBACK: Claude Haiku
  }
}

async function extractEventsFromEmail({ subject, body, html }) {
  const emailContent = `Subject: ${subject || '(no subject)'}

${body || html || '(no content)'}`;

  const prompt = await getActivePrompt();
  const text = await callAI(prompt + '\n\nEmail:\n' + emailContent);
  return parseEventsJson(text);
}

function invalidatePromptCache() {
  cachedPrompt = null;
  cacheExpiry = 0;
}

// ─── Image provider methods ───────────────────────────────────────────────────

async function callGeminiVision(prompt, imageBase64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } },
  ]);
  return result.response.text();
}

async function callClaudeVision(prompt, imageBase64, mimeType, maxTokens = 8192) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: prompt },
      ],
    }],
  });
  return message.content[0].text;
}

// ─── Shared image AI call — swap providers by commenting/uncommenting ─────────
async function callAIVision(prompt, imageBase64, mimeType) {
  try {
    return await callGeminiVision(prompt, imageBase64, mimeType);    // PRIMARY: Gemini 2.5 Flash
  } catch (err) {
    console.warn('Gemini vision failed, falling back to Claude:', err.message);
    return await callClaudeVision(prompt, imageBase64, mimeType);    // FALLBACK: Claude Haiku
  }
}

module.exports = { extractEventsFromEmail, getActivePrompt, invalidatePromptCache, callAI, callAIVision };
