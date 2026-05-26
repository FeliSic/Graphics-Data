# Design: API Routes & Components

## Technical Approach

Thin `GET` route handlers at `src/app/api/metrics/*` that delegate to `@/server/mockData` and return `NextResponse.json()`. On the client, `DashboardClient` fetches all 4 endpoints via SWR with 10s polling and passes typed data to `MetricCard` (×4) and 3 Recharts chart components. All chart files carry `'use client'`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Route handler pattern | `GET` only, import + return | Validation middleware, error boundary | Routes are pure pass-through to deterministic mocks; no I/O or auth needed |
| SWR key convention | `KEYS` array exported from constants | Inline strings, env-based keys | Enables `mutate(keys)` iteration for manual refresh button |
| Chart component location | `src/components/charts/*.tsx` | Inline in DashboardClient | SRP — each chart is independently testable and swappable |
| MetricCard state | `loading` boolean prop | Internal SWR awareness | Keeps MetricCard a pure presentational component with zero data logic |
| Error handling | Per-request error in SWR, partial render | Global error boundary | DashboardClient must degrade gracefully — show working cards even if one endpoint fails |

## Data Flow

```
mockData.ts ──→ src/app/api/metrics/*/route.ts ──→ GET JSON ──→ SWR key hook
                                                                      │
                                                                      ▼
                                                              DashboardClient
                                                              /    |    |    \
                                                        MetricCard  UserChart  SalesChart  VisitsChart
                                                        (×4)
```

- **Server**: `generateUserData()`, `generateSalesData()`, `generateVisitData()`, `getMetricsSummary()` — each deterministic, no side effects.
- **API**: Every route handler wraps its generator in `try/catch`, returns `NextResponse.json(data)` (200) or `NextResponse.json({error}, {status: 500})`.
- **Client**: `DashboardClient` calls `useSWR(key, fetcher, { refreshInterval: 10000, errorRetryCount: 2 })` for each of 4 keys. On mount, all 4 requests fire in parallel. Manual refresh button calls `mutate(KEYS)`.

## Component Tree

```
DashboardClient                               ← 'use client', SWR orchestrator
├── <header> Refresh button (mutate all) </header>
├── <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
│   ├── MetricCard title="Usuarios Totales"   ← value={summary?.totalUsers}
│   ├── MetricCard title="Ventas Totales"     ← value={summary?.totalSales}
│   ├── MetricCard title="Visitas Totales"    ← value={summary?.totalVisits}
│   └── MetricCard title="Tasa de Conversión" ← value={`${summary?.conversionRate}%`}
├── UserChart data={users}                    ← 'use client', Recharts BarChart
├── SalesChart data={sales}                   ← 'use client', Recharts PieChart
└── VisitsChart data={visits}                 ← 'use client', Recharts LineChart
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/metrics/route.ts` | Create | `GET /api/metrics` → `getMetricsSummary()` → `MetricsSummary` |
| `src/app/api/metrics/users/route.ts` | Create | `GET /api/metrics/users` → `generateUserData()` → `UserData[]` |
| `src/app/api/metrics/sales/route.ts` | Create | `GET /api/metrics/sales` → `generateSalesData()` → `SalesData[]` |
| `src/app/api/metrics/visits/route.ts` | Create | `GET /api/metrics/visits` → `generateVisitData()` → `VisitData[]` |
| `src/components/MetricCard.tsx` | Create | KPI card — skeleton when `loading`, value otherwise |
| `src/components/charts/UserChart.tsx` | Create | Recharts `BarChart` (month × totalUsers) |
| `src/components/charts/SalesChart.tsx` | Create | Recharts `PieChart` (category × amount) |
| `src/components/charts/VisitsChart.tsx` | Create | Recharts `LineChart` (date × visits) |
| `src/components/DashboardClient.tsx` | Create | SWR orchestrator, responsive grid, mutate-all button |
| `src/app/api/metrics/__tests__/metrics.test.ts` | Create | API route response shape and status tests |
| `src/components/__tests__/DashboardClient.test.tsx` | Create | Component render and SWR integration tests |

## Response Shapes (from `src/types/index.ts`)

```typescript
// GET /api/metrics
MetricsSummary { totalUsers, activeUsers, totalSales, totalVisits, conversionRate }

// GET /api/metrics/users → UserData[] (exactly 6)
UserData { month: string, newUsers: number, totalUsers: number }

// GET /api/metrics/sales → SalesData[] (exactly 4)
SalesData { category: string, amount: number, percentage: number }

// GET /api/metrics/visits → VisitData[] (exactly 30)
VisitData { date: string, visits: number }
```

## Mock Data Integration

| Endpoint | Generator | Item Count | Key Fields |
|----------|-----------|------------|------------|
| `/api/metrics` | `getMetricsSummary()` | 1 object | aggregate KPIs |
| `/api/metrics/users` | `generateUserData()` | 6 | month, newUsers, totalUsers |
| `/api/metrics/sales` | `generateSalesData()` | 4 | category, amount, percentage |
| `/api/metrics/visits` | `generateVisitData()` | 30 | date, visits |

## SWR Key Convention

```typescript
export const METRICS_KEYS = [
  '/api/metrics',
  '/api/metrics/users',
  '/api/metrics/sales',
  '/api/metrics/visits',
] as const;
```

All keys are relative URLs — SWR resolves them against `window.location.origin`. Manual refresh calls `mutate(METRICS_KEYS)` to revalidate every endpoint.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| API | Response shape, status 200, 405 for wrong method, 500 on throw | `fetch` + `vi.mock` on mockData |
| Component | MetricCard renders value/skeleton, charts mount with data | `@testing-library/react` render |
| Integration | DashboardClient fetches and renders all 4 endpoints | Mock SWR, assert DOM contains card titles + chart containers |

## Open Questions

- None

## Migration / Rollout

No migration required. All files are additive — existing routes and pages untouched.
