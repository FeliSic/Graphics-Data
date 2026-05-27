import type { Pool } from 'pg';
import type { UserData, SalesData, VisitData, MetricsSummary } from '@/types';

const SCHEMA = '"proyecto1-Data-Engineering"';

// ---------------------------------------------------------------------------
// Raw database row types (pg returns plain objects)
// ---------------------------------------------------------------------------

interface UserDataRow {
  month_label: string;
  new_users: number;
  total_users: number;
  is_weekend: boolean;
}

interface SalesDataRow {
  customer_state: string;
  amount: number;
  is_weekend: boolean;
}

interface VisitDataRow {
  full_date: string;
  visits: number;
  is_weekend: boolean;
}

interface CountRow {
  count: number;
}

interface MetricsRow {
  active_users: number;
  weekend_active_users: number;
  weekday_active_users: number;
  total_sales: number;
  weekend_sales: number;
  weekday_sales: number;
  total_visits: number;
  weekend_visits: number;
  weekday_visits: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply compensatory rounding so percentages sum to exactly 100.
 *
 * 1. Round each value via Math.round()
 * 2. Compute diff = 100 - sum(rounded)
 * 3. Add diff to the largest value to absorb the rounding error
 */
function roundPercentages(raw: number[]): number[] {
  const rounded = raw.map((n) => Math.round(n));
  const sum = rounded.reduce((a, b) => a + b, 0);
  const diff = 100 - sum;

  if (diff !== 0) {
    const maxIdx = rounded.indexOf(Math.max(...rounded));
    rounded[maxIdx] += diff;
  }

  return rounded;
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function getUserData(pool: Pool): Promise<UserData[]> {
  const sql = `
    SELECT year || '-' || LPAD(month::text, 2, '0') AS month_label,
           COUNT(DISTINCT dc.customer_id) AS new_users,
           SUM(COUNT(DISTINCT dc.customer_id)) OVER (PARTITION BY dt.is_weekend ORDER BY year, month) AS total_users,
           dt.is_weekend
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_customers dc ON fo.customer_key = dc.customer_key
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    GROUP BY year, month, dt.is_weekend
    ORDER BY year, month, dt.is_weekend
  `;
  const result = await pool.query(sql);

  return result.rows.map((row: UserDataRow) => ({
    month: row.month_label,
    newUsers: Number(row.new_users),
    totalUsers: Number(row.total_users),
    is_weekend: row.is_weekend,
  }));
}

export async function getSalesData(pool: Pool): Promise<SalesData[]> {
  const sql = `
    SELECT dc.customer_state, dt.is_weekend, SUM(fo.price + fo.freight_value) AS amount
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_customers dc ON fo.customer_key = dc.customer_key
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    GROUP BY dc.customer_state, dt.is_weekend
    ORDER BY amount DESC
  `;
  const result = await pool.query(sql);

  if (result.rows.length === 0) return [];

  // Compute total per state across weekend/weekday to determine top 5
  const stateTotals = new Map<string, number>();
  for (const row of result.rows) {
    const state = row.customer_state as string;
    stateTotals.set(state, (stateTotals.get(state) ?? 0) + Number(row.amount));
  }

  // Determine top 5 states by total amount
  const top5States = new Set(
    [...stateTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state]) => state),
  );

  // Separate rows into top-5 and remaining
  const topRows: SalesDataRow[] = [];
  const remainingRows: SalesDataRow[] = [];

  for (const row of result.rows) {
    if (top5States.has(row.customer_state)) {
      topRows.push(row);
    } else {
      remainingRows.push(row);
    }
  }

  // Build entries for top states
  const entries: Array<{ category: string; amount: number; is_weekend: boolean }> =
    topRows.map((row) => ({
      category: row.customer_state,
      amount: Number(row.amount),
      is_weekend: row.is_weekend,
    }));

  // Combine remaining into Otros, split by is_weekend
  const otrosWeekend = remainingRows
    .filter((r) => r.is_weekend)
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const otrosWeekday = remainingRows
    .filter((r) => !r.is_weekend)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  if (otrosWeekend > 0) entries.push({ category: 'Otros', amount: otrosWeekend, is_weekend: true });
  if (otrosWeekday > 0) entries.push({ category: 'Otros', amount: otrosWeekday, is_weekend: false });

  // Calculate percentages per group (weekend vs weekday)
  const weekendEntries = entries.filter((e) => e.is_weekend);
  const weekdayEntries = entries.filter((e) => !e.is_weekend);

  const weekendTotal = weekendEntries.reduce((s, e) => s + e.amount, 0);
  const weekdayTotal = weekdayEntries.reduce((s, e) => s + e.amount, 0);

  const rawWeekendPcts = weekendEntries.map((e) => (e.amount / weekendTotal) * 100);
  const rawWeekdayPcts = weekdayEntries.map((e) => (e.amount / weekdayTotal) * 100);

  const adjustedWeekend = weekendTotal > 0 ? roundPercentages(rawWeekendPcts) : [];
  const adjustedWeekday = weekdayTotal > 0 ? roundPercentages(rawWeekdayPcts) : [];

  const resultEntries: SalesData[] = [];

  weekendEntries.forEach((e, i) => {
    resultEntries.push({
      category: e.category,
      amount: e.amount,
      percentage: adjustedWeekend[i],
      is_weekend: true,
    });
  });
  weekdayEntries.forEach((e, i) => {
    resultEntries.push({
      category: e.category,
      amount: e.amount,
      percentage: adjustedWeekday[i],
      is_weekend: false,
    });
  });

  return resultEntries;
}

export async function getVisitData(pool: Pool): Promise<VisitData[]> {
  const sql = `
    SELECT dt.full_date, COUNT(fo.order_id) AS visits, dt.is_weekend
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    GROUP BY dt.full_date, dt.is_weekend
    ORDER BY dt.full_date ASC
  `;
  const result = await pool.query(sql);

  return result.rows.map((row: VisitDataRow) => ({
    date: row.full_date,
    visits: Number(row.visits),
    is_weekend: row.is_weekend,
  }));
}

export async function getMetricsSummary(pool: Pool): Promise<MetricsSummary> {
  // Total users: all registered customers (no time dimension)
  const totalUsersResult = await pool.query(`
    SELECT COUNT(DISTINCT customer_id) AS count
    FROM ${SCHEMA}.dim_customers
  `);
  const totalUsers = Number(totalUsersResult.rows[0]?.count ?? 0);

  // Single query: active users, sales, visits with weekend/weekday breakdown
  const metricsResult = await pool.query(`
    SELECT
      COUNT(DISTINCT dc.customer_id) AS active_users,
      COUNT(DISTINCT CASE WHEN dt.is_weekend THEN dc.customer_id END) AS weekend_active_users,
      COUNT(DISTINCT CASE WHEN NOT dt.is_weekend THEN dc.customer_id END) AS weekday_active_users,
      COALESCE(SUM(fo.price + fo.freight_value), 0) AS total_sales,
      COALESCE(SUM(CASE WHEN dt.is_weekend THEN fo.price + fo.freight_value ELSE 0 END), 0) AS weekend_sales,
      COALESCE(SUM(CASE WHEN NOT dt.is_weekend THEN fo.price + fo.freight_value ELSE 0 END), 0) AS weekday_sales,
      COUNT(*) AS total_visits,
      COUNT(CASE WHEN dt.is_weekend THEN 1 END) AS weekend_visits,
      COUNT(CASE WHEN NOT dt.is_weekend THEN 1 END) AS weekday_visits
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_customers dc ON fo.customer_key = dc.customer_key
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
  `);
  const m = metricsResult.rows[0] as MetricsRow;

  const activeUsers = Number(m.active_users ?? 0);
  const weekendActiveUsers = Number(m.weekend_active_users ?? 0);
  const weekdayActiveUsers = Number(m.weekday_active_users ?? 0);
  const totalSales = Number(m.total_sales ?? 0);
  const weekendSales = Number(m.weekend_sales ?? 0);
  const weekdaySales = Number(m.weekday_sales ?? 0);
  const totalVisits = Number(m.total_visits ?? 0);
  const weekendVisits = Number(m.weekend_visits ?? 0);
  const weekdayVisits = Number(m.weekday_visits ?? 0);

  const conversionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const weekendConversionRate = totalUsers > 0 ? Math.round((weekendActiveUsers / totalUsers) * 100) : 0;
  const weekdayConversionRate = totalUsers > 0 ? Math.round((weekdayActiveUsers / totalUsers) * 100) : 0;

  return {
    totalUsers,
    activeUsers,
    totalSales,
    totalVisits,
    conversionRate,
    weekendUsers: weekendActiveUsers,
    weekendSales,
    weekendVisits,
    weekendActiveUsers,
    weekendConversionRate,
    weekdayUsers: weekdayActiveUsers,
    weekdaySales,
    weekdayVisits,
    weekdayActiveUsers,
    weekdayConversionRate,
  };
}
