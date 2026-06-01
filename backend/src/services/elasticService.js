const { Client } = require('@elastic/elasticsearch');

const INDEX = 'school-events';

let client;
function getClient() {
  if (!client) {
    const node = process.env.ELASTIC_ENDPOINT;
    const apiKey = process.env.ELASTIC_API_KEY;
    if (!node || !apiKey) throw new Error('Elastic not configured');
    client = new Client({ node, auth: { apiKey } });
  }
  return client;
}

// ─── Create index with mapping ────────────────────────────────────────────────
async function ensureIndex() {
  const es = getClient();
  const exists = await es.indices.exists({ index: INDEX });
  if (exists) return;

  await es.indices.create({
    index: INDEX,
    mappings: {
      properties: {
        id:          { type: 'integer' },
        title:       { type: 'text' },
        date:        { type: 'date' },
        time_start:  { type: 'keyword' },
        time_end:    { type: 'keyword' },
        year_group:  { type: 'keyword' },
        year_groups: { type: 'keyword' },
        category:    { type: 'keyword' },
        event_type:  { type: 'keyword' },
        description: { type: 'text' },
        venue:       { type: 'text' },
        school_id:   { type: 'keyword' },
        source:      { type: 'keyword' },
        status:      { type: 'keyword' },
      },
    },
  });
}

// ─── Index a single event ─────────────────────────────────────────────────────
async function indexEvent(event) {
  const es = getClient();
  await ensureIndex();
  await es.index({
    index: INDEX,
    id: String(event.id),
    document: {
      id:          event.id,
      title:       event.title,
      date:        event.date,
      time_start:  event.time_start || null,
      time_end:    event.time_end || null,
      year_group:  event.year_group,
      year_groups: event.year_groups || [event.year_group],
      category:    event.category,
      event_type:  event.event_type,
      description: event.description || '',
      venue:       event.venue || '',
      school_id:   event.school_id || null,
      source:      event.source || 'manual',
      status:      event.status || 'confirmed',
    },
  });
}

// ─── Conflict detection ───────────────────────────────────────────────────────
// Returns events on the same date for the same year group (or All)
async function findConflicts({ date, year_group, exclude_id }) {
  const es = getClient();
  await ensureIndex();

  const must = [
    { term: { date } },
  ];

  // Match year group OR "All"
  const yearGroupFilter = {
    bool: {
      should: [
        { term: { year_group: year_group } },
        { term: { year_group: 'All' } },
        { term: { year_groups: year_group } },
        { term: { year_groups: 'All' } },
      ],
      minimum_should_match: 1,
    },
  };

  const query = { bool: { must, filter: [yearGroupFilter] } };

  const result = await es.search({
    index: INDEX,
    query,
    size: 5,
  });

  let hits = result.hits.hits.map(h => h._source);

  // Exclude the event being confirmed (avoid self-conflict)
  if (exclude_id) {
    hits = hits.filter(h => String(h.id) !== String(exclude_id));
  }

  return hits;
}

// ─── Duplicate detection ──────────────────────────────────────────────────────
// Fuzzy title match on same date — catches "Sports Day" vs "Annual Sports Morning"
async function findDuplicates({ title, date }) {
  const es = getClient();
  await ensureIndex();

  const result = await es.search({
    index: INDEX,
    query: {
      bool: {
        must: [
          { match: { title: { query: title, fuzziness: 'AUTO' } } },
          { term: { date } },
        ],
      },
    },
    size: 3,
  });

  return result.hits.hits.map(h => h._source);
}

// ─── Bulk index all events from Supabase ──────────────────────────────────────
async function bulkIndex(events) {
  const es = getClient();
  await ensureIndex();

  const operations = events.flatMap(event => [
    { index: { _index: INDEX, _id: String(event.id) } },
    {
      id:          event.id,
      title:       event.title,
      date:        event.date,
      time_start:  event.time_start || null,
      time_end:    event.time_end || null,
      year_group:  event.year_group,
      year_groups: event.year_groups || [event.year_group],
      category:    event.category,
      event_type:  event.event_type,
      description: event.description || '',
      venue:       event.venue || '',
      school_id:   event.school_id || null,
      source:      event.source || 'manual',
      status:      event.status || 'confirmed',
    },
  ]);

  const result = await es.bulk({ operations });
  const errors = result.items.filter(i => i.index?.error);
  return { total: events.length, errors: errors.length };
}

// ─── Remove a single event from index ────────────────────────────────────────
async function unindexEvent(eventId) {
  try {
    const es = getClient();
    await es.delete({ index: INDEX, id: String(eventId) });
  } catch (err) {
    // 404 means it was never indexed — not an error
    if (err?.meta?.statusCode !== 404) throw err;
  }
}

module.exports = { indexEvent, unindexEvent, findConflicts, findDuplicates, bulkIndex, ensureIndex };
