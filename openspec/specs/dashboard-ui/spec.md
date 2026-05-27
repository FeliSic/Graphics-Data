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

### Requirement: MetricCard — Breakdown Mode (Optional)

`MetricCard` MAY accept `weekendValue`, `weekdayValue`, and `totalValue` as optional numeric props. When all three are present alongside `title`, it MUST render:
- A horizontal proportional bar showing the weekend vs weekday share
- A legend line containing `Finde: {weekendValue} | Semana: {weekdayValue} | Total: {totalValue}`

When these props are absent (legacy mode with only `title` and `value`), the original behavior MUST be preserved.

#### Scenario: Renders breakdown bar and legend

- GIVEN `weekendValue=30`, `weekdayValue=70`, `totalValue=100`, and `loading=false`
- WHEN the component renders
- THEN a proportional bar MUST be visible
- AND the legend MUST display "Finde: 30 | Semana: 70 | Total: 100"

#### Scenario: Legacy mode compatibility

- GIVEN only `title` and `value` props (no `weekendValue`, `weekdayValue`, or `totalValue`)
- WHEN the component renders
- THEN it MUST render the original single-value card without breakdown bar or legend

### Requirement: UserChart — Grouped Bar Chart

`UserChart` MUST accept `UserData[]` with `is_weekend` field. It MUST render a Recharts `BarChart` with two bars per month: weekend users and weekday users. The chart MUST group bars by month with separate Recharts `Bar` components for each series.

#### Scenario: Renders grouped bars for weekend and weekday

- GIVEN a non-empty array of `UserData` containing entries with both `is_weekend: true` and `is_weekend: false`
- WHEN `UserChart` renders
- THEN a Recharts `BarChart` MUST be mounted
- AND two `Bar` components MUST be present (weekend and weekday series)

#### Scenario: Empty data array

- GIVEN an empty array
- WHEN `UserChart` renders
- THEN the chart SHOULD render without error

### Requirement: SalesChart — Two PieCharts Side by Side

`SalesChart` MUST accept `SalesData[]` with `is_weekend` field. It MUST render two Recharts `PieChart` components side by side: one for weekend sales composition and one for weekday sales composition. Each PieChart MUST use `amount` as `dataKey` and `category` as `nameKey`.

#### Scenario: Renders two PieCharts for weekend and weekday composition

- GIVEN a non-empty array of `SalesData` containing entries with both `is_weekend: true` and `is_weekend: false`
- WHEN `SalesChart` renders
- THEN two Recharts `PieChart` components MUST be mounted
- AND the first PieChart MUST show weekend data (`is_weekend: true`)
- AND the second PieChart MUST show weekday data (`is_weekend: false`)
- AND each PieChart MUST use `amount` as `dataKey` and `category` as `nameKey`

#### Scenario: Empty data array

- GIVEN an empty array
- WHEN `SalesChart` renders
- THEN the chart SHOULD render without error

### Requirement: VisitsChart — Two-Line Chart

`VisitsChart` MUST accept `VisitData[]` with `is_weekend` field. It MUST render a Recharts `LineChart` with two lines: weekend visits (blue) and weekday visits (green). XAxis tick labels MUST display dates in `YYYY-MM-DD` format without timezone suffix.

#### Scenario: Renders two lines for weekend and weekday

- GIVEN a non-empty array of `VisitData` containing entries with both `is_weekend: true` and `is_weekend: false`
- WHEN `VisitsChart` renders
- THEN a Recharts `LineChart` MUST be mounted
- AND two `Line` components MUST be present (weekend and weekday series)
- AND XAxis labels MUST be in `YYYY-MM-DD` format

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
