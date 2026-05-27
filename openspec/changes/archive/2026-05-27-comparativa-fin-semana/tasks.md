# Tasks: Comparativa Fin de Semana

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full change: types + models + charts + MetricCard + tests | PR 1 | Single PR; all tests pass together |

## Phase 1: Foundation — Types

- [x] 1.1 Add `is_weekend: boolean` to `UserData`, `SalesData`, `VisitData` in `src/types/index.ts`
- [x] 1.2 Expand `MetricsSummary` with 10 fields: `weekendUsers`, `weekendSales`, `weekendVisits`, `weekendActiveUsers`, `weekendConversionRate`, `weekdayUsers`, `weekdaySales`, `weekdayVisits`, `weekdayActiveUsers`, `weekdayConversionRate`

## Phase 2: Database Models — STRICT TDD

- [x] 2.1 [TEST RED] Update `src/server/database/__tests__/models.test.ts`: mock rows include `is_weekend`; aserciones para 15-field `MetricsSummary`; cada row de `getUserData`/`getSalesData`/`getVisitData` incluye `is_weekend`
- [x] 2.2 [GREEN] `src/server/database/models.ts`: eliminar `WHERE dt.is_weekend = true` en `getUserData`, `getSalesData`, `getVisitData`; agregar `dt.is_weekend` a SELECT y GROUP BY; agregar `is_weekend` al row mapping
- [x] 2.3 [GREEN] `src/server/database/models.ts`: refactor `getMetricsSummary` a single query con `COUNT(CASE WHEN is_weekend THEN ... END)` para total/weekend/weekday en una pasada

## Phase 3: Charts — STRICT TDD

- [x] 3.1 [TEST RED] Update `src/components/__tests__/Charts.test.tsx`: sample data incluye `is_weekend`; assertions de 2 series por chart (weekend + weekday)
- [x] 3.2 [GREEN] Rewrite `src/components/charts/VisitsChart.tsx`: merged array por date con `weekendVisits`/`weekdayVisits`; 2 `<Line>`; `tickFormatter` en XAxis (`YYYY-MM-DD`)
- [x] 3.3 [GREEN] Rewrite `src/components/charts/UserChart.tsx`: merged array por month con `newUsersWeekend`/`newUsersWeekday`/`totalUsersWeekend`/`totalUsersWeekday`; 4 `<Bar>`
- [x] 3.4 [GREEN] Rewrite `src/components/charts/SalesChart.tsx`: 2 `<PieChart>` lado a lado (weekend composition + weekday composition) con labels y tooltips

## Phase 4: MetricCard — STRICT TDD

- [x] 4.1 [TEST RED] Add tests to `src/components/__tests__/MetricCard.test.tsx`: breakdown mode renderiza barra + leyenda; legacy mode sigue funcionando con solo `value`
- [x] 4.2 [GREEN] Update `src/components/MetricCard.tsx`: props opcionales `weekendValue?`, `weekdayValue?`, `totalValue?`; renderizar barra proporcional (bg-blue-500/bg-green-500) + leyenda "Finde: X | Semana: Y | **Total: Z**" cuando presentes; backward compatible

## Phase 5: API Tests

- [x] 5.1 [GREEN] Update `src/app/api/metrics/__tests__/metrics.test.ts`: sample data incluye `is_weekend`; body shape assertions esperan `is_weekend` en cada entry; MetricsSummary assertions verifican 15 campos
