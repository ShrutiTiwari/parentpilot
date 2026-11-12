# Correlate → Classify → Act: Multi-Email Event Enrichment

> Design decisions for handling fragmented, multi-part communications about the
> same event — status: **designed, not built**. A separate, unrelated fix
> for the duplicate-detection backend surfaced along the way and is worth
> doing regardless of whether the rest of this ships.

---

## The problem

Schools don't send one email per event. A real example from this account —
**"Christmas Nativity"** — arrived as five separate emails:

1. The original notification (date, time, venue)
2. An announcement about costumes
3. A reminder email
4. An announcement about early pickup
5. An announcement about later drop-off, at the church rather than school

Today, each of these becomes its own independent extraction → its own
`event_staging` row → its own review card. The parent sees up to 5 cards for
what is, to them, one event. At best this is noisy; at worst a parent
dismisses a later email as "already got this one" and misses a genuine
detail (the costume requirement, the changed pickup/drop-off logistics)
buried in it.

**Observed frequency:** not measured precisely, but the working assumption
is that this is concentrated in a specific category of event, not spread
evenly — most routine single-purpose events (a permission slip, a one-off
reminder) arrive as a single email, but complex or end-of-term events
(sports day, nativity/productions, school fayres) routinely generate
multiple follow-ups — logistics, costumes, timing changes — precisely
because they're complex enough to need them. This shapes the design below:
the classify/act part is worth building, but its value is concentrated in
that event category, not spread uniformly across every event — worth
confirming with real numbers before over-building for the general case.

---

## Where this started

This started from a real, lived annoyance: **the same event arriving as
multiple separate emails** — the original notice, a reminder, a costume/kit
follow-up — and each one turning into its own review card. The question
that prompted this whole design was "how do other AI systems handle this,
and what's the least-effort way to do it here."

**A duplicate-detection outage is a separate thread, not the origin.** It
came up afterward, when checking why duplicate detection specifically wasn't
flagging anything: the Elastic Cloud cluster backing it had been deleted
(DNS `ENOTFOUND`, not merely paused), silently, for days. `check-conflicts`
fails open on any Elastic error by design, so there was no visible error —
just quietly degraded duplicate detection.

The two threads turned out to be related — fixing correlation is a
prerequisite for the classify/act pipeline below — but they started
independently, for different reasons, and the backend fix would be worth
doing even if the multi-email idea were dropped entirely.

---

## The Correlate → Classify → Act pipeline

This is the core design — the part that didn't exist before in any form.
Today, a second email about an existing event just becomes a second,
independent review card. The question raised was: *should the system
instead recognise it's the same event, and either fold it in or discard it
automatically?*

### Design principle borrowed from elsewhere

This maps to a known pattern across several classes of system —
**entity resolution** (CRM/ticket dedup), **email threading** (support
inboxes), and **update-vs-new classification in agentic pipelines**. The
consistent shape across all of them:

> **Cheap, structural correlation first. LLM reasoning only on the narrowed
> candidate set — never over the whole inbox.**

This keeps LLM cost proportional to actual overlap (which is expected to be
concentrated in complex/end-of-term events, not spread evenly) and keeps
false-merge risk bounded to a small, already-plausible candidate set rather
than a blind classification over everything.

### The three stages

**1. Correlate** — a fuzzy title + date + year-group match against
*confirmed* events belonging to the same parent's own schools/children, run
inside `runExtractionPipeline` right after extraction, before the result is
written to `event_staging`. No LLM call. If nothing clears the similarity
threshold, nothing changes — today's behaviour, a new staging row, unchanged.
(The concrete query this runs on is covered under "Backing this with
Postgres instead of Elasticsearch" below.)

**2. Classify** — only runs if stage 1 found a candidate. One small LLM
call, given the new email's extracted content and the matched event's
current `title` / `description` / `actions`, returns a constrained label
rather than free text:

```json
{
  "relation": "duplicate" | "enrichment" | "unrelated",
  "new_details": {
    "description_addition": "string, only if enrichment",
    "new_actions": [{ "text": "string", "deadline": "YYYY-MM-DD or null" }]
  }
}
```

Three labels, not a binary duplicate/not-duplicate, because a binary
classifier forces the "adds costume details" case to be wrongly treated as
either a full redundant new card or a wrongly-discarded duplicate. The
`enrichment` case is the actual reason this feature is worth building — a
binary design would discard the one case that matters.

**3. Act** — branches on the label:

| Label | Action | Reversible? |
|---|---|---|
| `unrelated` | Correlation was a false positive (e.g. two different "Sports Day" events on different dates/year-groups). Fall through to normal new-staging-row behaviour. | N/A — nothing special happened |
| `duplicate` | Staging row created, immediately marked `status: 'discarded'`, with a logged reason (`auto_discarded_duplicate_of: <event_id>`). **Never hard-deleted.** | Yes — row still exists, auditable, can be manually restored |
| `enrichment` | `description` appended, `new_actions` inserted as `todos` on the *existing* confirmed event. Staging row created and marked with a new status, `merged`, rather than `pending` — so it never becomes a review card, but is fully visible in staging history. | Partially — the merge is logged with before/after, but not auto-reversible without a dedicated undo path (not built in v1) |

### Scope boundary — what auto-merge is *not* allowed to touch

Auto-merge only ever appends to `description` and adds to `actions`/`todos`.
It **never** rewrites `date`, `venue`, or `title` automatically — those stay
parent-owned fields. A follow-up email changing the *time* of an event is a
meaningfully different, higher-stakes case (silently moving a time could
cause a parent to miss an event) and deliberately falls outside this design;
it would need its own explicit "do you want to update the time?" confirmation
step if tackled later.

### Parent-facing surface (deliberately minimal for v1)

No new UI screen. A small, dismissible note on the existing confirmed event
card — *"We added costume details from a follow-up email"* — so a parent
isn't confused by an event changing without their action. This is the only
new UI surface in v1.

No "review what got auto-merged" admin UI either. Rely on the `event_staging`
audit trail (status `merged`/`discarded` + the logged reason) for now; build
a dedicated review UI only if manual auditing in the raw tables turns out to
be genuinely needed in practice.

---

## Backing this with Postgres instead of Elasticsearch

The correlate stage above needs a fuzzy-match query against existing
confirmed events. That capability already existed, via Elasticsearch — this
section covers replacing it, and why.

### Current state (before this work)

- `findConflicts({ date, year_group })` and `findDuplicates({ title, date })`
  in `backend/src/services/elasticService.js` query an Elasticsearch index
  (`school-events`) that mirrors the `events` table.
- Both are called from `POST /api/events/check-conflicts`, itself called from
  the frontend at confirm-time, to show the parent a warning: *"this looks
  like it might already be on your calendar."*
- This is advisory only. Nothing merges, discards, or acts automatically.
  The parent always sees the new card and decides.
- The Elastic index is a simple mirror of columns already native to `events`
  (`title`, `date`, `year_group`/`year_groups`, `description`, `venue`, etc.)
  — it holds no information Postgres doesn't already have.

### Options considered

| Option | Verdict | Why |
|---|---|---|
| **Revive the Elastic Cloud project** | Rejected | Cost unknown without checking Elastic's own console (not inspectable from here); reintroduces an external service with its own failure mode (this exact outage) for a workload — a few hundred events, fuzzy title + date matching — that doesn't need a dedicated search engine. |
| **Move to GCP Cloud SQL / AlloyDB** | Rejected | Same capability as the chosen option below (`pg_trgm` is still just Postgres), but now paying for and operating a *second* Postgres instance alongside Supabase, plus cross-cloud auth/networking. Pure added cost, zero capability gain. |
| **GCP Vertex AI Search / Vector Search** | Rejected (for now) | The real GCP equivalent of Elastic's semantic search — but aimed at large-scale, meaning-based search. Genuine overkill for a few hundred school-calendar rows needing spelling-level fuzzy match, not meaning-based match. Revisit if/when semantic (not spelling) matching is actually needed — see "Explicitly deferred" below. |
| **Typesense / Algolia / Meilisearch** | Rejected | Same shape as Elastic (hosted search service, one more thing to go down), just a different vendor. Doesn't address the core question of whether a dedicated search engine is needed at all here. |
| **Postgres `pg_trgm` inside Supabase** ✅ | **Chosen** | Already the database in use. Trigram similarity (`similarity()`, `%` operator) plus a date/year-group filter reproduces `findConflicts` + `findDuplicates` in one SQL query. Zero new infrastructure, zero new monthly cost, zero new credentials, no new network hop. |

### Why this wins

The actual query shape needed — *same date, fuzzy-matching title, matching
year group, on a dataset of a few hundred rows* — is a "fuzzy `WHERE`
clause" problem, not a search-engine problem. Elastic's relevance tuning,
sharding, and horizontal scale solve problems this workload doesn't have.

### The replacement query

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_events_title_trgm ON events USING gin (title gin_trgm_ops);
```

```sql
SELECT *, similarity(title, $1) AS title_score
FROM events
WHERE date = $2
  AND status = 'confirmed'
  AND (year_group = $3 OR year_group = 'All'
       OR $3 = ANY(year_groups) OR 'All' = ANY(year_groups))
  AND similarity(title, $1) > 0.3
ORDER BY title_score DESC
LIMIT 5;
```

Same inputs (`title`, `date`, `year_group`) and same output shape (a ranked
list of candidate matches) as the current Elastic calls, so `POST /api/events/
check-conflicts` keeps its existing contract — only the implementation
underneath changes. No frontend changes required for this part alone. This
is also the exact query the correlate stage above calls.

### Trade-off accepted

Trigram similarity is weaker than Elastic's relevance tuning for genuinely
large or semantically-varied text. Accepted because the dataset size and
matching need don't exercise that weakness — this is a deliberate "right-size
the tool to the problem," not a capability we expect to miss.

---

## Priority and sequencing

1. **The Postgres backend swap ships regardless of the classify/act
   pipeline.** It fixes a current, real outage (silent, degraded duplicate
   detection) and is a net simplification — same contract, less
   infrastructure. This is not speculative; it's a fix.
2. **The classify/act pipeline is explicitly gated on real usage data**,
   not built on assumption. Before writing it: query actual history for how
   many confirmed events have a same-date, similar-title sibling among
   discarded/failed queue rows, and specifically whether those cluster
   around complex/end-of-term events (sports day, productions, fayres) as
   suspected, rather than being spread evenly. If the overall number is
   small *and* concentrated in a narrow, identifiable category, the
   correlate-only step plus the *existing* advisory conflict-warning UI may
   be enough for the common case — with classify/act possibly worth
   building only for that narrower category first, rather than as a
   general-purpose pipeline.
3. If built, stage ordering matters for cost control: correlate must run
   first and narrow the set before any LLM call. Reversing this — classifying
   every incoming email against everything — was never on the table, for
   both cost and false-merge-rate reasons.

---

## Explicitly deferred / rejected scope

- **Semantic (meaning-based) matching** (e.g. "Sports Day" ≈ "Annual
  Athletics Morning" by meaning, not spelling) — `pg_trgm` only catches
  spelling-level similarity. If this turns out to matter, Vertex AI Vector
  Search (or simpler: asking the extraction LLM to also emit a short
  canonical-summary string per event, then comparing those) is the right
  next tool — not revisiting Elastic.
- **Auto-updating date/venue/title via merge** — out of scope, see scope
  boundary above.
- **A dedicated "review merges" admin UI** — deferred until the raw audit
  trail proves insufficient in practice.
- **A separate Indian-festivals calendar tab** — a related-but-distinct idea
  raised in the same discussion, explicitly parked as likely too large a
  vertical slice (new tables, new nav, new calendar-overlay mechanism,
  ongoing yearly content maintenance) relative to its value; not part of
  this design.

---

## Open question for whoever resumes this

Has anyone pulled the actual numbers from step 2 above — how many real
confirmed events have a same-date, similar-title sibling in the queue
history, and does that cluster around sports days, productions, and other
end-of-term events as suspected? That split — overall volume, and whether
it's concentrated or spread evenly — is the actual go/no-go gate, and also
decides whether classify/act should be scoped to "complex events" as a
category rather than built as a general-purpose pipeline from the start.
