# Proposal: Types & Mock Data

## Intent

Establish the shared type system and deterministic mock data engine that every subsequent change (API routes, frontend visualizations) depends on. Without these foundations, no other work can proceed.

## Scope

### In Scope
- `src/types/index.ts` — shared TypeScript interfaces: `UserData`, `SalesData`, `VisitData`, `MetricsSummary`
- `src/server/mockData.ts` — pure mock engine producing realistic time-series data with coherent aggregations
- Unit tests for shape, range validity, and mathematical coherence (totals match time-series sums)

### Out of Scope
- API route handlers (`src/app/api/`)
- Frontend components (`DashboardClient`, `MetricCard`, charts)
- Page rewrites (`src/app/page.tsx`)
- Database stubs (`src/server/database/`)
- SWR hooks or data fetching layer

## Capabilities

### New Capabilities
- `mock-data-engine`: deterministic mock data generation for user acquisition (6mo), sales distribution (3mo), and daily visits (30d) with coherent aggregation

### Modified Capabilities
- None

## Approach

1. Define interfaces in `src/types/index.ts` — lean, focused on data shapes consumed by API and UI
2. Build `src/server/mockData.ts` with pure functions:
   - `generateUserData()` — 6 monthly points with cumulative totals
   - `generateSalesData()` — 4 categories with percentages summing to 100%
   - `generateVisitData()` — 30 daily points with weekend dip patterns
   - `getMetricsSummary()` — aggregate KPIs derived from generators
3. Write tests asserting shape correctness, range validity, and aggregation coherence (e.g., totalUsers === sum of newUsers)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/index.ts` | New | Shared interfaces for all data shapes |
| `src/server/mockData.ts` | New | Pure mock data generation functions |
| `src/**/*.test.ts` | New | Unit tests for shape + aggregation coherence |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incoherent mock data (totals ≠ sums) | Low | Tests assert mathematical equality |
| Interface mismatch with future consumers | Med | Keep types minimal; extend later |

## Rollback Plan

Delete `src/types/index.ts`, `src/server/mockData.ts`, and any associated test files. No production data, migrations, or API consumers exist yet — deletion is safe and complete.

## Dependencies

- None (pure TypeScript, no runtime dependencies)

## Success Criteria

- [ ] `npx vitest run` passes all mock data tests
- [ ] `npm run build` compiles without type errors
- [ ] Mock data generators produce coherent aggregations (totals = sum of parts)
