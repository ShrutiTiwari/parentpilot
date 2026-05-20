# Power Parent Agent

> The mental load of parenting is invisible. The agent makes it manageable.

An AI agent that turns school emails into calendar events, tracks every action they demand, and reminds parents at the right moment — so they can be the parent they want to be.

🌐 [Live Demo](https://www.powerparent.co.uk) · [Google Cloud Rapid Agent Hackathon 2026 — Elastic Partner Track]

---

## The problem

Schools send home a constant stream of emails, letters, and WhatsApp messages. Trip permissions. Costume days. Sports days. Payment deadlines. Each event lives in a different silo. Nobody checks for clashes. Reminders either don't exist, or fire too late.

The result: a parent who cares deeply — but is let down by the tools around them.

> *Sports day. Every parent was there. He looked around the field. Then sat down alone.*
> *You found out that evening. This isn't a memory problem. It's a systems problem.*

**The parent is not failing. The tools are failing them.**

---

## What it does

Power Parent Agent catches everything — so parents can show up every time.

```
1 Extract  →  2 Review  →  3 Save  →  4 Remind  →  5 Surface
```

**Forward a school email.** The agent extracts every event and action, checks for clashes, saves to the family calendar, and reminds at the right moment for each action — not just the day before.

**One event. Many actions. Every one tracked.**

| Event | Action | Reminders |
|-------|--------|-----------|
| World Book Day (Thu 6 Mar) | Choose character & costume | 3w · 2w before |
| | Buy costume | 3w · 2w · 1w before |
| | Return permission slip | 1w · 5d · 3d before |
| | Pack bag the night before | 1d · morning of |

The agent doesn't just save the date — it maps every action the event demands, then reminds you at the right moment for each one.

---

## Agent loop

```
Parent forwards school email
        │
        ▼
Postmark inbound webhook → Express backend
        │
        ├─► Supabase: store raw email (status: processing)
        │
        ├─► Gemini 2.0 Flash extraction
        │   (title · date · year group · venue · todos + deadlines · confidence score)
        │   └─► Claude Haiku fallback on quota exceeded
        │
        ├─► Supabase: update queue (status: pending_review)
        │           + insert one row per event into event_staging (status: pending)
        │
        ▼
Per-event review cards on dashboard (human-in-loop approval)
        │   Each extracted event gets its own card — confirm or discard independently
        │
        ├─► Elastic: per-event conflict detection across 700+ events
        │           (clash warning · duplicate detection · shown before confirm)
        │
        └─► Confirm → events + todos saved → staging row marked confirmed
                       → queue closed when all staging events resolved
```

*"Forward me that school email. I'll extract the event, check for clashes, save it, and remind you 3 days before — you just confirm."*

---

## Elastic: the intelligence layer

Supabase stores. Elastic understands.

| Capability | How |
|-----------|-----|
| **Semantic conflict detection** | Date range queries across 700+ events — finds clashes at save time, before they become a problem |
| **Smart duplicate detection** | Vector search catches "Sports Day" = "Annual Sports Morning" — no double entries |
| **RAG-powered resource search** | Parent types a concern, Elastic surfaces NHS guides, local services, school contacts |
| **Natural language timeline** | "What's on next week for Aisha?" — full-text + semantic across all event types |

**Elastic MCP indexes:**
- `school-events` — 700+ events with date fields
- `local-services` — NHS, dentists, tutors by postcode
- `family-history` — past tasks and resolutions
- `parenting-guides` — NHS and CAMHS resources (RAG)

---

## What's already live

**Built before the hackathon:**
- School event calendar (700+ events seeded)
- Multi-child profiles per family
- School and personal event views with filtering
- Todo/task tracking per event
- Supabase backend with RLS

**Built for the hackathon:**
- Email ingestion pipeline (Postmark → Gemini/Claude → review card → confirm)
- `event_staging` table — per-event lifecycle tracking (pending → confirmed / discarded)
- Per-event review cards — each extracted event confirmed or discarded independently
- Unified extraction prompt across email and screenshot flows (same DB-aligned schema)
- `AgentReviewCard` — shared review UI for both email and image extraction paths
- Elastic semantic conflict + duplicate detection per event, shown before confirm
- Screenshot/image extraction flow using the same review card as email
- Human-in-loop review UI with inline editing, confidence scoring, and source collapsible

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + shadcn/ui (PWA, installable) |
| Agent brain | Gemini 2.0 Flash — reasoning, extraction, vision |
| Partner MCP | Elastic MCP Server — semantic search + conflict detection + RAG |
| Database | Supabase — events, todos, family profiles, cron |
| Email ingest | Postmark inbound webhooks |
| Reminders | Supabase Edge Functions — daily cron, progressive cadence |
| Hosting | Vercel (frontend + backend as separate projects) |

---

## Running locally

```bash
# Clone
git clone https://github.com/ShrutiTiwari/parentpilot.git
cd parentpilot

# Frontend
npm install
npm run dev        # Vite on http://localhost:8080

# Backend (separate terminal)
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev        # Express on http://localhost:3000
```

Vite proxies `/api/*` to `localhost:3000` — no CORS config needed locally.

**Required environment variables** (`backend/.env.example`):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — required for webhook inserts that bypass RLS |
| `GEMINI_API_KEY` | Google AI Studio — primary extraction model |
| `ANTHROPIC_API_KEY` | Claude Haiku — fallback when Gemini quota exceeded |
| `ADMIN_SECRET` | Protects `/api/inbound-email/pipeline-status` |

**Database:** Run migrations in order in Supabase SQL editor:
1. `supabase/migrations/20260514000000_add_agent_tables.sql` — email ingestion queue, reminder schedules, agent columns on events/todos
2. `supabase/migrations/20260519000000_add_event_staging.sql` — per-event staging table for the review lifecycle

**Test the pipeline:**
Forward any school email to `6ab6321a948b3ee4872cf3ae8393baaf@inbound.postmarkapp.com` and watch the review card appear on the dashboard within ~10 seconds.

---

## Technical decisions

**Why respond before processing in the webhook handler** — Vercel serverless functions terminate immediately on `res.send()`. The inbound email handler must complete all DB writes and AI extraction before responding. This was a non-obvious gotcha: all async work after `res.json()` is killed silently.

**Why service role key for the webhook** — Postmark webhooks arrive with no user session. Supabase RLS policies require `auth.uid() = user_id`, which fails for server-side inserts with `user_id = null`. The service role key bypasses RLS for backend operations, while the anon key enforces it for client-side queries.

**Why a fallback chain (Gemini → Claude)** — Gemini free tier quota exhausts quickly during development. Rather than returning errors to Postmark (which would trigger retries), the system falls back to Claude Haiku automatically. The extraction prompt is identical — both models return the same JSON contract.

**Why observable state in the DB** — Each email moves through explicit states: `processing → pending_review → confirmed / failed`. Every pipeline step emits structured JSON logs. Pipeline health visible at `/api/inbound-email/pipeline-status` (admin-secured). This makes the agent auditable — a judge can see exactly what the AI extracted and its confidence.

**Why `event_staging` instead of JSONB review** — Early versions stored extracted events as a JSONB blob in `email_ingestion_queue.extracted_data` and reviewed the whole email as one unit. This made per-event lifecycle impossible: if a newsletter had 8 events, you couldn't confirm 3 and discard 5. The `event_staging` table gives each extracted event its own row with its own status (`pending → confirmed / discarded`), enabling accurate per-event conflict detection, independent confirm/discard, and a clean audit trail.

**Why human-in-loop review** — Full automation would require very high confidence thresholds and still produce errors that erode trust fast. A review card takes 2 seconds to confirm and gives the parent full visibility into what the agent extracted. For parenting use cases, trust is everything — an agent that occasionally gets it wrong and tells you is far better than one that silently gets it wrong.

**Why a unified extraction prompt** — Email and screenshot flows originally used different prompts, leading to inconsistent field names (`yearGroup` vs `year_group`), missing fields (`description`, `actions`), and fields that didn't match the DB schema. A single prompt shared across both paths guarantees consistent output regardless of input type.

---

## Roadmap

**After the hackathon:**
- WhatsApp bot intake (parent sends photo of school letter)
- Push notifications (PWA)
- School portal integrations
- Multi-parent household support
- Voice input
- WhatsApp reminder delivery
- Agent completes actions autonomously — surfaces top Amazon picks for costumes, drafts reply emails, books appointments. Parent just approves.

---

## About the builder

Built by Shruti Tiwari — independent AI product builder (2023–present), 20 years backend engineering, former VP at Goldman Sachs. I build AI-native tools rooted in my own experience as a parent of two children in UK primary school.

The will and the intent are there. Every parent has them. Power Parent is the Robin.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
