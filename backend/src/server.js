const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const multer = require('multer');
const { extractDataFromImage } = require('./services/imageService');
const { createClient } = require('@supabase/supabase-js');
const { devLog, devWarn, devError } = require('./utils/logger');
const schoolDiscoveryService = require('./services/schoolDiscoveryService');
const termDatesService = require('./services/termDatesService');
const { CLAUDE_CONFIG, OPENAI_CONFIG } = require('./config/llmConfig');
const { extractEventsFromEmail } = require('./services/geminiService');
const { indexEvent, unindexEvent, findConflicts, findDuplicates } = require('./services/elasticService');
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
      'http://localhost:8081',
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

app.use((req, res, next) => {
  // Postmark webhooks include base64 attachments — allow up to 20MB for that route
  const limit = req.path === '/api/inbound-email' ? '20mb' : '1mb';
  express.json({ limit })(req, res, next);
});
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
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Extract event from image/PDF ─────────────────────────────────────────────
app.post('/api/extract-event', uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    console.log('extract-event: file present:', !!req.file);
    console.log('extract-event: ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('extract-event: LLM_STRATEGY:', process.env.LLM_STRATEGY);

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mimeType = req.file.mimetype;
    console.log('extract-event: mimetype:', mimeType, 'size:', req.file.size);

    const extractedEvent = await extractDataFromImage(
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

// ─── Postmark inbound email webhook ───────────────────────────────────────────
// Postmark posts JSON to this endpoint when an email is received
// Set this URL in Postmark: https://parentpilot-g1oj.vercel.app/api/inbound-email
app.post('/api/inbound-email', async (req, res) => {
  const startTime = Date.now();
  const log = (step, data) => console.log(JSON.stringify({ step, ...data, ts: new Date().toISOString() }));

  log('webhook_received', { headers: req.headers['x-postmark-signature'] ? 'signed' : 'unsigned' });

  try {
    const {
      Subject: subject,
      TextBody: body,
      HtmlBody: html,
      From: fromAddress,
      ToFull,
      OriginalRecipient,
    } = req.body;

    log('email_parsed', { from: fromAddress, subject, hasBody: !!body, hasHtml: !!html });

    // Use service role key — webhook has no user session, RLS would block inserts
    const db = supabaseAdmin || supabase;
    log('db_client', { type: supabaseAdmin ? 'service_role' : 'anon_WARN' });
    if (!db) {
      log('error', { step: 'db_init', message: 'No Supabase client available' });
      return res.status(200).json({ received: true });
    }

    // Step 1: Store raw email
    const { data: queued, error: insertError } = await db
      .from('email_ingestion_queue')
      .insert({
        raw_subject: subject,
        raw_body: body,
        raw_html: html,
        from_address: fromAddress,
        status: 'processing',
        user_id: null,
      })
      .select()
      .single();

    if (insertError) {
      log('error', { step: 'db_insert', code: insertError.code, message: insertError.message });
      return;
    }

    log('db_insert_ok', { id: queued.id });

    // Step 2: AI extraction
    try {
      const { events, confidence_score } = await extractEventsFromEmail({ subject, body, html });
      log('ai_extraction_ok', { eventCount: events.length, confidence: confidence_score, durationMs: Date.now() - startTime });

      // Step 3: Insert each extracted event into event_staging
      const stagingRows = events.map(e => ({
        queue_id: queued.id,
        title: e.title,
        date: e.date,
        time_start: e.time_start || null,
        time_end: e.time_end || null,
        venue: e.venue || null,
        year_group: e.year_group || 'All',
        category: e.category || 'general',
        description: e.description || null,
        actions: e.actions || [],
        confidence_score: e.confidence_score ?? confidence_score,
        status: 'pending',
      }));

      const { error: stagingError } = await db.from('event_staging').insert(stagingRows);
      if (stagingError) {
        log('error', { step: 'db_staging_insert', code: stagingError.code, message: stagingError.message });
      }

      // Step 4: Update queue row to pending_review (keep extracted_data for audit)
      const { error: updateError } = await db
        .from('email_ingestion_queue')
        .update({
          status: 'pending_review',
          extracted_data: { events },
          confidence_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', queued.id);

      if (updateError) {
        log('error', { step: 'db_update_pending', code: updateError.code, message: updateError.message });
      } else {
        log('pipeline_complete', { id: queued.id, stagingCount: stagingRows.length, totalMs: Date.now() - startTime });
      }
    } catch (extractError) {
      log('error', { step: 'ai_extraction', message: extractError.message });
      await db
        .from('email_ingestion_queue')
        .update({
          status: 'failed',
          error_message: extractError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', queued.id);
    }
  } catch (error) {
    log('error', { step: 'handler', message: error.message });
  }

  // Respond after all processing — Vercel kills the function on res.send()
  res.status(200).json({ received: true });
});

// ─── Get pending review items for a user ──────────────────────────────────────
app.get('/api/inbound-email/pending', async (req, res) => {
  const db = supabaseAdmin || supabase;
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  // Fetch queue items that still have at least one pending staging event
  const { data: queueItems, error: queueError } = await db
    .from('email_ingestion_queue')
    .select('id, raw_subject, raw_body, from_address, received_at, confidence_score, status, error_message')
    .or(`user_id.eq.${user_id},user_id.is.null`)
    .eq('status', 'pending_review')
    .order('received_at', { ascending: false });

  if (queueError) return res.status(500).json({ error: queueError.message });

  if (!queueItems.length) return res.json({ items: [] });

  // Fetch all pending staging events for these queue items
  const queueIds = queueItems.map(q => q.id);
  const { data: stagingEvents, error: stagingError } = await db
    .from('event_staging')
    .select('*')
    .in('queue_id', queueIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (stagingError) return res.status(500).json({ error: stagingError.message });

  // Group staging events by queue_id and attach to queue items
  const stagingByQueue = {};
  for (const ev of stagingEvents) {
    if (!stagingByQueue[ev.queue_id]) stagingByQueue[ev.queue_id] = [];
    stagingByQueue[ev.queue_id].push(ev);
  }

  // Only return queue items that still have pending staging events
  const items = queueItems
    .map(q => ({ ...q, staging_events: stagingByQueue[q.id] || [] }))
    .filter(q => q.staging_events.length > 0);

  res.json({ items });
});

// ─── Delete event (Supabase + Elastic) ───────────────────────────────────────
app.delete('/api/events/:id', async (req, res) => {
  const db = supabaseAdmin || supabase;
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { id } = req.params;
  const { user_id } = req.body;

  try {
    // Null out event_staging references
    await db.from('event_staging').update({ event_id: null }).eq('event_id', id);

    // Delete todos
    await db.from('todos').delete().eq('event_id', id);

    // Delete event
    const { error } = await db.from('events').delete().eq('id', id);
    if (error) throw error;

    // Remove from Elastic (non-blocking)
    unindexEvent(id).catch(err => console.error('Elastic unindex failed:', err.message));

    res.json({ success: true });
  } catch (error) {
    console.error('delete event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Elastic conflict check ───────────────────────────────────────────────────
app.post('/api/events/check-conflicts', async (req, res) => {
  const { date, year_group, exclude_id } = req.body;
  if (!date || !year_group) return res.status(400).json({ error: 'date and year_group required' });

  try {
    const [conflicts, duplicates] = await Promise.all([
      findConflicts({ date, year_group, exclude_id }),
      exclude_id ? Promise.resolve([]) : Promise.resolve([]),
    ]);
    res.json({ conflicts, has_conflicts: conflicts.length > 0 });
  } catch (err) {
    console.error('Conflict check failed:', err.message);
    res.json({ conflicts: [], has_conflicts: false }); // fail open — don't block confirm
  }
});

// ─── Pipeline status / observability (admin only) ────────────────────────────
app.get('/api/inbound-email/pipeline-status', async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers['x-admin-secret'] || req.query.secret;
  if (!adminSecret || provided !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = supabaseAdmin || supabase;
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { data, error } = await db
    .from('email_ingestion_queue')
    .select('id, raw_subject, from_address, status, confidence_score, error_message, received_at, updated_at')
    .order('received_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });

  const summary = {
    total: data.length,
    by_status: data.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {}),
    recent: data,
  };

  res.json(summary);
});

// ─── Confirm a single staging event → create confirmed event ─────────────────
app.post('/api/inbound-email/staging/:stagingId/confirm', async (req, res) => {
  const db = supabaseAdmin || supabase;
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { stagingId } = req.params;
  const { user_id, school_id, event: eventOverride } = req.body;

  try {
    // Fetch the staging row
    const { data: staging, error: fetchError } = await db
      .from('event_staging')
      .select('*')
      .eq('id', stagingId)
      .single();

    if (fetchError || !staging) return res.status(404).json({ error: 'Staging event not found' });

    // Merge any inline edits from the UI (eventOverride) with the staging row
    const e = { ...staging, ...(eventOverride || {}) };
    console.log('staging confirm: actions count =', (e.actions || []).length, JSON.stringify(e.actions));

    // Insert into events table
    const { data: inserted, error: insertError } = await db
      .from('events')
      .insert({
        title: e.title,
        date: e.date,
        time_start: e.time_start || null,
        time_end: e.time_end || null,
        year_group: e.year_group || 'All',
        year_groups: [e.year_group || 'All'],
        category: e.category || 'general',
        description: e.description || null,
        venue: e.venue || null,
        event_type: e.event_type || (school_id ? 'school' : 'personal'),
        visibility: e.event_type === 'school' || school_id ? 'private' : 'private',
        school_id: e.event_type === 'school' ? (school_id || null) : null,
        created_by_user_id: user_id || null,
        status: 'confirmed',
        ingestion_queue_id: staging.queue_id,
        source: 'email',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Insert actions as todos
    const actions = e.actions || [];
    if (actions.length) {
      const { error: todosError } = await db.from('todos').insert(
        actions.map(a => ({
          event_id: inserted.id,
          text: a.text,
          todo_type: 'action',
          deadline: a.deadline || null,
          completed: false,
          created_by_user_id: user_id || null,
        }))
      );
      if (todosError) console.error('todos insert error:', todosError.message);
      else console.log('staging confirm: inserted', actions.length, 'todos for event', inserted.id);
    } else {
      console.log('staging confirm: no actions to insert for event', inserted.id);
    }

    // Mark staging row as confirmed
    await db
      .from('event_staging')
      .update({ status: 'confirmed', event_id: inserted.id, updated_at: new Date().toISOString() })
      .eq('id', stagingId);

    // Claim the queue item for this user if still unclaimed
    await db
      .from('email_ingestion_queue')
      .update({ user_id: user_id || null, updated_at: new Date().toISOString() })
      .eq('id', staging.queue_id)
      .is('user_id', null);

    // Close queue item if all staging events are resolved
    const { data: remaining } = await db
      .from('event_staging')
      .select('id')
      .eq('queue_id', staging.queue_id)
      .eq('status', 'pending');

    if (!remaining?.length) {
      await db
        .from('email_ingestion_queue')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', staging.queue_id);
    }

    // Index in Elastic (non-blocking)
    indexEvent(inserted).catch(err => console.error('Elastic index failed:', err.message));

    res.json({ success: true, event: inserted });
  } catch (error) {
    console.error('staging confirm error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Discard a single staging event ──────────────────────────────────────────
app.post('/api/inbound-email/staging/:stagingId/discard', async (req, res) => {
  const db = supabaseAdmin || supabase;
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { stagingId } = req.params;

  try {
    const { data: staging, error: fetchError } = await db
      .from('event_staging')
      .select('queue_id')
      .eq('id', stagingId)
      .single();

    if (fetchError || !staging) return res.status(404).json({ error: 'Staging event not found' });

    await db
      .from('event_staging')
      .update({ status: 'discarded', updated_at: new Date().toISOString() })
      .eq('id', stagingId);

    // Close queue item if all staging events are resolved
    const { data: remaining } = await db
      .from('event_staging')
      .select('id')
      .eq('queue_id', staging.queue_id)
      .eq('status', 'pending');

    if (!remaining?.length) {
      await db
        .from('email_ingestion_queue')
        .update({ status: 'discarded', updated_at: new Date().toISOString() })
        .eq('id', staging.queue_id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('staging discard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Discard all staging events for a queue item (dismiss whole email) ────────
app.post('/api/inbound-email/:id/discard', async (req, res) => {
  const db = supabaseAdmin || supabase;
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { id } = req.params;

  try {
    await db
      .from('event_staging')
      .update({ status: 'discarded', updated_at: new Date().toISOString() })
      .eq('queue_id', id)
      .eq('status', 'pending');

    await db
      .from('email_ingestion_queue')
      .update({ status: 'discarded', updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Power Parent API running on port ${port}`);
});
