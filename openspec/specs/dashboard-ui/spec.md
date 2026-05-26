# Dashboard UI Specification

## Purpose

Contract for the 5 client components rendering the metrics dashboard: `MetricCard`, 3 Recharts charts (`UserChart`, `SalesChart`, `VisitsChart`), and the `DashboardClient` orchestrator. All chart components and `DashboardClient` MUST carry the `'use client'` directive.

## Requirements

### Requirement: MetricCard — KPI Display

`MetricCard` MUST render a styled card showing `title` and `value` when `loading` is `false`. When `loading` is `true`, it MUST render a skeleton placeholder instead.

| Prop | Type |
|------|------|
| title | `string` |
| value | `string \| number` |
| loading | `boolean` |

#### Scenario: Renders title and value

- GIVEN `loading` is `false` and `value` is a valid number
- WHEN the component renders
- THEN `title` and `value` MUST be visible in the DOM

#### Scenario: Renders skeleton when loading

- GIVEN `loading` is `true`
- WHEN the component renders
- THEN a skeleton placeholder MUST be visible
- AND `value` MUST NOT appear in the DOM

#### Scenario: Zero value renders correctly

- GIVEN `loading` is `false` and `value` is `0`
- WHEN the component renders
- THEN `0` MUST be visible as the value

### Requirement: UserChart — User Growth Chart

`UserChart` MUST accept `UserData[]` as its `data` prop and MUST render a Recharts `BarChart` or `AreaChart`.

#### Scenario: Renders chart with user data

- GIVEN a non-empty array of `UserData`
- WHEN `UserChart` renders
- THEN a Recharts `BarChart` MUST be mounted

#### Scenario: Empty data array

- GIVEN an empty array
- WHEN `UserChart` renders
- THEN the chart SHOULD render without error

### Requirement: SalesChart — Sales Distribution Chart

`SalesChart` MUST accept `SalesData[]` as its `data` prop and MUST render a Recharts `PieChart`.

#### Scenario: Renders pie chart with sales data

- GIVEN a non-empty array of `SalesData`
- WHEN `SalesChart` renders
- THEN a Recharts `PieChart` MUST be mounted

#### Scenario: Empty data array

- GIVEN an empty array
- WHEN `SalesChart` renders
- THEN the chart SHOULD render without error

### Requirement: VisitsChart — Visit History Chart

`VisitsChart` MUST accept `VisitData[]` as its `data` prop and MUST render a Recharts `LineChart`.

#### Scenario: Renders line chart with visit data

- GIVEN a non-empty array of `VisitData`
- WHEN `VisitsChart` renders
- THEN a Recharts `LineChart` MUST be mounted

#### Scenario: Empty data array

- GIVEN an empty array
- WHEN `VisitsChart` renders
- THEN the chart SHOULD render without error

### Requirement: DashboardClient — Dashboard Orchestrator

`DashboardClient` MUST fetch all 4 API endpoints via SWR with a `refreshInterval` of 10000ms. It MUST render a responsive grid: 1 column mobile, 2 tablet, 3 desktop. A manual refresh button MUST call `mutate()` on all SWR keys. Loading MUST show `MetricCard` skeletons.

#### Scenario: Fetches all endpoints on mount

- GIVEN `DashboardClient` mounts
- WHEN the component renders
- THEN SWR MUST initiate requests to all 4 endpoints

#### Scenario: Applies 10-second refresh interval

- GIVEN `DashboardClient` is mounted
- WHEN 10 seconds elapse
- THEN SWR SHOULD revalidate all 4 endpoints

#### Scenario: Manual refresh triggers mutate-all

- GIVEN the component is rendered with data
- WHEN the user clicks the refresh button
- THEN `mutate()` MUST be called for every SWR key

#### Scenario: Loading state shows skeletons

- GIVEN data is not yet loaded
- WHEN the component renders
- THEN `MetricCard` components MUST show skeleton placeholders

#### Scenario: Responsive grid layout

- GIVEN any viewport width
- WHEN the component renders
- THEN the grid MUST use 1 column on mobile, 2 on tablet, 3 on desktop

#### Scenario: One or more endpoints fail

- GIVEN one or more SWR requests return an error
- WHEN the component renders
- THEN it SHOULD display error state or partial data without crashing
