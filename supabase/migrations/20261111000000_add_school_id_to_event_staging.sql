-- ─────────────────────────────────────────────────────────────────────────────
-- event_staging.school_id: the school matched for this extracted event
--
-- Previously there was nowhere to put a resolved school on a staging row, so
-- school attribution relied entirely on the parent's *currently selected*
-- child profile at confirm time — unrelated to which school the email was
-- actually from. A parent with multiple kids at different schools would get
-- events misattributed to whichever child tab happened to be open.
--
-- Populated by the extraction pipeline when it can match the email against
-- one of the logged-in parent's own schools (scoped via child_users ->
-- children -> schools, not a global fuzzy match against every school in the
-- DB). Left null when extraction can't tell — the review UI then shows a
-- dropdown of the parent's own schools instead of silently guessing.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE event_staging
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE SET NULL;
