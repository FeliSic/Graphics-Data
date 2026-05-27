# Metrics API Specification

## Purpose

Contract for the 4 REST endpoints under `/api/metrics/`. Each endpoint MUST return typed JSON via `NextResponse` with HTTP 200 on success. The mock generators are deterministic (no real database), so edge cases focus on error handling rather than data variability.

## Requirements

### Requirement: GET /api/metrics — Aggregate Summary

`GET /api/metrics` MUST return HTTP 200 with a JSON body matching `MetricsSummary` (15 fields: total, weekend, and weekday groups). The response MUST be produced via `NextResponse.json()`.

#### Scenario: Returns aggregate KPIs with weekend/weekday breakdown

- GIVEN a `GET` request to `/api/metrics`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST have exactly 15 numeric fields
- AND the body MUST contain `totalUsers`, `weekendUsers`, and `weekdayUsers`
- AND `totalUsers` MUST equal `weekendUsers` + `weekdayUsers`

#### Scenario: Generator failure returns 500

- GIVEN `getMetricsSummary()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500 with an error message

#### Scenario: Unsupported HTTP method

- GIVEN a `POST`/`PUT`/`DELETE` request to `/api/metrics`
- WHEN the route handler executes
- THEN it SHOULD return status 405

### Requirement: GET /api/metrics/users — User Growth with Weekend Breakdown

`GET /api/metrics/users` MUST return HTTP 200 with a JSON array of `UserData` objects — up to 12 entries (6 months × weekend/weekday). Each entry MUST include `is_weekend: boolean`.

#### Scenario: Returns user entries with weekend breakdown

- GIVEN a `GET` request to `/api/metrics/users`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST be an array of `UserData` items
- AND each item MUST have `month`, `newUsers`, `totalUsers`, and `is_weekend` fields
- AND `is_weekend` MUST be a `boolean`

#### Scenario: Generator failure returns 500

- GIVEN `generateUserData()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500

### Requirement: GET /api/metrics/sales — Sales Distribution with Weekend Breakdown

`GET /api/metrics/sales` MUST return HTTP 200 with a JSON array of `SalesData` objects — up to 12 entries (6 categories × weekend/weekday). Each entry MUST include `is_weekend: boolean`.

#### Scenario: Returns sales entries with weekend breakdown

- GIVEN a `GET` request to `/api/metrics/sales`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST be an array of `SalesData` items
- AND each item MUST have `category`, `amount`, `percentage`, and `is_weekend` fields
- AND `is_weekend` MUST be a `boolean`

#### Scenario: Generator failure returns 500

- GIVEN `generateSalesData()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500

### Requirement: GET /api/metrics/visits — Visit History with Weekend Flag

`GET /api/metrics/visits` MUST return HTTP 200 with a JSON array of exactly 30 `VisitData` objects. Each entry MUST include `is_weekend: boolean`.

#### Scenario: Returns thirty visit entries with weekend flag

- GIVEN a `GET` request to `/api/metrics/visits`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST be an array of exactly 30 `VisitData` items
- AND each item MUST have `date`, `visits`, and `is_weekend` fields
- AND `is_weekend` MUST be a `boolean`

#### Scenario: Generator failure returns 500

- GIVEN `generateVisitData()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500
