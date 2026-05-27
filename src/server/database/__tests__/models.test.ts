import { describe, it, expect, vi } from 'vitest';
import type { Pool } from 'pg';
import { getUserData, getSalesData, getVisitData, getMetricsSummary } from '../models';

function createMockPool() {
  return { query: vi.fn() };
}

describe('getUserData', () => {
  it('returns monthly customer data with is_weekend and cumulative totals per group', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { month_label: '2024-01', new_users: 10, total_users: 10, is_weekend: true },
        { month_label: '2024-01', new_users: 20, total_users: 20, is_weekend: false },
        { month_label: '2024-02', new_users: 15, total_users: 25, is_weekend: true },
        { month_label: '2024-02', new_users: 25, total_users: 45, is_weekend: false },
        { month_label: '2024-03', new_users: 12, total_users: 37, is_weekend: true },
        { month_label: '2024-03', new_users: 18, total_users: 63, is_weekend: false },
      ],
    });

    const result = await getUserData(pool as unknown as Pool);

    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ month: '2024-01', newUsers: 10, totalUsers: 10, is_weekend: true });
    expect(result[1]).toEqual({ month: '2024-01', newUsers: 20, totalUsers: 20, is_weekend: false });
    expect(result[2]).toEqual({ month: '2024-02', newUsers: 15, totalUsers: 25, is_weekend: true });
    expect(result[3]).toEqual({ month: '2024-02', newUsers: 25, totalUsers: 45, is_weekend: false });
    expect(result[4]).toEqual({ month: '2024-03', newUsers: 12, totalUsers: 37, is_weekend: true });
    expect(result[5]).toEqual({ month: '2024-03', newUsers: 18, totalUsers: 63, is_weekend: false });
  });

  it('returns empty array when no data', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({ rows: [] });

    const result = await getUserData(pool as unknown as Pool);

    expect(result).toEqual([]);
  });

  it('handles single month result with is_weekend', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { month_label: '2024-06', new_users: 25, total_users: 25, is_weekend: true },
      ],
    });

    const result = await getUserData(pool as unknown as Pool);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ month: '2024-06', newUsers: 25, totalUsers: 25, is_weekend: true });
  });
});

describe('getSalesData', () => {
  it('returns top 5 states plus Otros with percentages summing to 100 per group', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 3000, is_weekend: true },
        { customer_state: 'SP', amount: 2000, is_weekend: false },
        { customer_state: 'RJ', amount: 2500, is_weekend: true },
        { customer_state: 'RJ', amount: 1500, is_weekend: false },
        { customer_state: 'MG', amount: 1800, is_weekend: true },
        { customer_state: 'MG', amount: 1200, is_weekend: false },
        { customer_state: 'RS', amount: 1200, is_weekend: true },
        { customer_state: 'RS', amount: 800, is_weekend: false },
        { customer_state: 'PR', amount: 600, is_weekend: true },
        { customer_state: 'PR', amount: 400, is_weekend: false },
        { customer_state: 'BA', amount: 300, is_weekend: true },
        { customer_state: 'BA', amount: 200, is_weekend: false },
      ],
    });

    const result = await getSalesData(pool as unknown as Pool);

    // Top 5 states (by total SP > RJ > MG > RS > PR) + Otros (BA) → 6 categories × 2 = 12 entries
    expect(result).toHaveLength(12);

    // Each entry has is_weekend
    result.forEach((entry) => {
      expect(entry).toHaveProperty('is_weekend');
    });

    // SP entries (weekend + weekday)
    const spWeekend = result.find((r) => r.category === 'SP' && r.is_weekend === true);
    const spWeekday = result.find((r) => r.category === 'SP' && r.is_weekend === false);
    expect(spWeekend).toBeDefined();
    expect(spWeekday).toBeDefined();
    expect(spWeekend!.amount).toBe(3000);
    expect(spWeekday!.amount).toBe(2000);

    // Otros entries (weekend + weekday)
    const otrosWeekend = result.find((r) => r.category === 'Otros' && r.is_weekend === true);
    const otrosWeekday = result.find((r) => r.category === 'Otros' && r.is_weekend === false);
    expect(otrosWeekend).toBeDefined();
    expect(otrosWeekday).toBeDefined();
    expect(otrosWeekend!.amount).toBe(300);
    expect(otrosWeekday!.amount).toBe(200);

    // Percentages sum to 100 per group (weekend and weekday separately)
    const weekendEntries = result.filter((r) => r.is_weekend);
    const weekdayEntries = result.filter((r) => !r.is_weekend);
    expect(weekendEntries.reduce((s, r) => s + r.percentage, 0)).toBe(100);
    expect(weekdayEntries.reduce((s, r) => s + r.percentage, 0)).toBe(100);
  });

  it('returns exactly 5 states without Otros when 5 states exist', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 5000, is_weekend: true },
        { customer_state: 'RJ', amount: 4000, is_weekend: true },
        { customer_state: 'MG', amount: 3000, is_weekend: true },
        { customer_state: 'RS', amount: 2000, is_weekend: true },
        { customer_state: 'PR', amount: 1000, is_weekend: true },
      ],
    });

    const result = await getSalesData(pool as unknown as Pool);

    expect(result).toHaveLength(5);
    expect(result.find((r) => r.category === 'Otros')).toBeUndefined();
    // Each entry should have is_weekend
    result.forEach((r) => expect(r.is_weekend).toBe(true));
  });

  it('returns all states without Otros when fewer than 5 states', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 3000, is_weekend: true },
        { customer_state: 'RJ', amount: 2000, is_weekend: false },
      ],
    });

    const result = await getSalesData(pool as unknown as Pool);

    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('SP');
    expect(result[1].category).toBe('RJ');
    expect(result.find((r) => r.category === 'Otros')).toBeUndefined();
  });

  it('returns empty array when no sales data', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({ rows: [] });

    const result = await getSalesData(pool as unknown as Pool);

    expect(result).toEqual([]);
  });

  it('handles equal amounts with compensatory rounding to 100 per group', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 100, is_weekend: true },
        { customer_state: 'RJ', amount: 100, is_weekend: true },
        { customer_state: 'MG', amount: 100, is_weekend: true },
        { customer_state: 'SP', amount: 100, is_weekend: false },
        { customer_state: 'RJ', amount: 100, is_weekend: false },
        { customer_state: 'MG', amount: 100, is_weekend: false },
      ],
    });

    const result = await getSalesData(pool as unknown as Pool);
    const weekendEntries = result.filter((r) => r.is_weekend);
    const weekdayEntries = result.filter((r) => !r.is_weekend);

    expect(weekendEntries).toHaveLength(3);
    expect(weekdayEntries).toHaveLength(3);
    expect(weekendEntries.reduce((s, r) => s + r.percentage, 0)).toBe(100);
    expect(weekdayEntries.reduce((s, r) => s + r.percentage, 0)).toBe(100);
  });
});

describe('getVisitData', () => {
  it('returns daily visit data with is_weekend ordered by date', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { full_date: '2024-01-06', visits: 10, is_weekend: true },
        { full_date: '2024-01-07', visits: 15, is_weekend: true },
        { full_date: '2024-01-13', visits: 12, is_weekend: true },
      ],
    });

    const result = await getVisitData(pool as unknown as Pool);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: '2024-01-06', visits: 10, is_weekend: true });
    expect(result[1]).toEqual({ date: '2024-01-07', visits: 15, is_weekend: true });
    expect(result[2]).toEqual({ date: '2024-01-13', visits: 12, is_weekend: true });
  });

  it('returns empty array when no visit data', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({ rows: [] });

    const result = await getVisitData(pool as unknown as Pool);

    expect(result).toEqual([]);
  });

  it('handles single date result with is_weekend', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [{ full_date: '2024-02-03', visits: 42, is_weekend: true }],
    });

    const result = await getVisitData(pool as unknown as Pool);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: '2024-02-03', visits: 42, is_weekend: true });
  });
});

describe('getMetricsSummary', () => {
  it('computes all KPIs with weekend/weekday breakdown', async () => {
    const pool = createMockPool();
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 100 }] })
      .mockResolvedValueOnce({
        rows: [{
          active_users: 80,
          weekend_active_users: 50,
          weekday_active_users: 30,
          total_sales: 50000,
          weekend_sales: 30000,
          weekday_sales: 20000,
          total_visits: 200,
          weekend_visits: 120,
          weekday_visits: 80,
        }],
      });

    const result = await getMetricsSummary(pool as unknown as Pool);

    expect(result).toEqual({
      totalUsers: 100,
      activeUsers: 80,
      weekendActiveUsers: 50,
      weekdayActiveUsers: 30,
      weekendUsers: 50,
      weekdayUsers: 30,
      totalSales: 50000,
      weekendSales: 30000,
      weekdaySales: 20000,
      totalVisits: 200,
      weekendVisits: 120,
      weekdayVisits: 80,
      conversionRate: 80,
      weekendConversionRate: 50,
      weekdayConversionRate: 30,
    });
  });

  it('returns 0 conversionRate when totalUsers is 0', async () => {
    const pool = createMockPool();
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({
        rows: [{
          active_users: 0,
          weekend_active_users: 0,
          weekday_active_users: 0,
          total_sales: 0,
          weekend_sales: 0,
          weekday_sales: 0,
          total_visits: 0,
          weekend_visits: 0,
          weekday_visits: 0,
        }],
      });

    const result = await getMetricsSummary(pool as unknown as Pool);

    expect(result).toEqual({
      totalUsers: 0,
      activeUsers: 0,
      weekendActiveUsers: 0,
      weekdayActiveUsers: 0,
      weekendUsers: 0,
      weekdayUsers: 0,
      totalSales: 0,
      weekendSales: 0,
      weekdaySales: 0,
      totalVisits: 0,
      weekendVisits: 0,
      weekdayVisits: 0,
      conversionRate: 0,
      weekendConversionRate: 0,
      weekdayConversionRate: 0,
    });
  });

  it('handles COALESCE fallback when totalSales is NULL', async () => {
    const pool = createMockPool();
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 50 }] })
      .mockResolvedValueOnce({
        rows: [{
          active_users: 25,
          weekend_active_users: 15,
          weekday_active_users: 10,
          total_sales: 0,
          weekend_sales: 0,
          weekday_sales: 0,
          total_visits: 30,
          weekend_visits: 18,
          weekday_visits: 12,
        }],
      });

    const result = await getMetricsSummary(pool as unknown as Pool);

    expect(result.totalSales).toBe(0);
    expect(result.conversionRate).toBe(50);
    expect(result.weekendConversionRate).toBe(30);
    expect(result.weekdayConversionRate).toBe(20);
    expect(result.weekendUsers).toBe(15);
    expect(result.weekdayUsers).toBe(10);
  });
});
