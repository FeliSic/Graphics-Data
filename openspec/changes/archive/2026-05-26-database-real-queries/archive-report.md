# Archive: database-real-queries

## Summary

Migrated the Statistics-Graph dashboard metrics from deterministic mock data generators (`mockData.ts`) to real PostgreSQL queries on NeonDB, preserving all API contracts and frontend behavior.

## What Changed

| File | Action | Lines |
|------|--------|-------|
| `src/server/database/models.ts` | Create | +175/-0 |
| `src/server/database/__tests__/models.test.ts` | Create | +233/-0 |
| `src/app/api/metrics/route.ts` | Modify | +9/-2 |
| `src/app/api/metrics/sales/route.ts` | Modify | +9/-2 |
| `src/app/api/metrics/users/route.ts` | Modify | +9/-2 |
| `src/app/api/metrics/visits/route.ts` | Modify | +9/-2 |
| `src/app/api/metrics/__tests__/metrics.test.ts` | Rewrite | +38/-46 |
| `src/server/__tests__/mockData.test.ts` | Delete | +0/-277 |
| **Total** | | **+482/-331** |

## Verification Results

- **Tests**: 40 passed / 0 failed / 0 skipped (5 test files)
- **TypeScript**: 16 errors (8 in-change — `metrics.test.ts` argument mismatch, 8 pre-existing in `Charts.test.tsx`)
- **Verdict**: **PASS WITH WARNINGS** — All 40 tests pass and core implementation is correct. Two non-blocking issues: (1) TypeScript strict mode flags extra argument passed to `GET()` handlers in tests (runtime-correct), and (2) missing `apply-progress.md` artifact from the apply phase.

## Spec Impact

- **None required** — Pure internal refactor. No spec-level capabilities were added or modified. All 4 API endpoints (`/api/metrics`, `/api/metrics/users`, `/api/metrics/sales`, `/api/metrics/visits`) retain their existing HTTP contracts (200 + typed JSON, 500 on error, 405 on bad method). The `mock-data-engine` spec is effectively superseded but its spec file (`openspec/specs/mock-data-engine/spec.md`) remains as reference — no consumers depended on its internal behavior.

## Final State

- **Branch**: `feat/db-real-queries--routes` (local only, not pushed to remote)
- **Commits**: 4 implementation commits (TDD cycle) + 1 follow-up fix for TS strict mode
- **PRs**: None created — branch is local and pending review/merge
- **Working tree**: Clean

## Artifacts Preserved

| Artifact | Path |
|----------|------|
| Proposal | `proposal.md` |
| Spec Delta | `specs/README.md` |
| Design | `design.md` |
| Tasks | `tasks.md` |
| Verify Report | `verify-report.md` |
| Archive Report | `archive-report.md` |
