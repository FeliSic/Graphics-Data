# Database Real Queries — Spec Delta

## No Spec-Level Changes

This change is a **pure implementation refactor**. No capabilities are added or modified.

### Rationale

| Existing Spec | Status | Reason |
|---------------|--------|--------|
| `metrics-api` | Unchanged | All 4 endpoints retain their HTTP contracts (200 + typed JSON, 500 on error, 405 on bad method). Row counts become data-driven rather than hardcoded, but the response types (`MetricsSummary`, `UserData[]`, `SalesData[]`, `VisitData[]`) and error-handling patterns remain identical. |
| `mock-data-engine` | Superseded | This spec described the internal mock generator (`mockData.ts`), which is being deleted. No external-facing capability changes — the API layer that consumers interact with is the same. |
| `dashboard-ui` | Unchanged | No frontend changes. `MetricsCard`, charts, and `DashboardClient` contracts are untouched. |

### Scenarios

The existing `metrics-api` scenarios all remain valid:

| Scenario | Status |
|----------|--------|
| GET /api/metrics — Returns aggregate KPIs | ✅ Same contract, real data source |
| GET /api/metrics — Generator failure returns 500 | ✅ Model function throws → same 500 |
| GET /api/metrics — Unsupported HTTP method | ✅ Handler method guard unchanged |
| GET /api/metrics/users — Returns six user entries | ✅ Array of `UserData`, count is data-driven |
| GET /api/metrics/users — Generator failure returns 500 | ✅ Same |
| GET /api/metrics/sales — Returns four sales entries | ✅ Array of `SalesData`, count is data-driven |
| GET /api/metrics/sales — Generator failure returns 500 | ✅ Same |
| GET /api/metrics/visits — Returns thirty visit entries | ✅ Array of `VisitData`, count is data-driven |
| GET /api/metrics/visits — Generator failure returns 500 | ✅ Same |

### Conclusion

No delta spec needed. Design and tasks can proceed directly against the existing `metrics-api` spec contracts.
