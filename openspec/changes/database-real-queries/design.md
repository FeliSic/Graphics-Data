# Design: Database Real Queries

## Technical Approach

Replace 4 deterministic mock-data generators in `src/server/mockData.ts` with real PostgreSQL query functions in `src/server/database/models.ts`. Each function receives a `pg.Pool` (injectable seam for testing), executes raw parameterized SQL against NeonDB, and returns data matching the existing TypeScript interfaces. API route handlers swap one import line each — from `@/server/mockData` to `@/server/database/models`. No frontend changes.

## Architecture Decisions

### Injectable pool pattern

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Import pool from `db.ts` directly | Couples tests to real DB | ❌ |
| Injectable pool param | Zero DB in tests; pass `{ query: vi.fn() }` | **✅ Chosen** |

Rationale: Route handlers import the real pool once and pass it to model functions. Tests inject a mock pool object — no mock framework internals needed, no real DB connection.

### Raw SQL with parameterized queries

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Query builder (knex) | Added weight for 4 read-only SELECTs | ❌ |
| ORM (Prisma) | Overkill, config overhead | ❌ |
| Raw `pool.query(sql, params)` | Zero deps, injection-safe, explicit | **✅ Chosen** |

### Percentage in JS, not SQL

`roundPercentages()` from mockData is extracted to a shared utility (or inlined in models.ts). The "Otros" row for remaining states beyond top 5 is simpler in JS: sum all states, subtract top 5, compute percentage with compensatory rounding.

### Month concatenation over MAKE_DATE

`year || '-' || LPAD(month::text, 2, '0')` — both PostgreSQL 9.4+ and 15 support `MAKE_DATE`, but concatenation is more portable and equally readable. Zero-risk.

## Data Flow

```
NeonDB ──→ models.ts (4 query functions, pool injected)
              │
              ├─ getUsers(pool)     → UserData[]
              ├─ getSales(pool)     → SalesData[]
              ├─ getVisits(pool)    → VisitData[]
              └─ getSummary(pool)   → MetricsSummary
                      │
          ┌───────────┴──────────────────┐
          ▼                               ▼
    API Route Handler (GET)         API Route Handler (GET)
    import pool + getUsers          import pool + getSales
          │                               │
          ▼                               ▼
    NextResponse.json(data)        NextResponse.json(data)
          │                               │
          └───────────┬───────────────────┘
                      ▼
              SWR (10s polling)
                      │
                      ▼
              DashboardClient
              ├── MetricCard (×4)
              └── Recharts charts
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/server/database/models.ts` | **Create** | 4 async functions: `getUsers(pool)`, `getSales(pool)`, `getVisits(pool)`, `getSummary(pool)` |
| `src/app/api/metrics/route.ts` | **Modify** | Import `getSummary` + pool, call with pool |
| `src/app/api/metrics/users/route.ts` | **Modify** | Import `getUsers` + pool |
| `src/app/api/metrics/sales/route.ts` | **Modify** | Import `getSales` + pool |
| `src/app/api/metrics/visits/route.ts` | **Modify** | Import `getVisits` + pool |
| `src/server/__tests__/mockData.test.ts` | **Delete** | Replaced by models.test.ts |
| `src/server/database/__tests__/models.test.ts` | **Create** | Unit tests with mock pool |
| `src/app/api/metrics/__tests__/metrics.test.ts` | **Rewrite** | Mock `@/server/database/models` instead of mockData |

## Interfaces / Contracts

All 4 existing TypeScript interfaces are reused unchanged:

```typescript
UserData      { month: string; newUsers: number; totalUsers: number }
SalesData     { category: string; amount: number; percentage: number }
VisitData     { date: string; visits: number }
MetricsSummary { totalUsers: number; activeUsers: number; totalSales: number; totalVisits: number; conversionRate: number }
```

The "Otros" row in sales uses `category: "Otros"`. Month format is `YYYY-MM` (e.g. `"2024-01"`).

## Query Summary per Endpoint

| Endpoint | Source table(s) | Aggregation | Key detail |
|----------|----------------|-------------|------------|
| `GET /api/metrics/users` | fact_orders + dim_time | COUNT(DISTINCT customer_key) | Monthly weekend customers, cumulative via window `SUM() OVER()` |
| `GET /api/metrics/sales` | fact_orders + dim_customers + dim_time | SUM(price + freight_value) | Top 5 states on weekends + "Otros" row; percentage in JS |
| `GET /api/metrics/visits` | fact_orders + dim_time | COUNT(*) | Daily weekend order count, grouped by full_date |
| `GET /api/metrics` | fact_orders + dim_customers + dim_time | 4 separate queries | conversionRate = `ROUND(activeUsers/totalUsers*100)` in JS, guarded against 0 |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (models) | 4 functions | `const mockPool = { query: vi.fn() }`. Each test feeds a controlled result set and asserts output shape. Edge cases: empty tables, null rows, division-by-zero |
| Unit (routes) | 4 handlers | `vi.mock('@/server/database/models')` returning typed data. Assert HTTP 200 + correct JSON. Handler structure unchanged from current implementation |
| E2E | Dashboard | Manual: `npm run dev` renders with real data. `npx vitest run` + `npm run build` must pass on CI |

## Risks / Mitigations

| Risk | Mitigation |
|------|------------|
| Schema `"proyecto1-Data-Engineering"` not double-quoted in SQL | Hardcode quoted in all 4 SQL strings; grep for `proyecto1` without quotes during code review |
| `totalUsers = 0` → NaN in conversionRate | Guard: `totalUsers === 0 ? 0 : Math.round((activeUsers / totalUsers) * 100)` |
| Visit data sparse (weekend-only rows, ~8-13/month vs 30 dense) | Chart handles gaps natively; no frontend change per spec |

## Open Questions

None — all decisions resolved during exploration. Ready for task breakdown.
