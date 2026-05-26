import { describe, it, expect, vi, beforeEach } from 'vitest';
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
};

const sampleUsers: UserData[] = [
  { month: '2024-01', newUsers: 120, totalUsers: 120 },
  { month: '2024-02', newUsers: 135, totalUsers: 255 },
];

const sampleSales: SalesData[] = [
  { category: 'Electrónica', amount: 4500, percentage: 38 },
  { category: 'Ropa', amount: 3200, percentage: 27 },
];

const sampleVisits: VisitData[] = [
  { date: '2024-01-01', visits: 855 },
  { date: '2024-01-02', visits: 842 },
];

// ---------------------------------------------------------------------------
// 1. GET /api/metrics — Aggregate Summary
// ---------------------------------------------------------------------------
describe('GET /api/metrics', () => {
  beforeEach(() => {
    mockGetMetricsSummary.mockResolvedValue(sampleSummary);
  });

  it('returns 200 with MetricsSummary body', async () => {
    const { GET } = await import('../route');

    const req = new Request('http://localhost/api/metrics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as MetricsSummary;
    expect(body).toEqual(sampleSummary);
    expect(body).toHaveProperty('totalUsers');
    expect(body).toHaveProperty('totalSales');
    expect(body).toHaveProperty('conversionRate');
  });

  it('returns 500 when generator throws', async () => {
    mockGetMetricsSummary.mockRejectedValueOnce(new Error('DB failure'));

    const { GET } = await import('../route');

    const req = new Request('http://localhost/api/metrics');
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

  it('returns 200 with UserData array', async () => {
    const { GET } = await import('../users/route');

    const req = new Request('http://localhost/api/metrics/users');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as UserData[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('month');
    expect(body[0]).toHaveProperty('newUsers');
    expect(body[0]).toHaveProperty('totalUsers');
  });

  it('returns 500 when generator throws', async () => {
    mockGetUserData.mockRejectedValueOnce(new Error('Failure'));

    const { GET } = await import('../users/route');
    const res = await GET(new Request('http://localhost/api/metrics/users'));

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

  it('returns 200 with SalesData array', async () => {
    const { GET } = await import('../sales/route');

    const req = new Request('http://localhost/api/metrics/sales');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as SalesData[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('category');
    expect(body[0]).toHaveProperty('amount');
    expect(body[0]).toHaveProperty('percentage');
  });

  it('returns 500 when generator throws', async () => {
    mockGetSalesData.mockRejectedValueOnce(new Error('Failure'));

    const { GET } = await import('../sales/route');
    const res = await GET(new Request('http://localhost/api/metrics/sales'));

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

  it('returns 200 with VisitData array', async () => {
    const { GET } = await import('../visits/route');

    const req = new Request('http://localhost/api/metrics/visits');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as VisitData[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('date');
    expect(body[0]).toHaveProperty('visits');
  });

  it('returns 500 when generator throws', async () => {
    mockGetVisitData.mockRejectedValueOnce(new Error('Failure'));

    const { GET } = await import('../visits/route');
    const res = await GET(new Request('http://localhost/api/metrics/visits'));

    expect(res.status).toBe(500);
  });
});
