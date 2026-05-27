# Proposal: Database Real Queries

## Intent

Replace deterministic mock data (`src/server/mockData.ts`) with live PostgreSQL queries against the existing NeonDB pool. Mock data has no business value — real queries make the dashboard operational and enable data-driven decisions on weekend sales analysis.

## Scope

### In Scope
- 4 query functions in `src/server/database/models.ts` (pool-injected)
- Rewrite 4 API route handlers to import from models instead of mockData
- Delete `src/server/__tests__/mockData.test.ts`
- Rewrite `src/app/api/metrics/__tests__/metrics.test.ts` to mock model functions
- Create `src/server/database/__tests__/models.test.ts` with injected mock pool

### Out of Scope
- Frontend labels, titles, chart configuration
- Padding sparse visit data with zeroes
- Schema migrations or database administration
- `DashboardClient.test.tsx` changes
- Environment setup (DATABASE_URL already configured)

## Capabilities

### New Capabilities
None — internal refactor. All 4 API endpoints keep their existing HTTP contracts (GET only, 200 + typed JSON, 500 on error, 405 on bad method).

### Modified Capabilities
None — no spec-level behavior changes. Existing `metrics-api` scenarios remain valid. Row counts become data-driven rather than hardcoded.

## Approach

Export 4 async functions from `models.ts`, each accepting a `Pool` parameter (injectable test seam). Each runs raw SQL via `pool.query()`. API routes swap `mockData` imports for model function calls inside the handler. Tests use `vi.fn()` to mock the pool's `query` method or mock the model functions directly.

Approved data mapping from exploration (all weekend-focused):
- `/api/metrics/sales` → Top 5 states by SUM(price + freight_value) on weekends
- `/api/metrics/users` → Monthly distinct weekend customers (cumulative via window function)
- `/api/metrics/visits` → Daily order count on weekend days
- `/api/metrics` → 4 DB queries aggregated + conversionRate in JS

## Affected Areas

| Area | Impact |
|------|--------|
| `src/server/database/models.ts` | CREATE — 4 query functions |
| `src/app/api/metrics/route.ts` | MODIFY — import from models |
| `src/app/api/metrics/users/route.ts` | MODIFY — import from models |
| `src/app/api/metrics/sales/route.ts` | MODIFY — import from models |
| `src/app/api/metrics/visits/route.ts` | MODIFY — import from models |
| `src/server/__tests__/mockData.test.ts` | DELETE |
| `src/app/api/metrics/__tests__/metrics.test.ts` | REWRITE — mock models instead of mockData |
| `src/server/database/__tests__/models.test.ts` | CREATE — unit tests with mock pool |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schema `"proyecto1-Data-Engineering"` not double-quoted | Med | Hardcode quoted schema in all 4 SQL templates |
| Month format mismatch for UserData (needs `YYYY-MM`) | Med | `TO_CHAR(MAKE_DATE(...), 'YYYY-MM')` or fallback concatenation |
| Division by zero in conversionRate | Low | Guard: `totalUsers === 0 ? 0 : Math.round(...)` |
| Sparse visits data (weekend-only returns fewer rows) | Low | Chart handles gaps; no frontend change needed |
| Pool mocking in vitest | Low | Injectable `Pool` param → pass `{ query: vi.fn() }` |

## Rollback Plan

Revert 4 route files to `mockData` imports via `git checkout`. Delete `models.ts` and `models.test.ts`. Restore `mockData.test.ts` and previous `metrics.test.ts` via `git restore`. The database pool remains untouched — zero impact on infrastructure.

## Success Criteria

- [ ] All 4 endpoints return real DB data conforming to their type contracts
- [ ] `npx vitest run` passes (model tests + route tests + frontend tests)
- [ ] `npm run build` succeeds with no type errors
- [ ] Dashboard renders without 500 errors during polling
- [ ] `conversionRate` handles empty tables (no crash on division by zero)
