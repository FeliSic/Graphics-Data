# Mock Data Engine Specification

## Purpose

Define the shape and mathematical guarantees of the deterministic mock data engine serving all API endpoints and visualizations. Every value MUST be predictable and provably coherent — totals MUST match the sum of their time-series parts.

## Global Rules

### Integer Arithmetic Rule

ALL numeric fields in mock data MUST be whole integers. When a value derives from division (e.g., percentages, rates), the system MUST:

1. Compute the exact value with decimals
2. Apply `Math.round()` to convert to integer
3. Adjust the largest value compensatorily so aggregations remain exact (e.g., percentages sum to exactly 100)

This ensures no floating-point creep in the mock data layer.

## Requirements

### Requirement: Type Definitions

`src/types/index.ts` MUST export four interfaces:

| Interface | Fields |
|-----------|--------|
| `UserData` | `month: string`, `newUsers: number` (integer), `totalUsers: number` (integer) |
| `SalesData` | `category: string`, `amount: number` (integer), `percentage: number` (integer, 0–100) |
| `VisitData` | `date: string`, `visits: number` (integer) |
| `MetricsSummary` | `totalUsers: number` (integer), `activeUsers: number` (integer), `totalSales: number` (integer), `totalVisits: number` (integer), `conversionRate: number` (integer, 0–100, percentage) |

#### Scenario: All interfaces are importable

- GIVEN the file `src/types/index.ts`
- WHEN imported
- THEN all four types MUST be available

#### Scenario: Numeric fields are non-negative integers

- GIVEN any instance of `UserData`, `SalesData`, or `VisitData`
- WHEN inspecting all numeric fields
- THEN each MUST be an integer >= 0

### Requirement: User Data Generation

`generateUserData()` MUST return exactly 6 `UserData` entries with consecutive months. `totalUsers` MUST equal the cumulative sum of `newUsers`.

#### Scenario: Six monthly entries

- GIVEN a call to `generateUserData()`
- WHEN checking the array length
- THEN it MUST be exactly 6

#### Scenario: Cumulative totalUsers matches sum

- GIVEN the result of `generateUserData()`
- WHEN summing all `newUsers` across entries
- THEN the last entry's `totalUsers` MUST equal that sum

#### Scenario: Monotonic totalUsers

- GIVEN the result array sorted by month
- WHEN iterating entries in order
- THEN `totalUsers` MUST never decrease

### Requirement: Sales Data Generation

`generateSalesData()` MUST return exactly 4 `SalesData` entries whose `percentage` values sum to exactly 100. Per the Integer Arithmetic Rule, percentages MUST be computed via `Math.round()` with compensatory adjustment on the largest value to guarantee an exact sum of 100.

#### Scenario: Four categories

- GIVEN a call to `generateSalesData()`
- WHEN checking the array length
- THEN it MUST be exactly 4

#### Scenario: Percentages sum to exactly 100 with rounding

- GIVEN the result of `generateSalesData()`
- WHEN summing all `percentage` values
- THEN the sum MUST be exactly 100
- AND each `percentage` MUST be an integer in [0, 100]

#### Scenario: Compensatory adjustment works

- GIVEN raw percentages that don't sum to 100 after `Math.round()`
- WHEN the generator adjusts the largest percentage
- THEN the final sum MUST be exactly 100

### Requirement: Visit Data Generation

`generateVisitData()` MUST return exactly 30 `VisitData` entries with consecutive dates. Weekend visits MUST be lower than weekday visits.

#### Scenario: Thirty daily entries

- GIVEN a call to `generateVisitData()`
- WHEN checking the array length
- THEN it MUST be exactly 30

#### Scenario: Weekend dip pattern

- GIVEN the result of `generateVisitData()`
- WHEN comparing mean weekend visits to mean weekday visits
- THEN the weekend mean SHOULD be strictly lower

### Requirement: Metrics Summary

`getMetricsSummary()` MUST derive its KPIs from the three generator functions:

| Field | Derivation |
|-------|-----------|
| `totalUsers` | MUST equal the last `UserData.totalUsers` |
| `totalVisits` | MUST equal the sum of all `VisitData.visits` |
| `totalSales` | MUST equal the sum of all `SalesData.amount` |
| `conversionRate` | MUST be an integer between 0 and 100 (percentage), computed via `Math.round()` |

#### Scenario: Derived values match source data

- GIVEN a call to `getMetricsSummary()`
- WHEN comparing each KPI to the output of `generateUserData()`, `generateSalesData()`, and `generateVisitData()`
- THEN every field MUST be mathematically consistent with its source

### Requirement: Data Stability

All generator functions MUST be deterministic. Repeated calls MUST return deeply equal values.

#### Scenario: Deterministic output

- GIVEN a first call to any generator function
- WHEN calling the same function again
- THEN both results MUST be identical

#### Scenario: Non-deterministic seed (optional)

- GIVEN an alternative entry point that accepts a seed parameter
- WHEN called with different seeds
- THEN the output MAY differ
