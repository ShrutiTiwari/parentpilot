const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const multer = require('multer');
const { extractDataFromImage } = require('./services/imageService');
const { IMAGE_EXTRACTION_PROMPT } = require('./config/prompts');
const { createClient } = require('@supabase/supabase-js');
const { devLog, devWarn, devError } = require('./utils/logger');
const schoolDiscoveryService = require('./services/schoolDiscoveryService');
const termDatesService = require('./services/termDatesService');
const { CLAUDE_CONFIG, OPENAI_CONFIG } = require('./config/llmConfig');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS
const getAllowedOrigins = () => {
  const origins = [
    'https://parentpilot.vercel.app',
    'https://parentpilot-zeta.vercel.app',
    'https://powerparent.co.uk',
    'https://www.powerparent.co.uk',
  ];
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173',
    );
  }
  return origins;
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (getAllowedOrigins().includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json());
app.set('trust proxy', 1);

// Rate limiters
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use(generalLimiter);

// Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

// Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only images and PDFs are allowed'), false);
    }
    cb(null, true);
  },
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Extract event from image/PDF ─────────────────────────────────────────────
app.post('/api/extract-event', uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mimeType = req.file.mimetype;
    if (!mimeType.startsWith('image/') && mimeType !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be an image or PDF' });
    }

    const extractedEvent = await extractDataFromImage(
      IMAGE_EXTRACTION_PROMPT,
      req.file.buffer,
      req.file.originalname,
      mimeType
    );

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ event: extractedEvent }));
  } catch (error) {
    console.error('extract-event error:', error);
    const isUserFriendly = error.message.includes('refused') ||
      error.message.includes('try again') ||
      error.message.includes('busy');
    res.status(isUserFriendly ? 400 : 500).json({
      error: error.message || 'Failed to extract event',
      type: 'extraction_error',
    });
  }
});

// ─── School discovery ─────────────────────────────────────────────────────────
app.post('/api/schools/discover-website', async (req, res) => {
  try {
    const { schoolName, city, country } = req.body;
    const result = await schoolDiscoveryService.discoverWebsite({ schoolName, city, country });
    res.json(result);
  } catch (error) {
    const err = schoolDiscoveryService.handleError(error);
    res.status(err.statusCode).json({ error: err.error, details: err.details });
  }
});

app.post('/api/schools/discover-term-dates-page', async (req, res) => {
  try {
    const { schoolWebsiteUrl } = req.body;
    if (!schoolWebsiteUrl) return res.status(400).json({ error: 'schoolWebsiteUrl is required' });

    const urlObj = new URL(schoolWebsiteUrl);
    const domain = urlObj.hostname;

    const websiteResponse = await fetch(schoolWebsiteUrl);
    if (!websiteResponse.ok) throw new Error(`Failed to fetch website: ${websiteResponse.statusText}`);
    const html = await websiteResponse.text();

    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const links = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text) {
        try {
          const abs = new URL(href, schoolWebsiteUrl).href;
          const parsed = new URL(abs);
          if (parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)) {
            links.push({ url: abs, text: text.substring(0, 200) });
          }
        } catch (_) {}
      }
    });

    if (links.length === 0) return res.json({ suggestedPages: [] });

    const ImageExtractionStrategyFactory = require('./services/strategies/ImageExtractionStrategyFactory');
    const factory = new ImageExtractionStrategyFactory();
    let strategy, aiService;
    if (factory.isStrategyAvailable('claude')) { strategy = factory.getStrategy('claude'); aiService = 'claude'; }
    else if (factory.isStrategyAvailable('openai')) { strategy = factory.getStrategy('openai'); aiService = 'openai'; }
    else return res.status(503).json({ error: 'AI service unavailable' });

    const prompt = `Analyze these links from a school website and find pages likely containing term dates.
Links: ${JSON.stringify(links.slice(0, 100), null, 2)}
Return JSON: { "pages": [{ "url": "...", "title": "...", "confidence": "high|medium|low", "reasoning": "..." }] }
Top 3 only, sorted by confidence. Return ONLY valid JSON.`;

    let parsed;
    if (aiService === 'claude') {
      const response = await strategy.anthropic.messages.create({
        model: CLAUDE_CONFIG.DEFAULT_MODEL, max_tokens: 1500, temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });
      const raw = response.content?.[0]?.text?.trim().replace(/^```json\s*/i, '').replace(/```\s*$/g, '') || '{}';
      try { parsed = JSON.parse(raw); } catch { parsed = { pages: [] }; }
    } else {
      const completion = await strategy.openai.chat.completions.create({
        model: OPENAI_CONFIG.DEFAULT_MODEL, temperature: 0.3, max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });
      try { parsed = JSON.parse(completion.choices[0].message.content || '{"pages":[]}'); }
      catch { parsed = { pages: [] }; }
    }

    res.json({ suggestedPages: (parsed.pages || []).slice(0, 3) });
  } catch (error) {
    console.error('discover-term-dates-page error:', error);
    res.status(500).json({ error: error.message || 'Failed to discover term dates page' });
  }
});

app.post('/api/schools/extract-term-dates', async (req, res) => {
  try {
    const { termDatesPageUrl, schoolName } = req.body;
    if (!termDatesPageUrl) return res.status(400).json({ error: 'termDatesPageUrl is required' });
    const result = await termDatesService.extractTermDates({ termDatesPageUrl, schoolName });
    res.json(result);
  } catch (error) {
    const err = termDatesService.handleError(error);
    res.status(err.statusCode).json({ success: false, error: err.error, details: err.details });
  }
});

app.post('/api/schools/create', async (req, res) => {
  try {
    const { schoolData } = req.body;
    if (!schoolData?.name) return res.status(400).json({ error: 'schoolData.name is required' });
    if (!supabase) return res.status(503).json({ error: 'Database unavailable' });

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let schoolCode, isUnique = false, attempts = 0;
    while (!isUnique && attempts < 10) {
      schoolCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const { data } = await supabase.from('schools').select('id').eq('school_code', schoolCode).single();
      if (!data) isUnique = true;
      attempts++;
    }

    const { data: school, error } = await supabase.from('schools').insert({
      name: schoolData.name,
      city: schoolData.city || null,
      country: schoolData.country || 'United Kingdom',
      school_code: schoolCode,
      website_url: schoolData.websiteUrl || null,
      term_dates_url: schoolData.termDatesPageUrl || null,
    }).select().single();

    if (error) throw error;
    res.json({ success: true, school: { id: school.id, name: school.name, schoolCode: school.school_code } });
  } catch (error) {
    console.error('create school error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/schools/:schoolId/events', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { events, termDatesPageUrl } = req.body;
    if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });
    if (!events?.length) return res.status(400).json({ error: 'events array is required' });
    if (!supabase) return res.status(503).json({ error: 'Database unavailable' });

    const { data: school, error: schoolError } = await supabase.from('schools').select('id').eq('id', schoolId).single();
    if (schoolError || !school) return res.status(404).json({ error: 'School not found' });

    const toInsert = events.map(e => ({
      title: e.title, date: e.date,
      time_start: e.time_start || '00:00:00', time_end: e.time_end || '00:00:00',
      year_group: e.year_group || 'All', year_groups: e.year_groups || ['All'],
      category: e.category || 'general', source: e.source || termDatesPageUrl || null,
      venue: e.venue || null, school_id: schoolId,
      event_type: 'school', visibility: 'public',
      school_code_required: false, created_by_user_id: null,
    }));

    const existing = await supabase.from('events').select('title, date, school_id')
      .eq('school_id', schoolId).in('title', toInsert.map(e => e.title));

    const newEvents = toInsert.filter(e => !existing.data?.some(
      x => x.title === e.title && x.date === e.date && x.school_id === e.school_id
    ));

    if (!newEvents.length) return res.json({ success: true, eventsCount: 0, message: 'All events already exist' });

    const { error: insertError } = await supabase.from('events').insert(newEvents);
    if (insertError) throw insertError;

    res.json({ success: true, eventsCount: newEvents.length });
  } catch (error) {
    console.error('add events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/schools/create-with-events', async (req, res) => {
  try {
    const { schoolData, events } = req.body;
    if (!schoolData?.name) return res.status(400).json({ error: 'schoolData.name is required' });
    if (!supabase) return res.status(503).json({ error: 'Database unavailable' });

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let schoolCode, isUnique = false, attempts = 0;
    while (!isUnique && attempts < 10) {
      schoolCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const { data } = await supabase.from('schools').select('id').eq('school_code', schoolCode).single();
      if (!data) isUnique = true;
      attempts++;
    }

    const { data: school, error } = await supabase.from('schools').insert({
      name: schoolData.name, city: schoolData.city || null,
      country: schoolData.country || 'United Kingdom', school_code: schoolCode,
      website_url: schoolData.websiteUrl || null, term_dates_url: schoolData.termDatesPageUrl || null,
    }).select().single();

    if (error) throw error;

    let eventsCount = 0;
    if (events?.length) {
      const { error: eventsError } = await supabase.from('events').insert(events.map(e => ({
        title: e.title, date: e.date,
        time_start: e.time_start || '00:00:00', time_end: e.time_end || '00:00:00',
        year_group: e.year_group || 'All', year_groups: e.year_groups || ['All'],
        category: e.category || 'general', source: e.source || schoolData.termDatesPageUrl || null,
        venue: e.venue || null, school_id: school.id,
        event_type: 'school', visibility: 'public',
        school_code_required: false, created_by_user_id: null,
      })));
      if (!eventsError) eventsCount = events.length;
    }

    res.json({ success: true, school: { id: school.id, name: school.name, schoolCode: school.school_code, eventsCount } });
  } catch (error) {
    console.error('create-with-events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Power Parent API running on port ${port}`);
});
