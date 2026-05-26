# Tasks: Types & Mock Data

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250–300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + Mock Engine + Tests | PR 1 | Single PR, all 3 files, ~250–300 lines |

## Phase 1: Types (Foundation)

- [x] 1.1 Create `src/types/index.ts` — 4 interfaces: `UserData`, `SalesData`, `VisitData`, `MetricsSummary` with exact fields per spec

## Phase 2: Tests — RED (TDD)

- [x] 2.1 Create `src/server/__tests__/mockData.test.ts` — write all test groups:
  - Shape correctness and non-negative integer assertions
  - `generateUserData`: length=6, cumulative sum, monotonic `totalUsers`
  - `generateSalesData`: length=4, percentages sum=100, compensatory rounding
  - `generateVisitData`: length=30, weekend dip (mean weekend < mean weekday)
  - `getMetricsSummary`: every KPI matches generator source
  - Determinism: consecutive calls return deeply equal results

## Phase 3: Mock Engine — GREEN

- [x] 3.1 Implement `generateUserData()` — 6 months with `newUsers`=[120,135,110,150,140,145], cumulative `totalUsers`
- [x] 3.2 Implement `roundPercentages()` helper + `generateSalesData()` — 4 categories, amounts [4500,3200,2800,1500], exact 100% sum via compensatory rounding
- [x] 3.3 Implement `generateVisitData()` — 30 days, weekday=850, weekend=420, ±20 deterministic offset
- [x] 3.4 Implement `getMetricsSummary()` — derive all 5 KPIs from generator outputs per design

## Phase 4: Verification

- [x] 4.1 Run `npx vitest run` — all test cases pass
- [x] 4.2 Run `npm run build` — zero type errors
