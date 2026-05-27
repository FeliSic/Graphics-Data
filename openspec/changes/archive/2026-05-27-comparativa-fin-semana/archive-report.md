# Archive Report: Comparativa Fin de Semana

**Change**: `comparativa-fin-semana`
**Archived**: 2026-05-27
**Mode**: hybrid (openspec + engram)

---

## Task Completion Status

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Add `is_weekend: boolean` to `UserData`, `SalesData`, `VisitData` | ✅ |
| 1.2 | Expand `MetricsSummary` with 10 fields (weekend + weekday groups) | ✅ |
| 2.1 | [TEST RED] Update `models.test.ts`: mock rows include `is_weekend`, 15-field assertions | ✅ |
| 2.2 | [GREEN] `models.ts`: remove `WHERE is_weekend = true`, add to SELECT+GROUP BY, row mapping | ✅ |
| 2.3 | [GREEN] `models.ts`: refactor `getMetricsSummary` to single query with `COUNT(CASE WHEN ...)` | ✅ |
| 3.1 | [TEST RED] Update `Charts.test.tsx`: sample data includes `is_weekend`, 2-series assertions | ✅ |
| 3.2 | [GREEN] Rewrite `VisitsChart.tsx`: merged array, 2 `<Line>`, XAxis `tickFormatter` | ✅ |
| 3.3 | [GREEN] Rewrite `UserChart.tsx`: merged array, 4 `<Bar>` (weekend + weekday) | ✅ |
| 3.4 | [GREEN] Rewrite `SalesChart.tsx`: 2 `<PieChart>` lado a lado (weekend + weekday) | ✅ |
| 4.1 | [TEST RED] Add `MetricCard.test.tsx`: breakdown mode + legacy backward compat | ✅ |
| 4.2 | [GREEN] Update `MetricCard.tsx`: optional `weekendValue`/`weekdayValue`/`totalValue`, proportional bar + legend | ✅ |
| 5.1 | [GREEN] Update `metrics.test.ts`: sample data includes `is_weekend`, 15-field assertions | ✅ |

**All 12 tasks: ✅ COMPLETED**

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` | **47 tests passed** (5 test files) |
| `npm run build` | **Build OK** — compiled successfully, TypeScript passes, all routes correct |
| ESLint | No lint errors |

### Test Files Summary

| Test File | Tests | Status |
|-----------|-------|--------|
| `models.test.ts` | 14 | ✅ All pass |
| `metrics.test.ts` | 9 | ✅ All pass |
| `MetricCard.test.tsx` | 9 | ✅ All pass |
| `Charts.test.tsx` | 8 | ✅ All pass |
| `DashboardClient.test.tsx` | 7 | ✅ All pass |

---

## Files Changed

### Modified Source Files (7)

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modified | Added `is_weekend: boolean` to `UserData`, `SalesData`, `VisitData`. Expanded `MetricsSummary` with 10 new fields |
| `src/server/database/models.ts` | Modified | 4 queries: removed `WHERE is_weekend = true`, added `is_weekend` to SELECT+GROUP BY. Refactored `getMetricsSummary` to single query with `COUNT(CASE WHEN ...)` |
| `src/components/charts/VisitsChart.tsx` | Modified | Merged array per date with `weekendVisits`/`weekdayVisits`, 2 `<Line>`, XAxis `tickFormatter` for `YYYY-MM-DD` |
| `src/components/charts/UserChart.tsx` | Modified | Merged array per month with 4 series: `newUsersWeekend`, `newUsersWeekday`, `totalUsersWeekend`, `totalUsersWeekday` |
| `src/components/charts/SalesChart.tsx` | Modified | 2 `<PieChart>` side by side: weekend composition + weekday composition |
| `src/components/MetricCard.tsx` | Modified | Optional props: `weekendValue?`, `weekdayValue?`, `totalValue?`. Proportional bar (blue/green) + legend breakdown. Backward compatible with legacy `value` mode |
| `openspec/specs/dashboard-ui/spec.md` | Modified | SalesChart requirement updated: BarChart → 2 PieCharts side by side |

### Modified Test Files (4)

| File | Tests | Description |
|------|-------|-------------|
| `src/server/database/__tests__/models.test.ts` | 14 | Mock rows with `is_weekend`, 15-field MetricsSummary assertions, top-5 state logic |
| `src/components/__tests__/Charts.test.tsx` | 8 | Sample data with `is_weekend`, assertions for 2-series rendering, empty data edge cases |
| `src/components/__tests__/MetricCard.test.tsx` | 9 | Breakdown mode (bar + legend), legacy mode, zero-division safety |
| `src/app/api/metrics/__tests__/metrics.test.ts` | 9 | Sample data with `is_weekend`, 15-field body shape assertions |

### No files created or deleted

All changes were modifications to existing files.

---

## Specs Sync Status

| Domain | Action | Details |
|--------|--------|---------|
| `mock-data-engine/spec.md` | No change needed | Already reflected `is_weekend` in types and MetricsSummary with 15 fields from previous change |
| `metrics-api/spec.md` | No change needed | Already described `is_weekend` in all endpoint responses |
| `dashboard-ui/spec.md` | Updated | SalesChart requirement: BarChart → 2 PieCharts to match final implementation decision |

---

## Lessons Learned

### Architectural
1. **SalesChart design evolved during implementation**: The original proposal planned a BarChart grouped by category, but during design the team opted for **2 PieCharts side by side** — this preserved the existing visualization variety (line, bar, pie) and provided clearer visual comparison of composition differences between weekend and weekday.
2. **MetricCard backward compatibility was essential**: Making `weekendValue`/`weekdayValue`/`totalValue` optional props allowed the component to be used in legacy mode (mock data) and breakdown mode (real data) without breaking existing consumers.

### Technical
3. **PostgreSQL window functions with PARTITION BY**: The `total_users` cumulative sum required `PARTITION BY dt.is_weekend` so each series (weekend/weekday) accumulates independently. Without this, the total would cross-contaminate between groups.
4. **COUNT(CASE WHEN ...) single query pattern**: The `getMetricsSummary` refactor proved efficient — 3 aggregations (total, weekend, weekday) in one table scan via `CASE WHEN`, avoiding multiple round trips.
5. **Compensatory rounding by group**: SalesData percentage rounding had to be done per-group (weekend vs weekday) rather than globally, since each group must sum to exactly 100 independently.

### Testing
6. **All 47 tests pass with is_weekend in every mock row**: The test data was carefully structured to exercise both `is_weekend: true` and `is_weekend: false` paths, including edge cases (single group, zero totals, equal amounts).
7. **No tests broke from the change**: All existing mock-data tests and chart rendering tests remained compatible — the change was fully additive/backward-compatible.

---

## Merge Recommendation

**Recommended strategy**: Direct merge to main branch.

**Rationale**: This change was implemented as a single PR within the estimated ~350-400 line budget. All 47 tests pass, build succeeds, no breaking changes. The change is self-contained (types → models → charts → tests) with no cross-cutting dependencies.

**Branch to merge**: `feat/comparativa-fin-semana` (or equivalent feature branch).

---

## SDD Cycle Complete

- [x] Explore (proposal)
- [x] Spec (3 domain specs synced)
- [x] Design (technical design approved)
- [x] Tasks (12 tasks, all completed)
- [x] Apply (all code changes implemented)
- [x] Verify (47 tests, build OK)
- [x] Archive (this report)

Ready for production.
