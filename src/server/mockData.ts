import type { UserData, SalesData, VisitData, MetricsSummary } from '../types';

// ---------------------------------------------------------------------------
// Deterministic constants
// ---------------------------------------------------------------------------

const MONTHS: string[] = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
const NEW_USERS: number[] = [120, 135, 110, 150, 140, 145];

const CATEGORIES: string[] = ['Electrónica', 'Ropa', 'Hogar', 'Libros'];
const AMOUNTS: number[] = [4500, 3200, 2800, 1500];

const WEEKDAY_BASE = 850;
const WEEKEND_BASE = 420;

/**
 * Deterministic offsets (±20 range) for 30 days starting 2024-01-01.
 * Day 0 = Monday.
 */
const VISIT_OFFSETS: number[] = [
  5, -8, 12, -3, 15, -10, 7,   // Week 1 (Mon–Sun)
  4, -12, 9, -5, 18, -7, 11,   // Week 2
  -15, 3, -9, 14, -6, 10, -13, // Week 3
  8, -1, -4, 16, -11, 2, -14,  // Week 4
  6, 13,                        // Days 28–29
];

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

/**
 * Format a day number (0-based) into "YYYY-MM-DD" starting from 2024-01-01.
 */
function formatDate(dayIndex: number): string {
  const day = 1 + dayIndex;
  return `2024-01-${String(day).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

export function generateUserData(): UserData[] {
  let cumulative = 0;
  return MONTHS.map((month, i) => {
    cumulative += NEW_USERS[i];
    return { month, newUsers: NEW_USERS[i], totalUsers: cumulative };
  });
}

export function generateSalesData(): SalesData[] {
  const totalAmount = AMOUNTS.reduce((a, b) => a + b, 0);
  const rawPercentages = AMOUNTS.map((amount) => (amount / totalAmount) * 100);
  const adjusted = roundPercentages(rawPercentages);

  return CATEGORIES.map((category, i) => ({
    category,
    amount: AMOUNTS[i],
    percentage: adjusted[i],
  }));
}

export function generateVisitData(): VisitData[] {
  const entries: VisitData[] = [];

  for (let i = 0; i < 30; i++) {
    const dayOfWeek = i % 7; // 0=Mon, 5=Sat, 6=Sun
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const base = isWeekend ? WEEKEND_BASE : WEEKDAY_BASE;
    const visits = base + VISIT_OFFSETS[i];

    entries.push({
      date: formatDate(i),
      visits,
    });
  }

  return entries;
}

export function getMetricsSummary(): MetricsSummary {
  const userData = generateUserData();
  const salesData = generateSalesData();
  const visitData = generateVisitData();

  const totalUsers = userData[userData.length - 1].totalUsers;
  const activeUsers = Math.round(totalUsers * 0.82);
  const totalSales = salesData.reduce((sum, entry) => sum + entry.amount, 0);
  const totalVisits = visitData.reduce((sum, entry) => sum + entry.visits, 0);
  const conversionRate = Math.round((activeUsers / totalUsers) * 100);

  return {
    totalUsers,
    activeUsers,
    totalSales,
    totalVisits,
    conversionRate,
  };
}
