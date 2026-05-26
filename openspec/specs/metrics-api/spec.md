# Metrics API Specification

## Purpose

Contract for the 4 REST endpoints under `/api/metrics/`. Each endpoint MUST return typed JSON via `NextResponse` with HTTP 200 on success. The mock generators are deterministic (no real database), so edge cases focus on error handling rather than data variability.

## Requirements

### Requirement: GET /api/metrics — Aggregate Summary

`GET /api/metrics` MUST return HTTP 200 with a JSON body matching `MetricsSummary` (`totalUsers`, `activeUsers`, `totalSales`, `totalVisits`, `conversionRate`). The response MUST be produced via `NextResponse.json()`.

#### Scenario: Returns aggregate KPIs

- GIVEN a `GET` request to `/api/metrics`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST conform to `MetricsSummary`

#### Scenario: Generator failure returns 500

- GIVEN `getMetricsSummary()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500 with an error message

#### Scenario: Unsupported HTTP method

- GIVEN a `POST`/`PUT`/`DELETE` request to `/api/metrics`
- WHEN the route handler executes
- THEN it SHOULD return status 405

### Requirement: GET /api/metrics/users — User Growth

`GET /api/metrics/users` MUST return HTTP 200 with a JSON array of exactly 6 `UserData` objects via `NextResponse.json()`.

#### Scenario: Returns six user entries

- GIVEN a `GET` request to `/api/metrics/users`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST be an array of exactly 6 `UserData` items

#### Scenario: Generator failure returns 500

- GIVEN `generateUserData()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500

### Requirement: GET /api/metrics/sales — Sales Distribution

`GET /api/metrics/sales` MUST return HTTP 200 with a JSON array of exactly 4 `SalesData` objects via `NextResponse.json()`.

#### Scenario: Returns four sales entries

- GIVEN a `GET` request to `/api/metrics/sales`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST be an array of exactly 4 `SalesData` items

#### Scenario: Generator failure returns 500

- GIVEN `generateSalesData()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500

### Requirement: GET /api/metrics/visits — Visit History

`GET /api/metrics/visits` MUST return HTTP 200 with a JSON array of exactly 30 `VisitData` objects via `NextResponse.json()`.

#### Scenario: Returns thirty visit entries

- GIVEN a `GET` request to `/api/metrics/visits`
- WHEN the route handler executes
- THEN the response MUST have status 200
- AND the body MUST be an array of exactly 30 `VisitData` items

#### Scenario: Generator failure returns 500

- GIVEN `generateVisitData()` throws unexpectedly
- WHEN the route handler executes
- THEN it SHOULD return status 500
