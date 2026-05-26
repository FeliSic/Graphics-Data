# Proposal: API Routes & Components

## Intent

Bridge the mock data engine to the browser. Without this change, data exists only in pure functions — no endpoint serves it and no component renders it. Four API routes expose the metrics, and a suite of client components consumes them via SWR with live-update patterns.

## Scope

### In Scope
- 4 API route handlers under `src/app/api/metrics/` — one per mock generator + aggregate summary
- `MetricCard.tsx` — KPI card with skeleton loading state
- 3 Recharts chart components: `UserChart`, `SalesChart`, `VisitsChart`
- `DashboardClient.tsx` — SWR orchestrator with 10s refresh + manual mutate-all button
- Tests for API routes (response shape, status codes) and component rendering

### Out of Scope
- Rewriting `src/app/page.tsx` to render DashboardClient (deferred to next change)
- End-to-end integration test across full page
- Any database, ORM, or external data source

## Capabilities

### New Capabilities
- `metrics-api`: 4 endpoints (`/api/metrics`, `/api/metrics/users`, `/api/metrics/sales`, `/api/metrics/visits`) returning typed JSON via `NextResponse`
- `dashboard-ui`: Client components — `MetricCard`, 3 Recharts charts, and `DashboardClient` orchestrator with SWR polling and manual mutate

### Modified Capabilities
- None

## Approach

1. Create 4 API route files, each importing its mock generator from `src/server/mockData.ts` and returning `NextResponse.json(...)`. Routes are minimal — no validation, no middleware.
2. Build `MetricCard.tsx` — accepts title, value, loading flag; renders a skeleton when loading.
3. Build 3 chart components (`UserChart` area/bar, `SalesChart` pie/radar, `VisitsChart` line) — all `'use client'`.
4. Build `DashboardClient.tsx` — fetches all 4 endpoints via SWR, passes data to cards and charts, renders responsive grid, includes manual refresh button calling `mutate()` on all keys.
5. Write unit tests: API routes respond with correct status/types, components render without crash.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/metrics/route.ts` | New | `GET /api/metrics` → `MetricsSummary` |
| `src/app/api/metrics/users/route.ts` | New | `GET /api/metrics/users` → `UserData[]` |
| `src/app/api/metrics/sales/route.ts` | New | `GET /api/metrics/sales` → `SalesData[]` |
| `src/app/api/metrics/visits/route.ts` | New | `GET /api/metrics/visits` → `VisitData[]` |
| `src/components/MetricCard.tsx` | New | Reusable KPI card with skeleton |
| `src/components/charts/UserChart.tsx` | New | Recharts area/bar chart |
| `src/components/charts/SalesChart.tsx` | New | Recharts pie/radar chart |
| `src/components/charts/VisitsChart.tsx` | New | Recharts line chart |
| `src/components/DashboardClient.tsx` | New | SWR orchestrator, grid, refresh button |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API response shape mismatches type | Low | Type imports from `@/types` — compiler catches drift |
| SWR key convention breaks mutate-all | Low | Use a `KEYS` const array; `mutate()` iterates it |
| Recharts API changes in v2 | Low | Pin recharts version; tests assert rendering |

## Rollback Plan

Delete all files under `src/app/api/metrics/` and `src/components/`. No database writes, no external API consumers, no schema migrations — deletion is complete and safe. API routes are additive only (no existing route is harmed).

## Dependencies

- `swr` and `recharts` already installed
- Existing `src/types/index.ts` and `src/server/mockData.ts` in place

## Success Criteria

- [ ] `npx vitest run` passes all API route and component tests
- [ ] `npm run build` compiles without type or lint errors
- [ ] All 4 API endpoints return correct data shapes (verified by tests)
- [ ] DashboardClient renders metric cards and charts without runtime errors
