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
}

interface SalesDataRow {
  customer_state: string;
  amount: number;
}

interface VisitDataRow {
  full_date: string;
  visits: number;
}

interface CountRow {
  count: number;
}

interface TotalRow {
  total: number;
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
           SUM(COUNT(DISTINCT dc.customer_id)) OVER (ORDER BY year, month) AS total_users
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_customers dc ON fo.customer_key = dc.customer_key
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    WHERE dt.is_weekend = true
    GROUP BY year, month
    ORDER BY year, month
  `;
  const result = await pool.query(sql);

  return result.rows.map((row: UserDataRow) => ({
    month: row.month_label,
    newUsers: Number(row.new_users),
    totalUsers: Number(row.total_users),
  }));
}

export async function getSalesData(pool: Pool): Promise<SalesData[]> {
  const sql = `
    SELECT dc.customer_state, SUM(fo.price + fo.freight_value) AS amount
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_customers dc ON fo.customer_key = dc.customer_key
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    WHERE dt.is_weekend = true
    GROUP BY dc.customer_state
    ORDER BY amount DESC
  `;
  const result = await pool.query(sql);

  if (result.rows.length === 0) return [];

  const top5 = result.rows.slice(0, 5);
  const remaining = result.rows.slice(5);

  const entries: Array<{ category: string; amount: number }> = top5.map(
    (row: SalesDataRow) => ({
      category: row.customer_state,
      amount: Number(row.amount),
    }),
  );

  if (remaining.length > 0) {
    const otrosAmount = remaining.reduce(
      (sum: number, row: SalesDataRow) => sum + Number(row.amount),
      0,
    );
    entries.push({ category: 'Otros', amount: otrosAmount });
  }

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const rawPcts = entries.map((e) => (e.amount / totalAmount) * 100);
  const adjusted = roundPercentages(rawPcts);

  return entries.map((e, i) => ({ ...e, percentage: adjusted[i] }));
}

export async function getVisitData(pool: Pool): Promise<VisitData[]> {
  const sql = `
    SELECT dt.full_date, COUNT(fo.order_id) AS visits
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    WHERE dt.is_weekend = true
    GROUP BY dt.full_date
    ORDER BY dt.full_date ASC
  `;
  const result = await pool.query(sql);

  return result.rows.map((row: VisitDataRow) => ({
    date: row.full_date,
    visits: Number(row.visits),
  }));
}

export async function getMetricsSummary(pool: Pool): Promise<MetricsSummary> {
  const totalUsersResult = await pool.query(`
    SELECT COUNT(DISTINCT customer_id) AS count
    FROM ${SCHEMA}.dim_customers
  `);
  const totalUsers = Number(totalUsersResult.rows[0]?.count ?? 0);

  const activeUsersResult = await pool.query(`
    SELECT COUNT(DISTINCT dc.customer_id) AS count
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_customers dc ON fo.customer_key = dc.customer_key
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    WHERE dt.is_weekend = true
  `);
  const activeUsers = Number(activeUsersResult.rows[0]?.count ?? 0);

  const totalSalesResult = await pool.query(`
    SELECT COALESCE(SUM(fo.price + fo.freight_value), 0) AS total
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    WHERE dt.is_weekend = true
  `);
  const totalSales = Number(totalSalesResult.rows[0]?.total ?? 0);

  const totalVisitsResult = await pool.query(`
    SELECT COUNT(*) AS count
    FROM ${SCHEMA}.fact_orders fo
    JOIN ${SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
    WHERE dt.is_weekend = true
  `);
  const totalVisits = Number(totalVisitsResult.rows[0]?.count ?? 0);

  const conversionRate =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return { totalUsers, activeUsers, totalSales, totalVisits, conversionRate };
}
