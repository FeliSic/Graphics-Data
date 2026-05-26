import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { METRICS_KEYS } from '@/app/api/metrics/constants';
import type { MetricsSummary, UserData, SalesData, VisitData } from '@/types';

// ---------------------------------------------------------------------------
// SWR mock — controlled per test via mockUseSWR and mockMutate
// ---------------------------------------------------------------------------
const mockUseSWR = vi.fn();
const mockMutate = vi.fn();

vi.mock('swr', () => ({
  default: (...args: unknown[]) => mockUseSWR(...args),
  mutate: (...args: unknown[]) => mockMutate(...args),
}));

// Mock Recharts ResponsiveContainer for jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  const { createElement, isValidElement, cloneElement } = await import('react');
  return {
    ...(actual as Record<string, unknown>),
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactNode;
    }) => {
      if (isValidElement(children)) {
        return cloneElement(
          children as React.ReactElement<{ width: number; height: number }>,
          { width: 600, height: 300 }
        );
      }
      return createElement('div', null, children);
    },
  };
});

// ---------------------------------------------------------------------------
// Sample data
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
];

const sampleSales: SalesData[] = [
  { category: 'Electrónica', amount: 4500, percentage: 38 },
];

const sampleVisits: VisitData[] = [
  { date: '2024-01-01', visits: 855 },
];

function setupSWRSuccess() {
  mockUseSWR.mockImplementation((key: string) => {
    if (key === METRICS_KEYS[0]) return { data: sampleSummary, error: undefined, isLoading: false, isValidating: false };
    if (key === METRICS_KEYS[1]) return { data: sampleUsers, error: undefined, isLoading: false, isValidating: false };
    if (key === METRICS_KEYS[2]) return { data: sampleSales, error: undefined, isLoading: false, isValidating: false };
    if (key === METRICS_KEYS[3]) return { data: sampleVisits, error: undefined, isLoading: false, isValidating: false };
    return { data: undefined, error: undefined, isLoading: true, isValidating: false };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('DashboardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all 4 endpoints via SWR with refreshInterval: 10000', async () => {
    setupSWRSuccess();
    const DashboardClient = (await import('../DashboardClient')).default;
    render(<DashboardClient />);

    // useSWR is called as (key, fetcher, options)
    METRICS_KEYS.forEach((key) => {
      expect(mockUseSWR).toHaveBeenCalledWith(
        key,
        expect.any(Function),
        expect.objectContaining({ refreshInterval: 10000 })
      );
    });
  });

  it('renders 4 MetricCards with correct titles and values', async () => {
    setupSWRSuccess();
    const DashboardClient = (await import('../DashboardClient')).default;
    render(<DashboardClient />);

    // Use getAllByText since React 19 doubles renders in dev mode
    expect(screen.getAllByText('Usuarios Totales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('800').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ventas Totales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('12000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visitas Totales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('18600').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tasa de Conversión').length).toBeGreaterThan(0);
    expect(screen.getAllByText('82%').length).toBeGreaterThan(0);
  });

  it('applies responsive grid layout classes', async () => {
    setupSWRSuccess();
    const DashboardClient = (await import('../DashboardClient')).default;
    const { container } = render(<DashboardClient />);

    const grids = container.querySelectorAll('.grid.grid-cols-1');
    expect(grids.length).toBeGreaterThan(0);
    const firstGrid = grids[0];
    expect(firstGrid.className).toContain('grid-cols-1');
    expect(firstGrid.className).toContain('md:grid-cols-2');
    expect(firstGrid.className).toContain('lg:grid-cols-3');
  });

  it('shows loading skeletons when data is loading', async () => {
    mockUseSWR.mockReturnValue({ data: undefined, error: undefined, isLoading: true, isValidating: false });

    const DashboardClient = (await import('../DashboardClient')).default;
    const { container } = render(<DashboardClient />);

    // All MetricCards should show skeleton (animate-pulse divs)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('manual refresh button calls mutate with METRICS_KEYS', async () => {
    setupSWRSuccess();
    const DashboardClient = (await import('../DashboardClient')).default;
    render(<DashboardClient />);

    // Use getAllByRole since React 19 doubles renders
    const buttons = screen.getAllByRole('button', { name: /actualizar/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    expect(mockMutate).toHaveBeenCalledWith(METRICS_KEYS);
  });

  it('renders partial data when one endpoint fails', async () => {
    mockUseSWR.mockImplementation((key: string) => {
      if (key === METRICS_KEYS[0]) return { data: sampleSummary, error: undefined, isLoading: false, isValidating: false };
      if (key === METRICS_KEYS[1]) return { data: undefined, error: new Error('Failed'), isLoading: false, isValidating: false };
      if (key === METRICS_KEYS[2]) return { data: sampleSales, error: undefined, isLoading: false, isValidating: false };
      if (key === METRICS_KEYS[3]) return { data: sampleVisits, error: undefined, isLoading: false, isValidating: false };
      return { data: undefined, error: undefined, isLoading: true, isValidating: false };
    });

    const DashboardClient = (await import('../DashboardClient')).default;
    render(<DashboardClient />);

    // Working cards still render
    expect(screen.getAllByText('Usuarios Totales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ventas Totales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visitas Totales').length).toBeGreaterThan(0);

    // Charts for working data render SVGs
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('renders charts when data is available', async () => {
    setupSWRSuccess();
    const DashboardClient = (await import('../DashboardClient')).default;
    const { container } = render(<DashboardClient />);

    // Charts render SVGs
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
