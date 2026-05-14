require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { bulkIndex } = require('../src/services/elasticService');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Fetching all events from Supabase...');
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Failed to fetch events:', error.message);
    process.exit(1);
  }

  console.log(`Fetched ${events.length} events. Indexing into Elastic...`);
  const result = await bulkIndex(events);
  console.log('Done:', result);
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
