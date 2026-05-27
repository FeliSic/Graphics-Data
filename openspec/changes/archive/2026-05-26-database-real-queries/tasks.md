# Tasks: database-real-queries

## Review Workload Forecast

<!-- guard:lines -->
Estimated changed lines: ~580–620 diff lines (~330 new/modified + ~290 deleted)
400-line budget risk: **HIGH** — total diff exceeds 400
Chained PRs recommended: **YES** — split into 2 stacked PRs
Split suggestion:
- **PR 1 (Phase 1)**: `models.ts` + `models.test.ts` — ~190 lines
- **PR 2 (Phases 2+3)**: Route updates + test migration — ~140 new + ~467 diff (mostly deletion/rewrite)
<!-- guard:lines -->

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: Stacked PRs to main (PR 1 → PR 2)
400-line budget risk: High

---

## Phase 1: Foundation — Models (TDD: RED→GREEN→REFACTOR)

- [x] **1.1** Write `src/server/database/__tests__/models.test.ts` — 4 test blocks with `vi.fn()` mock pool:
  - `getUsers()`: mock result with month/newUsers/totalUsers rows, verify output shape and cumulative `totalUsers` via window function
  - `getSales()`: mock 6 state rows, verify top-5 + "Otros" + percentages sum to 100
  - `getVisits()`: mock rows with `full_date`/count, verify `VisitData[]` with `date`/`visits`
  - `getSummary()`: mock 4 separate query results, verify `MetricsSummary` shape + `conversionRate` arithmetic
  - Edge cases: empty result sets, `totalUsers = 0` → conversionRate = 0
  - Run `npx vitest run`: expect **RED** (models.ts is empty)

- [x] **1.2** Implement `src/server/database/models.ts` — 4 async functions (`getUsers`, `getSales`, `getVisits`, `getSummary`), each accepting `pool: Pool`:
  - `getUsers(pool)`: `SELECT ... WHERE is_weekend = true`, grouped by month, cumulative via `SUM(...) OVER(ORDER BY month)`
  - `getSales(pool)`: Top 5 states by `SUM(price + freight_value)` on weekends, + "Otros" row (percentage computed in JS)
  - `getVisits(pool)`: `SELECT full_date, COUNT(*) ... WHERE is_weekend = true GROUP BY full_date ORDER BY full_date`
  - `getSummary(pool)`: 4 aggregate queries, `conversionRate = totalUsers === 0 ? 0 : Math.round(activeUsers / totalUsers * 100)`
  - All SQL uses `"proyecto1-Data-Engineering"` quoted schema, parameterized (`$1` style)
  - Run `npx vitest run`: expect **GREEN**

- [x] **1.3** Refactor `models.ts` and `models.test.ts` — extract common schema constant, deduplicate SQL string formatting, ensure no magic strings

## Phase 2: Route Import Swaps

- [ ] **2.1** Update `src/app/api/metrics/route.ts` — change import from `@/server/mockData` (`getMetricsSummary`) to `@/server/database/models` (`getSummary`), import pool from `@/server/database/db`, call `getSummary(pool)`
- [ ] **2.2** Update `src/app/api/metrics/users/route.ts` — import `getUsers` + pool, call `getUsers(pool)`
- [ ] **2.3** Update `src/app/api/metrics/sales/route.ts` — import `getSales` + pool, call `getSales(pool)`
- [ ] **2.4** Update `src/app/api/metrics/visits/route.ts` — import `getVisits` + pool, call `getVisits(pool)`
- [ ] **2.5** Run `npx vitest run` — confirm existing route tests still pass after mock swap

## Phase 3: Test Migration

- [ ] **3.1** Rewrite `src/app/api/metrics/__tests__/metrics.test.ts`:
  - Replace `vi.mock('@/server/mockData')` with `vi.mock('@/server/database/models')`
  - Mock `getUsers`, `getSales`, `getVisits`, `getSummary` with typed return values
  - Keep same scenario coverage: 200 + shape assertion per endpoint, 500 on throw, 405 on bad method
  - Run `npx vitest run`: expect **GREEN**

- [ ] **3.2** Delete `src/server/__tests__/mockData.test.ts` — no longer needed; data contract validation moves to models.test.ts

## Verification

- [ ] **4.1** Run `npx vitest run` — full suite GREEN (Phase 1 + Phase 2 + Phase 3)
- [ ] **4.2** Run `npm run build` — zero type errors, no lint violations
