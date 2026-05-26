import { describe, it, expect } from 'vitest';
import {
  generateUserData,
  generateSalesData,
  generateVisitData,
  getMetricsSummary,
} from '../mockData';

// ---------------------------------------------------------------------------
// 1. Shape correctness — every returned object has the expected fields
// ---------------------------------------------------------------------------
describe('shape correctness', () => {
  it('generateUserData entries contain month, newUsers, totalUsers', () => {
    const data = generateUserData();
    expect(data).toHaveLength(6);
    for (const entry of data) {
      expect(entry).toHaveProperty('month');
      expect(entry).toHaveProperty('newUsers');
      expect(entry).toHaveProperty('totalUsers');
    }
  });

  it('generateSalesData entries contain category, amount, percentage', () => {
    const data = generateSalesData();
    expect(data).toHaveLength(4);
    for (const entry of data) {
      expect(entry).toHaveProperty('category');
      expect(entry).toHaveProperty('amount');
      expect(entry).toHaveProperty('percentage');
    }
  });

  it('generateVisitData entries contain date, visits', () => {
    const data = generateVisitData();
    expect(data).toHaveLength(30);
    for (const entry of data) {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('visits');
    }
  });

  it('getMetricsSummary contains all 5 KPI fields', () => {
    const summary = getMetricsSummary();
    expect(summary).toHaveProperty('totalUsers');
    expect(summary).toHaveProperty('activeUsers');
    expect(summary).toHaveProperty('totalSales');
    expect(summary).toHaveProperty('totalVisits');
    expect(summary).toHaveProperty('conversionRate');
  });
});

// ---------------------------------------------------------------------------
// 2. Integer Arithmetic Rule — all numeric fields are integers >= 0
// ---------------------------------------------------------------------------
describe('Integer Arithmetic Rule', () => {
  it('generateUserData has non-negative integer numeric fields', () => {
    const data = generateUserData();
    expect(data.length).toBeGreaterThan(0);
    for (const entry of data) {
      expect(Number.isInteger(entry.newUsers)).toBe(true);
      expect(Number.isInteger(entry.totalUsers)).toBe(true);
      expect(entry.newUsers).toBeGreaterThanOrEqual(0);
      expect(entry.totalUsers).toBeGreaterThanOrEqual(0);
    }
  });

  it('generateSalesData has non-negative integer numeric fields', () => {
    const data = generateSalesData();
    expect(data.length).toBeGreaterThan(0);
    for (const entry of data) {
      expect(Number.isInteger(entry.amount)).toBe(true);
      expect(Number.isInteger(entry.percentage)).toBe(true);
      expect(entry.amount).toBeGreaterThanOrEqual(0);
      expect(entry.percentage).toBeGreaterThanOrEqual(0);
      expect(entry.percentage).toBeLessThanOrEqual(100);
    }
  });

  it('generateVisitData has non-negative integer visits', () => {
    const data = generateVisitData();
    expect(data.length).toBeGreaterThan(0);
    for (const entry of data) {
      expect(Number.isInteger(entry.visits)).toBe(true);
      expect(entry.visits).toBeGreaterThanOrEqual(0);
    }
  });

  it('getMetricsSummary has non-negative integer KPI fields', () => {
    const summary = getMetricsSummary();
    expect(Number.isInteger(summary.totalUsers)).toBe(true);
    expect(Number.isInteger(summary.activeUsers)).toBe(true);
    expect(Number.isInteger(summary.totalSales)).toBe(true);
    expect(Number.isInteger(summary.totalVisits)).toBe(true);
    expect(Number.isInteger(summary.conversionRate)).toBe(true);
    expect(summary.totalUsers).toBeGreaterThanOrEqual(0);
    expect(summary.activeUsers).toBeGreaterThanOrEqual(0);
    expect(summary.totalSales).toBeGreaterThanOrEqual(0);
    expect(summary.totalVisits).toBeGreaterThanOrEqual(0);
    expect(summary.conversionRate).toBeGreaterThanOrEqual(0);
    expect(summary.conversionRate).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// 3. generateUserData — 6 months, cumulative, monotonic
// ---------------------------------------------------------------------------
describe('generateUserData', () => {
  it('returns exactly 6 entries', () => {
    const data = generateUserData();
    expect(data).toHaveLength(6);
  });

  it('last totalUsers equals sum of all newUsers', () => {
    const data = generateUserData();
    const sumNewUsers = data.reduce((acc, entry) => acc + entry.newUsers, 0);
    expect(data[data.length - 1].totalUsers).toBe(sumNewUsers);
  });

  it('totalUsers is monotonic (never decreases)', () => {
    const data = generateUserData();
    for (let i = 1; i < data.length; i++) {
      expect(data[i].totalUsers).toBeGreaterThanOrEqual(data[i - 1].totalUsers);
    }
  });

  it('has specific newUsers values per design', () => {
    const data = generateUserData();
    expect(data[0].newUsers).toBe(120);
    expect(data[1].newUsers).toBe(135);
    expect(data[2].newUsers).toBe(110);
    expect(data[3].newUsers).toBe(150);
    expect(data[4].newUsers).toBe(140);
    expect(data[5].newUsers).toBe(145);
  });
});

// ---------------------------------------------------------------------------
// 4. generateSalesData — 4 categories, percentages sum to exactly 100
// ---------------------------------------------------------------------------
describe('generateSalesData', () => {
  it('returns exactly 4 entries', () => {
    const data = generateSalesData();
    expect(data).toHaveLength(4);
  });

  it('percentages sum to exactly 100', () => {
    const data = generateSalesData();
    const sumPct = data.reduce((acc, entry) => acc + entry.percentage, 0);
    expect(sumPct).toBe(100);
  });

  it('each percentage is an integer between 0 and 100', () => {
    const data = generateSalesData();
    for (const entry of data) {
      expect(Number.isInteger(entry.percentage)).toBe(true);
      expect(entry.percentage).toBeGreaterThanOrEqual(0);
      expect(entry.percentage).toBeLessThanOrEqual(100);
    }
  });

  it('has specific amounts per design', () => {
    const data = generateSalesData();
    expect(data[0].amount).toBe(4500);
    expect(data[1].amount).toBe(3200);
    expect(data[2].amount).toBe(2800);
    expect(data[3].amount).toBe(1500);
  });
});

// ---------------------------------------------------------------------------
// 5. generateVisitData — 30 days, weekend dip pattern
// ---------------------------------------------------------------------------
describe('generateVisitData', () => {
  it('returns exactly 30 entries', () => {
    const data = generateVisitData();
    expect(data).toHaveLength(30);
  });

  it('weekend mean visits is strictly lower than weekday mean visits', () => {
    const data = generateVisitData();
    // 2024-01-01 was a Monday → dayIndex 0 = Monday
    const weekdayVisits: number[] = [];
    const weekendVisits: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const dayOfWeek = i % 7; // 0=Mon, 5=Sat, 6=Sun
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        weekendVisits.push(data[i].visits);
      } else {
        weekdayVisits.push(data[i].visits);
      }
    }

    expect(weekdayVisits.length).toBeGreaterThan(0);
    expect(weekendVisits.length).toBeGreaterThan(0);

    const weekdayMean =
      weekdayVisits.reduce((a, b) => a + b, 0) / weekdayVisits.length;
    const weekendMean =
      weekendVisits.reduce((a, b) => a + b, 0) / weekendVisits.length;

    expect(weekendMean).toBeLessThan(weekdayMean);
  });

  it('each visits value is a non-negative integer', () => {
    const data = generateVisitData();
    for (const entry of data) {
      expect(Number.isInteger(entry.visits)).toBe(true);
      expect(entry.visits).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. getMetricsSummary — every KPI matches generator source
// ---------------------------------------------------------------------------
describe('getMetricsSummary', () => {
  it('totalUsers equals last UserData.totalUsers', () => {
    const summary = getMetricsSummary();
    const users = generateUserData();
    expect(summary.totalUsers).toBe(users[users.length - 1].totalUsers);
  });

  it('activeUsers equals Math.round(totalUsers * 0.82)', () => {
    const summary = getMetricsSummary();
    expect(summary.activeUsers).toBe(Math.round(summary.totalUsers * 0.82));
  });

  it('totalSales equals sum of all SalesData.amount', () => {
    const summary = getMetricsSummary();
    const sales = generateSalesData();
    const sumAmounts = sales.reduce((acc, entry) => acc + entry.amount, 0);
    expect(summary.totalSales).toBe(sumAmounts);
  });

  it('totalVisits equals sum of all VisitData.visits', () => {
    const summary = getMetricsSummary();
    const visits = generateVisitData();
    const sumVisits = visits.reduce((acc, entry) => acc + entry.visits, 0);
    expect(summary.totalVisits).toBe(sumVisits);
  });

  it('conversionRate is Math.round((activeUsers / totalUsers) * 100)', () => {
    const summary = getMetricsSummary();
    const expected = Math.round((summary.activeUsers / summary.totalUsers) * 100);
    expect(summary.conversionRate).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 7. Determinism — consecutive calls return identical results
// ---------------------------------------------------------------------------
describe('determinism', () => {
  it('generateUserData returns deeply equal results on consecutive calls', () => {
    const a = generateUserData();
    const b = generateUserData();
    expect(b).toEqual(a);
  });

  it('generateSalesData returns deeply equal results on consecutive calls', () => {
    const a = generateSalesData();
    const b = generateSalesData();
    expect(b).toEqual(a);
  });

  it('generateVisitData returns deeply equal results on consecutive calls', () => {
    const a = generateVisitData();
    const b = generateVisitData();
    expect(b).toEqual(a);
  });

  it('getMetricsSummary returns deeply equal results on consecutive calls', () => {
    const a = getMetricsSummary();
    const b = getMetricsSummary();
    expect(b).toEqual(a);
  });
});
