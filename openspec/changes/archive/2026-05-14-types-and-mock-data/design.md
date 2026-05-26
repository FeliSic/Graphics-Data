# Design: Types & Mock Data

## Technical Approach

Four pure functions + four typed interfaces. Types live in `src/types/index.ts` (imported by API and UI). Mock generators live in `src/server/mockData.ts` (server-only). Every value is deterministic — hardcoded base arrays and derived calculations only, no randomness anywhere. All numeric values are integers via `Math.round()` + compensatory adjustment.

## Architecture Decisions

### Decision: Pure functions over classes or instances

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Classes with state | Extra ceremony, complicates testing | ❌ |
| Singleton instances | Global state, test pollution | ❌ |
| **Pure exported functions** | Dead simple, tree-shakeable, deterministic | ✅ |

### Decision: Separate types file from mock engine

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Types co-located in mockData.ts | Forces mock import for type consumers | ❌ |
| **Standalone types/index.ts** | Single source of truth, API + UI can import without mock dep | ✅ |

### Decision: Hardcoded deterministic data (no Math.random)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Seeded PRNG (e.g., seedrandom) | Extra dependency, added complexity for no API need | ❌ |
| **Hardcoded arrays** | Trivially deterministic, zero dependencies, easy to assert in tests | ✅ |

### Decision: Integer Arithmetic with compensatory rounding

When dividing for percentages, `Math.round()` alone can produce sums of 99 or 101. The algorithm: compute raw decimals → round each → diff = 100 - sum(rounded) → add diff to the largest percentage. Guarantees exact 100% sums with all-integer values.

## Data Flow

```
src/types/index.ts
      │
      ▼
src/server/mockData.ts  ──imports types──►  src/app/api/.../route.ts
      │                                              │
      │                                              ▼
      │                                    SWR fetches JSON
      │                                              │
      └──── (consumed internally ── )                 ▼
                        getMetricsSummary()   DashboardClient + Recharts
```

The mock engine is completely self-contained. API routes will call generators and return JSON. No data flows through a database or state manager.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | Create | 4 interfaces: UserData, SalesData, VisitData, MetricsSummary |
| `src/server/mockData.ts` | Create | 4 pure generator functions with deterministic data |
| `src/server/__tests__/mockData.test.ts` | Create | Unit tests for shape, range, coherence, determinism |

## Interfaces / Contracts

```typescript
// src/types/index.ts
export interface UserData {
  month: string;       // "2024-01"
  newUsers: number;    // integer >= 0
  totalUsers: number;  // integer >= 0, cumulative
}

export interface SalesData {
  category: string;
  amount: number;      // integer >= 0
  percentage: number;  // integer 0-100 (compensatory-rounded)
}

export interface VisitData {
  date: string;        // "2024-01-01"
  visits: number;      // integer >= 0
}

export interface MetricsSummary {
  totalUsers: number;    // integer — last UserData.totalUsers
  activeUsers: number;   // integer — Math.round(totalUsers * 0.82)
  totalSales: number;    // integer — sum of SalesData.amount
  totalVisits: number;   // integer — sum of VisitData.visits
  conversionRate: number;// integer 0-100 — Math.round((activeUsers/totalUsers)*100)
}
```

### Generator signatures (src/server/mockData.ts)

```typescript
export function generateUserData(): UserData[]
export function generateSalesData(): SalesData[]
export function generateVisitData(): VisitData[]
export function getMetricsSummary(): MetricsSummary
```

### Deterministic values

| Generator | Data |
|-----------|------|
| `generateUserData` | 6 months: `newUsers` = [120, 135, 110, 150, 140, 145] |
| `generateSalesData` | 4 categories: amounts [4500, 3200, 2800, 1500], percentages [37, 27, 23, 13] |
| `generateVisitData` | 30 days: weekday base 850, weekend base 420, ±20 deterministic variation |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Shape correctness | Every field present and typed |
| Unit | Non-negative integers | `Number.isInteger` and `>= 0` |
| Unit | User aggregation | Last `totalUsers` === sum of `newUsers` |
| Unit | Percentage sum = 100 | Sum of `percentage` === 100 exactly |
| Unit | Weekend dip | Mean weekend visits < mean weekday |
| Unit | Determinism | Deep-equal two consecutive calls |
| Unit | Compensatory rounding | After adjustment, sum === 100 |
| Unit | Metrics coherence | Every KPI matches its generator source |

## Implementation Notes

### Compensatory adjustment

```typescript
function roundPercentages(raw: number[]): number[] {
  const rounded = raw.map(n => Math.round(n));
  const diff = 100 - rounded.reduce((a, b) => a + b, 0);
  const maxIdx = rounded.indexOf(Math.max(...rounded));
  rounded[maxIdx] += diff;
  return rounded;
}
```

### Weekend pattern for visits

Day 0-6 of each week: indices 0=Mon, 5=Sat, 6=Sun. For each day in the 30-day window, apply a base of 850 (weekday) or 420 (weekend) plus a deterministic offset from a fixed array. Weekend dips emerge naturally from the lower base value.

### Derivation chain for getMetricsSummary

```
totalUsers    = generateUserData()[5].totalUsers
activeUsers   = Math.round(totalUsers * 0.82)
totalSales    = generateSalesData().reduce(sum amounts)
totalVisits   = generateVisitData().reduce(sum visits)
conversionRate = Math.round((activeUsers / totalUsers) * 100)
```

## Open Questions

- None. All decisions are clarified above.
