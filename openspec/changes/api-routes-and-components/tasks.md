# Tasks: api-routes-and-components

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~320–370 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 11 files — routes, components, tests | PR 1 | ~400 lines, additive, no existing code modified |

## Phase 1: API Routes (testing optimizado)

- [x] 1.1 Write 1 consolidated test suite for API routes: verify pattern works (200, shape) + error edge cases (405, 500)
- [x] 1.2 Create `src/app/api/metrics/route.ts` — `GET /api/metrics` → `getMetricsSummary()` → `MetricsSummary`
- [x] 1.3 Create `src/app/api/metrics/users/route.ts` — `GET /api/metrics/users` → `generateUserData()` → `UserData[]`
- [x] 1.4 Create `src/app/api/metrics/sales/route.ts` — `GET /api/metrics/sales` → `generateSalesData()` → `SalesData[]`
- [x] 1.5 Create `src/app/api/metrics/visits/route.ts` — `GET /api/metrics/visits` → `generateVisitData()` → `VisitData[]`

## Phase 2: MetricCard (bien testeado, tiene lógica real)

- [x] 2.1 Write tests for MetricCard — renders value, skeleton when loading, zero value edge case
- [x] 2.2 Create `src/components/MetricCard.tsx` — title/value/loading props, skeleton placeholder, Tailwind card style

## Phase 3: Charts (smoke test conjunto)

- [x] 3.1 Write 1 smoke test for all 3 charts — mounts without crashing with data and empty array
- [x] 3.2 Create `src/components/charts/UserChart.tsx` — `'use client'`, Recharts BarChart (month × totalUsers)
- [x] 3.3 Create `src/components/charts/SalesChart.tsx` — `'use client'`, Recharts PieChart (category × amount)
- [x] 3.4 Create `src/components/charts/VisitsChart.tsx` — `'use client'`, Recharts LineChart (date × visits)

## Phase 4: DashboardClient (TDD)

- [x] 4.1 Write failing tests for DashboardClient — fetches all 4 endpoints, 10s interval, mutate-all button, loading skeletons, responsive grid, error state
- [x] 4.2 Create `src/components/DashboardClient.tsx` — SWR with `METRICS_KEYS`, `refreshInterval: 10000`, responsive grid, manual mutate-all button

## Phase 5: Verification

- [x] 5.1 Run `npx vitest run` — confirm all tests pass (RED→GREEN cycle complete)
- [x] 5.2 Run `npm run build` — confirm zero type errors and no lint violations
