-- ─────────────────────────────────────────────────────────────────────────────
-- email_ingestion_queue.to_address: the raw recipient Postmark delivered to
--
-- Postmark's webhook payload includes OriginalRecipient (and ToFull) — the
-- actual address the inbound email arrived at, as seen by Postmark's own
-- mail routing. Unlike From: (which anyone writing an email controls), this
-- isn't spoofable — it's determined by which mailbox the message was
-- actually addressed to and delivered to.
--
-- This value was already being read into the webhook handler and used once
-- to resolve user_id, then discarded — never persisted. That made every
-- past case of "why didn't this resolve to a user" undiagnosable without a
-- live Postmark Activity log lookup (which has its own separate, limited
-- retention). Saving it means every future case is inspectable from the DB
-- directly.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE email_ingestion_queue
  ADD COLUMN IF NOT EXISTS to_address text;

COMMENT ON COLUMN email_ingestion_queue.to_address IS
  'Raw OriginalRecipient (or ToFull[0].Email) from the Postmark webhook — the actual address the inbound email was delivered to. Used to resolve user_id; persisted so resolution failures are diagnosable after the fact.';
