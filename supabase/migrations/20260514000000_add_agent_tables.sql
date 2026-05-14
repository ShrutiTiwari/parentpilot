-- ─────────────────────────────────────────────────────────────
-- 1. Add missing columns to existing tables
-- ─────────────────────────────────────────────────────────────

ALTER TABLE events ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'confirmed';
ALTER TABLE events ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES children(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ingestion_queue_id uuid;

ALTER TABLE todos ADD COLUMN IF NOT EXISTS deadline date;

-- ─────────────────────────────────────────────────────────────
-- 2. Email Ingestion Queue
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_ingestion_queue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id),
  raw_subject       text,
  raw_body          text,
  raw_html          text,
  from_address      text,
  received_at       timestamptz DEFAULT now(),
  status            varchar DEFAULT 'pending',
  extracted_data    jsonb,
  confidence_score  numeric(3,2),
  event_id          integer REFERENCES events(id),
  error_message     text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- FK from events back to ingestion queue
ALTER TABLE events ADD CONSTRAINT fk_events_ingestion_queue
  FOREIGN KEY (ingestion_queue_id) REFERENCES email_ingestion_queue(id);

-- RLS
ALTER TABLE email_ingestion_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ingestion queue"
  ON email_ingestion_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own ingestion queue"
  ON email_ingestion_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingestion queue"
  ON email_ingestion_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Reminder Schedules
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reminder_schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     integer REFERENCES events(id) ON DELETE CASCADE,
  todo_id      integer REFERENCES todos(id) ON DELETE CASCADE,
  child_id     uuid REFERENCES children(id),
  user_id      uuid REFERENCES profiles(id),
  remind_at    timestamptz NOT NULL,
  channel      varchar DEFAULT 'email',
  status       varchar DEFAULT 'pending',
  sent_at      timestamptz,
  dismissed_at timestamptz,
  message_preview text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminder_schedules_due
  ON reminder_schedules (remind_at, status)
  WHERE status = 'pending';

ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON reminder_schedules FOR SELECT
  USING (auth.uid() = user_id);
