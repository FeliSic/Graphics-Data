import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { MetricsSummary, UserData, SalesData, VisitData } from '@/types';

// ---------------------------------------------------------------------------
// Mock database pool and models before importing route handlers
// ---------------------------------------------------------------------------
const mockGetMetricsSummary = vi.fn<() => Promise<MetricsSummary>>();
const mockGetUserData = vi.fn<() => Promise<UserData[]>>();
const mockGetSalesData = vi.fn<() => Promise<SalesData[]>>();
const mockGetVisitData = vi.fn<() => Promise<VisitData[]>>();

vi.mock('@/server/database/db', () => ({
  default: { query: vi.fn() },
}));

vi.mock('@/server/database/models', () => ({
  getMetricsSummary: mockGetMetricsSummary,
  getUserData: mockGetUserData,
  getSalesData: mockGetSalesData,
  getVisitData: mockGetVisitData,
}));

// ---------------------------------------------------------------------------
// Static sample data used across tests
// ---------------------------------------------------------------------------
const sampleSummary: MetricsSummary = {
  totalUsers: 800,
  activeUsers: 656,
  totalSales: 12000,
  totalVisits: 18600,
  conversionRate: 82,
  weekendUsers: 350,
  weekendSales: 5000,
  weekendVisits: 8400,
  weekendActiveUsers: 300,
  weekendConversionRate: 44,
  weekdayUsers: 450,
  weekdaySales: 7000,
  weekdayVisits: 10200,
  weekdayActiveUsers: 356,
  weekdayConversionRate: 56,
};

const sampleUsers: UserData[] = [
  { month: '2024-01', newUsers: 120, totalUsers: 120, is_weekend: true },
  { month: '2024-01', newUsers: 80, totalUsers: 80, is_weekend: false },
  { month: '2024-02', newUsers: 135, totalUsers: 255, is_weekend: true },
  { month: '2024-02', newUsers: 90, totalUsers: 170, is_weekend: false },
];

const sampleSales: SalesData[] = [
  { category: 'Electrónica', amount: 2500, percentage: 42, is_weekend: true },
  { category: 'Ropa', amount: 2000, percentage: 33, is_weekend: true },
  { category: 'Electrónica', amount: 2000, percentage: 36, is_weekend: false },
  { category: 'Ropa', amount: 1200, percentage: 32, is_weekend: false },
];

const sampleVisits: VisitData[] = [
  { date: '2024-01-06', visits: 420, is_weekend: true },
  { date: '2024-01-07', visits: 415, is_weekend: true },
  { date: '2024-01-08', visits: 855, is_weekend: false },
];

// ---------------------------------------------------------------------------
// 1. GET /api/metrics — Aggregate Summary
// ---------------------------------------------------------------------------
describe('GET /api/metrics', () => {
  beforeEach(() => {
    mockGetMetricsSummary.mockResolvedValue(sampleSummary);
  });

  it('returns 200 with MetricsSummary body containing 15 fields', async () => {
    const { GET } = await import('../route');

    const req = new NextRequest('http://localhost/api/metrics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as MetricsSummary;
    expect(body).toEqual(sampleSummary);

    // Verify all 15 fields are present
    expect(body).toHaveProperty('totalUsers');
    expect(body).toHaveProperty('activeUsers');
    expect(body).toHaveProperty('totalSales');
    expect(body).toHaveProperty('totalVisits');
    expect(body).toHaveProperty('conversionRate');
    expect(body).toHaveProperty('weekendUsers');
    expect(body).toHaveProperty('weekendSales');
    expect(body).toHaveProperty('weekendVisits');
    expect(body).toHaveProperty('weekendActiveUsers');
    expect(body).toHaveProperty('weekendConversionRate');
    expect(body).toHaveProperty('weekdayUsers');
    expect(body).toHaveProperty('weekdaySales');
    expect(body).toHaveProperty('weekdayVisits');
    expect(body).toHaveProperty('weekdayActiveUsers');
    expect(body).toHaveProperty('weekdayConversionRate');
  });

  it('returns 500 when generator throws', async () => {
    mockGetMetricsSummary.mockRejectedValueOnce(new Error('DB failure'));

    const { GET } = await import('../route');

    const req = new NextRequest('http://localhost/api/metrics');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('does not export POST handler (Next.js returns 405)', async () => {
    const mod = await import('../route');
    expect((mod as Record<string, unknown>).POST).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. GET /api/metrics/users — User Growth
// ---------------------------------------------------------------------------
describe('GET /api/metrics/users', () => {
  beforeEach(() => {
    mockGetUserData.mockResolvedValue(sampleUsers);
  });

  it('returns 200 with UserData array including is_weekend', async () => {
    const { GET } = await import('../users/route');

    const req = new NextRequest('http://localhost/api/metrics/users');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as UserData[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('month');
    expect(body[0]).toHaveProperty('newUsers');
    expect(body[0]).toHaveProperty('totalUsers');
    expect(body[0]).toHaveProperty('is_weekend');
  });

  it('returns 500 when generator throws', async () => {
    mockGetUserData.mockRejectedValueOnce(new Error('Failure'));

    const { GET } = await import('../users/route');
    const res = await GET(new NextRequest('http://localhost/api/metrics/users'));

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// 3. GET /api/metrics/sales — Sales Distribution
// ---------------------------------------------------------------------------
describe('GET /api/metrics/sales', () => {
  beforeEach(() => {
    mockGetSalesData.mockResolvedValue(sampleSales);
  });

  it('returns 200 with SalesData array including is_weekend', async () => {
    const { GET } = await import('../sales/route');

    const req = new NextRequest('http://localhost/api/metrics/sales');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as SalesData[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('category');
    expect(body[0]).toHaveProperty('amount');
    expect(body[0]).toHaveProperty('percentage');
    expect(body[0]).toHaveProperty('is_weekend');
  });

  it('returns 500 when generator throws', async () => {
    mockGetSalesData.mockRejectedValueOnce(new Error('Failure'));

    const { GET } = await import('../sales/route');
    const res = await GET(new NextRequest('http://localhost/api/metrics/sales'));

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// 4. GET /api/metrics/visits — Visit History
// ---------------------------------------------------------------------------
describe('GET /api/metrics/visits', () => {
  beforeEach(() => {
    mockGetVisitData.mockResolvedValue(sampleVisits);
  });

  it('returns 200 with VisitData array including is_weekend', async () => {
    const { GET } = await import('../visits/route');

    const req = new NextRequest('http://localhost/api/metrics/visits');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as VisitData[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('date');
    expect(body[0]).toHaveProperty('visits');
    expect(body[0]).toHaveProperty('is_weekend');
  });

  it('returns 500 when generator throws', async () => {
    mockGetVisitData.mockRejectedValueOnce(new Error('Failure'));

    const { GET } = await import('../visits/route');
    const res = await GET(new NextRequest('http://localhost/api/metrics/visits'));

    expect(res.status).toBe(500);
  });
});
