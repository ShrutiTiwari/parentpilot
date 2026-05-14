# Admin & Operations Guide

## Email Ingestion Pipeline

### Pipeline Status
Check the health of the inbound email pipeline (last 20 emails, status breakdown):

```
GET /api/inbound-email/pipeline-status?secret=<ADMIN_SECRET>
```

- **Local:** `http://localhost:3000/api/inbound-email/pipeline-status?secret=<ADMIN_SECRET>`
- **Production:** `https://parentpilot-g1oj.vercel.app/api/inbound-email/pipeline-status?secret=<ADMIN_SECRET>`

Returns:
```json
{
  "total": 5,
  "by_status": {
    "confirmed": 3,
    "pending_review": 1,
    "failed": 1
  },
  "recent": [ ... ]
}
```

### Pipeline Steps & What Can Go Wrong

| Step | Status in DB | What to check |
|------|-------------|---------------|
| Postmark receives forwarded email | — | Postmark dashboard → Activity |
| Webhook fires to backend | `processing` | Vercel logs → `webhook_received` |
| Raw email saved to Supabase | `processing` | Vercel logs → `db_insert_ok` or `error.db_insert` |
| AI extraction (Gemini → Claude fallback) | `processing` | Vercel logs → `ai_extraction_ok` or `error.ai_extraction` |
| Queue row updated | `pending_review` | Vercel logs → `pipeline_complete` |
| Parent confirms | `confirmed` | Review card disappears from dashboard |

### Vercel Log Format
Each step emits a structured JSON line:
```
{"step":"pipeline_complete","id":"uuid","totalMs":2500,"ts":"..."}
{"step":"error","step":"db_insert","code":"42501","message":"...","ts":"..."}
```

Find logs at: **Vercel → parentpilot-g1oj → Deployments → latest → Functions → src/server.js**

### Common Failures

**`error.db_insert` with code `42501`** — RLS blocking insert. Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel env vars.

**`error.ai_extraction` — GEMINI_API_KEY not configured** — Add `GEMINI_API_KEY` to Vercel env vars.

**`error.ai_extraction` — 429 quota exceeded** — Gemini free tier exhausted. Claude fallback should kick in automatically. Check `ANTHROPIC_API_KEY` is set.

**Card keeps reappearing after confirm** — `SUPABASE_SERVICE_ROLE_KEY` missing so confirm update is silently blocked by RLS.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — bypasses RLS for server-side ops |
| `GEMINI_API_KEY` | Yes | Google AI Studio key for email extraction |
| `ANTHROPIC_API_KEY` | Yes | Claude fallback when Gemini quota exceeded |
| `ADMIN_SECRET` | Yes | Secret for `/api/inbound-email/pipeline-status` |
| `PORT` | No | Defaults to 3000 |

---

## Postmark Configuration

- **Inbound address:** `6ab6321a948b3ee4872cf3ae8393baaf@inbound.postmarkapp.com`
- **Webhook URL:** `https://parentpilot-g1oj.vercel.app/api/inbound-email`
- **Test:** Forward any school email to the inbound address and check pipeline-status within 30 seconds
