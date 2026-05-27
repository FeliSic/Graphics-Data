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
| `UserData` | `month: string`, `newUsers: number` (integer), `totalUsers: number` (integer), `is_weekend: boolean` |
| `SalesData` | `category: string`, `amount: number` (integer), `percentage: number` (integer, 0–100), `is_weekend: boolean` |
| `VisitData` | `date: string`, `visits: number` (integer), `is_weekend: boolean` |
| `MetricsSummary` | 15 integer fields in 3 groups: **Total** (`totalUsers`, `activeUsers`, `totalSales`, `totalVisits`, `conversionRate`), **Weekend** (`weekendUsers`, `weekendSales`, `weekendVisits`, `weekendActiveUsers`, `weekendConversionRate`), **Weekday** (`weekdayUsers`, `weekdaySales`, `weekdayVisits`, `weekdayActiveUsers`, `weekdayConversionRate`) |

#### Scenario: All interfaces are importable

- GIVEN the file `src/types/index.ts`
- WHEN imported
- THEN all four types MUST be available

#### Scenario: Numeric fields are non-negative integers

- GIVEN any instance of `UserData`, `SalesData`, or `VisitData`
- WHEN inspecting all numeric fields
- THEN each MUST be an integer >= 0

#### Scenario: is_weekend boolean field exists

- GIVEN any instance of `UserData`, `SalesData`, or `VisitData`
- WHEN inspecting its fields
- THEN `is_weekend` MUST be present and be of type `boolean`

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

`getMetricsSummary()` MUST return an object with 15 fields across 3 groups. Total fields MUST equal the sum of their weekend and weekday counterparts.

| Field Group | Fields | Integrity |
|-------------|--------|-----------|
| Total | `totalUsers`, `activeUsers`, `totalSales`, `totalVisits`, `conversionRate` | MUST equal weekend + weekday sum |
| Weekend | `weekendUsers`, `weekendSales`, `weekendVisits`, `weekendActiveUsers`, `weekendConversionRate` | MUST derive from weekend subset |
| Weekday | `weekdayUsers`, `weekdaySales`, `weekdayVisits`, `weekdayActiveUsers`, `weekdayConversionRate` | MUST derive from weekday subset |

All 15 fields MUST be integers >= 0. Rate fields (`conversionRate`, `weekendConversionRate`, `weekdayConversionRate`) MUST be integers in [0, 100], computed via `Math.round()`.

#### Scenario: Total equals weekend + weekday for every metric

- GIVEN a call to `getMetricsSummary()`
- WHEN comparing each total to its weekend + weekday breakdown
- THEN `totalUsers` MUST equal `weekendUsers` + `weekdayUsers`
- AND `activeUsers` MUST equal `weekendActiveUsers` + `weekdayActiveUsers`
- AND `totalSales` MUST equal `weekendSales` + `weekdaySales`
- AND `totalVisits` MUST equal `weekendVisits` + `weekdayVisits`

#### Scenario: Rate fields are valid percentages

- GIVEN any call to `getMetricsSummary()`
- WHEN inspecting `conversionRate`, `weekendConversionRate`, and `weekdayConversionRate`
- THEN each MUST be an integer between 0 and 100

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
