# Code Quality Stats — AFTER Cleanup

> Snapshot taken: 2026-05-19
> Cleanup performed: removed console.logs, mock data/simulations, sharing service logs

---

## Summary

| Metric | Before | After | Delta |
|---|---|---|---|
| Total lines of code | 39,282 | 38,571 | -711 |
| Total files (TS/TSX/JS/JSX) | 244 | 244 | — |
| `console.log` statements (active) | 462 | 7 | **-455** |
| Files with active console.logs | 62 | 5 | **-57** |

---

## Remaining Active console.logs (Intentional)

| File | Count | Reason |
|---|---|---|
| backend/src/server.js | 2 | Startup log + structured email pipeline observability log |
| backend/src/utils/logger.js | 2 | Logging utility (outputs dev/prod logs) |
| backend/scripts/bulk-index-events.js | 3 | Operational script — logs are expected |

All other `console.log` references in the codebase are either:
- Commented out (`//console.log`) — kept as reference, won't execute
- `console.error` / `console.warn` — retained for genuine error tracking

---

## What Was Cleaned

### console.logs removed
- `src/hooks/useEventManagement.ts` — 37 debug logs (user state, event sync, extract pipeline)
- `src/services/sharingService.ts` — 35 debug logs
- `src/pages/auth/callback.tsx` — 30 auth flow logs
- `src/services/childProfileService.ts` — 25 logs (session checks, school creation)
- `src/pages/Auth.tsx` — 18 auth state logs
- `src/utils/onboardingTest.ts` — 17 dev test logs
- `src/utils/navigationUtils.ts` — 14 navigation logs
- `src/services/dataService.ts` — 12 event CRUD logs
- `backend/src/services/strategies/ClaudeImageExtractionStrategy.js` — 38 extraction pipeline logs
- `backend/src/services/strategies/OpenAIImageExtractionStrategy.js` — 29 extraction pipeline logs
- ... and 45+ other files

### Mock data / simulations removed
- `SchoolDiscoverySection.tsx`: removed fake live counter (`setInterval` randomly incrementing family count)
- `SchoolDiscoverySection.tsx`: replaced `setTimeout` mock search with real `childProfileService.getSchools()` API call
- `SchoolDiscoverySection.tsx`: removed `mockUpcomingEvents` display (was showing hardcoded June/July event dates)

### Staging confirm debug logs removed from backend/src/server.js
- `staging confirm hit: ...` (was checking if endpoint was reached)
- `staging confirm: actions count = ...` (was debugging todo save issue)
- `staging confirm: inserted X todos...` / `staging confirm: no actions...`

---

## Estimated Quality Score

| Dimension | Before | After |
|---|---|---|
| Console log noise | Low (6/10) | High (9/10) |
| Mock/simulation code | Moderate (7/10) | Clean (9/10) |
| Overall | 6.7/10 | ~8.5/10 |

---

## Remaining Technical Debt (Not Addressed This Session)

- `sharingService.ts` and `ConnectionSharingModal.tsx` — ABRSM references still present (learner_id); not deleted as they're imported by UI components. Future work: remove entire sharing tab or replace with PP-native sharing.
- `events.id` is integer (inconsistent with uuid PKs on other tables) — post-hackathon cleanup
- `year_group` varchar and `year_groups` array both exist on events — deprecate singular column
- `onboardingTest.ts` — dev test utility, could be deleted once onboarding is stable
