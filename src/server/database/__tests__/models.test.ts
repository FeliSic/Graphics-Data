import { describe, it, expect, vi } from 'vitest';
import type { Pool } from 'pg';
import { getUserData, getSalesData, getVisitData, getMetricsSummary } from '../models';

function createMockPool() {
  return { query: vi.fn() };
}

describe('getUserData', () => {
  it('returns monthly weekend customer data with cumulative totals', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { month_label: '2024-01', new_users: 10, total_users: 10 },
        { month_label: '2024-02', new_users: 15, total_users: 25 },
        { month_label: '2024-03', new_users: 12, total_users: 37 },
      ],
    });

    const result = await getUserData(pool as unknown as Pool);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ month: '2024-01', newUsers: 10, totalUsers: 10 });
    expect(result[1]).toEqual({ month: '2024-02', newUsers: 15, totalUsers: 25 });
    expect(result[2]).toEqual({ month: '2024-03', newUsers: 12, totalUsers: 37 });
  });

  it('returns empty array when no data', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({ rows: [] });

    const result = await getUserData(pool as unknown as Pool);

    expect(result).toEqual([]);
  });

  it('handles single month result', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [{ month_label: '2024-06', new_users: 25, total_users: 25 }],
    });

    const result = await getUserData(pool as unknown as Pool);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ month: '2024-06', newUsers: 25, totalUsers: 25 });
  });
});

describe('getSalesData', () => {
  it('returns top 5 states plus Otros with percentages summing to 100', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 5000 },
        { customer_state: 'RJ', amount: 4000 },
        { customer_state: 'MG', amount: 3000 },
        { customer_state: 'RS', amount: 2000 },
        { customer_state: 'PR', amount: 1000 },
        { customer_state: 'BA', amount: 500 },
      ],
    });

    const result = await getSalesData(pool as unknown as Pool);
    const totalPercentage = result.reduce((s, r) => s + r.percentage, 0);

    expect(result).toHaveLength(6);
    expect(result[0].category).toBe('SP');
    expect(result[4].category).toBe('PR');
    expect(result[5].category).toBe('Otros');
    expect(result[5].amount).toBe(500);
    expect(totalPercentage).toBe(100);
  });

  it('returns exactly 5 states without Otros when 5 states exist', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 5000 },
        { customer_state: 'RJ', amount: 4000 },
        { customer_state: 'MG', amount: 3000 },
        { customer_state: 'RS', amount: 2000 },
        { customer_state: 'PR', amount: 1000 },
      ],
    });

    const result = await getSalesData(pool as unknown as Pool);

    expect(result).toHaveLength(5);
    expect(result.find((r) => r.category === 'Otros')).toBeUndefined();
  });

  it('returns all states without Otros when fewer than 5 states', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 3000 },
        { customer_state: 'RJ', amount: 2000 },
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

  it('handles equal amounts with compensatory rounding to 100', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { customer_state: 'SP', amount: 100 },
        { customer_state: 'RJ', amount: 100 },
        { customer_state: 'MG', amount: 100 },
        { customer_state: 'RS', amount: 100 },
        { customer_state: 'PR', amount: 100 },
        { customer_state: 'BA', amount: 100 },
      ],
    });

    const result = await getSalesData(pool as unknown as Pool);
    const totalPercentage = result.reduce((s, r) => s + r.percentage, 0);

    expect(result).toHaveLength(6);
    expect(totalPercentage).toBe(100);
  });
});

describe('getVisitData', () => {
  it('returns daily weekend visit data ordered by date', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [
        { full_date: '2024-01-06', visits: 10 },
        { full_date: '2024-01-07', visits: 15 },
        { full_date: '2024-01-13', visits: 12 },
      ],
    });

    const result = await getVisitData(pool as unknown as Pool);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: '2024-01-06', visits: 10 });
    expect(result[1]).toEqual({ date: '2024-01-07', visits: 15 });
    expect(result[2]).toEqual({ date: '2024-01-13', visits: 12 });
  });

  it('returns empty array when no visit data', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({ rows: [] });

    const result = await getVisitData(pool as unknown as Pool);

    expect(result).toEqual([]);
  });

  it('handles single date result', async () => {
    const pool = createMockPool();
    pool.query.mockResolvedValue({
      rows: [{ full_date: '2024-02-03', visits: 42 }],
    });

    const result = await getVisitData(pool as unknown as Pool);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: '2024-02-03', visits: 42 });
  });
});

describe('getMetricsSummary', () => {
  it('computes all KPIs correctly', async () => {
    const pool = createMockPool();
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 100 }] })
      .mockResolvedValueOnce({ rows: [{ count: 80 }] })
      .mockResolvedValueOnce({ rows: [{ total: 50000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 200 }] });

    const result = await getMetricsSummary(pool as unknown as Pool);

    expect(result).toEqual({
      totalUsers: 100,
      activeUsers: 80,
      totalSales: 50000,
      totalVisits: 200,
      conversionRate: 80,
    });
  });

  it('returns 0 conversionRate when totalUsers is 0', async () => {
    const pool = createMockPool();
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const result = await getMetricsSummary(pool as unknown as Pool);

    expect(result).toEqual({
      totalUsers: 0,
      activeUsers: 0,
      totalSales: 0,
      totalVisits: 0,
      conversionRate: 0,
    });
  });

  it('handles COALESCE fallback when totalSales is NULL', async () => {
    const pool = createMockPool();
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 50 }] })
      .mockResolvedValueOnce({ rows: [{ count: 25 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 30 }] });

    const result = await getMetricsSummary(pool as unknown as Pool);

    expect(result.totalSales).toBe(0);
    expect(result.conversionRate).toBe(50);
  });
});
