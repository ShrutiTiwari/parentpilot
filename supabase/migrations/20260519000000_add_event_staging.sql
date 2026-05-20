-- ─────────────────────────────────────────────────────────────────────────────
-- event_staging: per-event review lifecycle
--
-- One row per event extracted from an inbound email.
-- Replaces the JSONB blob approach (extracted_data on email_ingestion_queue)
-- which made per-event confirm/discard impossible.
--
-- Lifecycle: pending → confirmed (event created) | discarded (parent dismissed)
-- Queue item closes when all its staging rows are resolved.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_staging (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id         uuid NOT NULL REFERENCES email_ingestion_queue(id) ON DELETE CASCADE,
  title            text NOT NULL,
  date             date NOT NULL,
  time_start       time,
  time_end         time,
  venue            text,
  year_group       varchar NOT NULL DEFAULT 'All',
  category         varchar NOT NULL DEFAULT 'general',
  description      text,
  actions          jsonb DEFAULT '[]',
  confidence_score numeric(3,2),
  status           varchar NOT NULL DEFAULT 'pending',
  -- pending | confirmed | discarded
  event_id         integer REFERENCES events(id) ON DELETE SET NULL,
  -- populated after parent confirms
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Index for the pending endpoint — fetches all pending rows for a set of queue ids
CREATE INDEX IF NOT EXISTS idx_event_staging_queue_status
  ON event_staging (queue_id, status);

-- Note: discarded rows are kept indefinitely for audit purposes.
-- Post-hackathon: add a pg_cron job to hard-delete rows where
-- status = 'discarded' AND updated_at < now() - interval '7 days'.
