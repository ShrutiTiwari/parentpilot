# Code Quality Stats — BEFORE Cleanup

> Snapshot taken: 2026-05-19
> Purpose: baseline before removing console.logs, mock data, and sharing service

---

## Summary

| Metric | Value |
|---|---|
| Total lines of code | 39,282 |
| Total files (TS/TSX/JS/JSX) | 244 |
| Frontend files (src/) | 219 |
| Backend files (backend/src/) | 14 |
| Frontend lines (src/) | 35,217 |
| Backend lines (backend/src/) | 2,644 |
| `console.log` statements | 462 |
| Files with console.logs | 62 |

---

## console.log Hotspots — Frontend

| Count | File |
|---|---|
| 37 | src/hooks/useEventManagement.ts |
| 35 | src/services/sharingService.ts |
| 30 | src/pages/auth/callback.tsx |
| 25 | src/services/childProfileService.ts |
| 18 | src/pages/Auth.tsx |
| 17 | src/utils/onboardingTest.ts |
| 14 | src/utils/navigationUtils.ts |
| 12 | src/services/versionChecker.ts |
| 12 | src/services/schoolDiscoveryService.ts |
| 12 | src/services/dataService.ts |
| 11 | src/components/schools/term-dates-wizard/Step3EventsReview.tsx |
| 7 | src/services/publicSharingService.ts |
| 7 | src/components/dashboard/AddWeekendPlanDialog.tsx |
| 6 | src/components/dashboard/AddEventTabs.tsx |
| 5 | src/utils/analytics.ts |

## console.log Hotspots — Backend

| Count | File |
|---|---|
| 38 | backend/src/services/strategies/ClaudeImageExtractionStrategy.js |
| 29 | backend/src/services/strategies/OpenAIImageExtractionStrategy.js |
| 12 | backend/src/services/termDatesService.js |
| 11 | backend/src/server.js |
| 7 | backend/src/services/schoolDiscoveryService.js |
| 4 | backend/src/services/imageService.js |
| 2 | backend/src/utils/logger.js |
| 2 | backend/src/services/strategies/ImageExtractionStrategyFactory.js |
| 2 | backend/src/services/elasticService.js |

---

## Known Issues / Technical Debt

### Code quality (6.7/10 estimated)

- `sharingService.ts` — 1,243 lines, mixed Power Parent + ABRSM code; references `learner_id`
- `ConnectionSharingModal.tsx` — pure ABRSM code (learner_id, learner_instrument), should be removed
- `SchoolDiscoverySection.tsx` — all mock data with `setTimeout` simulations, not live
- `MyConnections.tsx` — active UI but contains ABRSM contamination
- `onboardingTest.ts` — test/debug utility file with 17 console.logs; likely dev artifact
- Duplicate logic patterns in 3 extraction strategy files
- `events.id` is integer (inconsistent with uuid PKs on all other tables)
- `year_group` varchar and `year_groups` array both exist on events table

### Immediate cleanup targets
1. Remove all debug `console.log` statements (keep `console.error` where appropriate)
2. Remove `SchoolDiscoverySection.tsx` mock data / replace with real API calls
3. Scrub ABRSM references from `sharingService.ts` and `MyConnections.tsx`
4. Remove `ConnectionSharingModal.tsx` entirely
5. Remove `onboardingTest.ts` (dev-only debug utility)
