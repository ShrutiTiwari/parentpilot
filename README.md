# Power Parent

AI agent that turns school emails into calendar events — so parents never miss a sports day, trip deadline, or costume day again.

🌐 [Live Demo](https://www.powerparent.co.uk)

---

## What it does

Schools send home a constant stream of letters and emails — sports days, trip permissions, costume days, exam dates, payment deadlines. Parents are expected to manually track all of it across multiple children, year groups, and schools.

Power Parent removes that entirely. A parent forwards a school email to their unique inbox address. An AI agent extracts every event and action, shows a review card, and on confirmation adds it to the family calendar with reminders.

**The agent loop:**
1. Parent forwards email → Postmark inbound webhook fires
2. Gemini extracts structured event data (title, date, time, year group, venue, actions + deadlines)
3. Claude acts as fallback when Gemini quota is exceeded
4. Review card surfaces on the dashboard — parent sees extracted details + confidence score
5. One tap to confirm → event saved, todos created, reminders scheduled

**Core features already live:**
- School event calendar (700+ events seeded across primary school year groups)
- Multi-child profiles per family
- School and personal event views with filtering
- Todo/task tracking per event
- Email ingestion pipeline (Postmark → Gemini/Claude → review card → confirm)

---

## Why I built this

I have two children in UK primary school. The amount of organisational overhead that falls on parents — particularly working parents — is genuinely significant. A single school week can generate 4–6 emails requiring action: permission slips, payments, kit requirements, date changes.

The problem isn't calendar apps or reminder apps. It's the extraction step — getting unstructured school communications into a structured, actionable format without manual data entry. That's exactly what LLMs are good at.

I also wanted to explore what a genuinely useful agentic loop looks like in a real-world family context: not a chatbot, but a background agent that perceives (email arrives), reasons (extracts structured data, assesses confidence), and acts (surfaces for review, confirms, schedules reminders).

---

## How AI is used

AI involvement is architectural, not cosmetic.

**Extraction agent (Gemini 2.0 Flash → Claude Haiku fallback)**
The core extraction prompt is carefully designed to return a structured JSON array covering all events in a single email — including implicit events ("children may wear non-uniform on the last day of term"), not just explicitly announced ones. Confidence scoring is part of the prompt contract: the model rates each extracted event, and the review card surfaces this to the parent so they can judge borderline extractions.

**Fallback chain for reliability**
Gemini free tier quota exhausts quickly during development. Rather than failing, the system automatically falls back to Claude Haiku. This was a deliberate reliability decision — the pipeline should never return a 500 to Postmark (which would trigger retries), so the fallback chain keeps extraction working even under quota pressure.

**Structured pipeline with observable state**
Each email moves through explicit states in the database: `processing → pending_review → confirmed / failed`. Every step emits structured JSON logs. A pipeline status endpoint shows the last 20 emails and their states. This makes the agent's reasoning auditable — a judge (or a parent) can see exactly what the AI extracted and why it was confident or uncertain.

**What I learned building this**
The hardest part wasn't the extraction — it was designing the review UX. The agent needs to surface enough detail that a parent can make a quick confirm/discard decision without reading the original email. Getting the card layout right (title prominent, confidence badge, actions with deadlines called out) took more iteration than the prompt engineering.

---

## Technical decisions

- **React + TypeScript + Vite + shadcn/ui** — fast iteration on UI components; shadcn gives production-quality accessible components without a design system overhead
- **Express.js backend on Vercel** — deployed as a serverless function; response is sent only after all DB writes complete (Vercel kills the function on `res.send()`, a subtle gotcha with async webhook handlers)
- **Supabase (PostgreSQL + Auth + RLS)** — row-level security means school data is isolated per user; service role key used for server-side webhook operations that have no user session
- **Postmark inbound** — reliable inbound email webhook; processes forwarded emails within seconds
- **Gemini 2.0 Flash** — chosen for extraction over GPT-4 because it handles long school newsletter HTML without truncation and the structured JSON output is more consistent
- **Claude Haiku as fallback** — fast, cheap, reliable for structured extraction tasks; acts as the safety net when Gemini quota is hit
- **`email_ingestion_queue` table** — the agent's working memory. Stores raw email, extracted data, confidence score, and status. Decouples ingestion from review — the webhook returns 200 immediately, processing happens async

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

**Required environment variables** (see `backend/.env.example`):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — required for webhook inserts |
| `GEMINI_API_KEY` | Google AI Studio |
| `ANTHROPIC_API_KEY` | Claude fallback for extraction |
| `ADMIN_SECRET` | Protects `/api/inbound-email/pipeline-status` |

**Database:** Run `supabase/migrations/20260514000000_add_agent_tables.sql` in your Supabase SQL editor to create the `email_ingestion_queue` and `reminder_schedules` tables.

---

## What I'd build next

**Elastic semantic search + conflict detection** — index all events in Elastic; when a new email arrives, vector-search for conflicts before the review card is shown ("You already have swimming on this date for Year 3"). This is the next track in progress.

**Reminder engine** — the `reminder_schedules` table schema is in place. A daily cron job would query confirmed events, generate reminder rows at configurable cadences (3 weeks, 1 week, 1 day, morning-of), and fire via email or push. The cadence logic maps to how parents actually think: costume deadline reminders need to land a week before, not the night before.

**Gmail native integration** — replace the forwarding step with a Gmail OAuth connection that watches the inbox for school emails automatically. The forwarding flow works for a hackathon demo but adds friction for real users.

**Multi-school conflict view** — families with children at different schools see overlapping events (two sports days on the same day). Conflict detection across schools requires semantic matching, not just date matching.

---

## Architecture

```
Parent's email client
        │ forward
        ▼
Postmark inbound webhook
        │ POST /api/inbound-email
        ▼
Express backend (Vercel)
        │
        ├─► Supabase: insert row (status: processing)
        │
        ├─► Gemini 2.0 Flash ──(quota exceeded)──► Claude Haiku
        │         extract structured events + confidence score
        │
        └─► Supabase: update row (status: pending_review)

React dashboard
        │ polls /api/inbound-email/pending
        ▼
Email review card
        │ parent taps "Add to calendar"
        ▼
Express: insert events + todos → update queue (status: confirmed)
```

---

## About the builder

Built by Shruti Tiwari — independent AI product builder (2023–present), 20 years backend engineering, former VP at Goldman Sachs. I build AI-native tools rooted in my own experience as a parent of two children in UK primary school.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
