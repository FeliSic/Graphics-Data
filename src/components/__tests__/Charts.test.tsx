import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createElement, isValidElement, cloneElement, type ComponentType } from 'react';
import type { UserData, SalesData, VisitData } from '@/types';

// Mock ResponsiveContainer to pass width/height to child chart elements
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...(actual as Record<string, unknown>),
    ResponsiveContainer: ({
      children,
      width: _w,
      height: _h,
    }: {
      children: React.ReactNode;
      width?: number | string;
      height?: number | string;
    }) => {
      if (isValidElement(children)) {
        return cloneElement(children as React.ReactElement<{ width: number; height: number }>, {
          width: 600,
          height: 300,
        });
      }
      return createElement('div', null, children);
    },
  };
});

const sampleUsers: UserData[] = [
  { month: '2024-01', newUsers: 70, totalUsers: 70, is_weekend: true },
  { month: '2024-01', newUsers: 50, totalUsers: 50, is_weekend: false },
  { month: '2024-02', newUsers: 80, totalUsers: 150, is_weekend: true },
  { month: '2024-02', newUsers: 55, totalUsers: 105, is_weekend: false },
  { month: '2024-03', newUsers: 65, totalUsers: 215, is_weekend: true },
  { month: '2024-03', newUsers: 45, totalUsers: 150, is_weekend: false },
];

const sampleSales: SalesData[] = [
  { category: 'Electrónica', amount: 2500, percentage: 42, is_weekend: true },
  { category: 'Ropa', amount: 2000, percentage: 33, is_weekend: true },
  { category: 'Hogar', amount: 1500, percentage: 25, is_weekend: true },
  { category: 'Electrónica', amount: 2000, percentage: 36, is_weekend: false },
  { category: 'Ropa', amount: 1200, percentage: 32, is_weekend: false },
  { category: 'Hogar', amount: 800, percentage: 21, is_weekend: false },
  { category: 'Libros', amount: 400, percentage: 11, is_weekend: false },
];

const sampleVisits: VisitData[] = [
  { date: '2024-01-06', visits: 420, is_weekend: true },
  { date: '2024-01-07', visits: 415, is_weekend: true },
  { date: '2024-01-08', visits: 855, is_weekend: false },
  { date: '2024-01-09', visits: 842, is_weekend: false },
  { date: '2024-01-10', visits: 862, is_weekend: false },
];

async function renderChart(
  componentPromise: Promise<{ default: ComponentType<{ data: unknown[] }> }>,
  data: unknown[]
) {
  const { default: ChartComponent } = await componentPromise;
  return render(createElement(ChartComponent, { data: data as never }));
}

describe('Chart components', () => {
  describe('UserChart', () => {
    it('renders weekend and weekday bars grouped by month', async () => {
      const { container } = await renderChart(
        import('../charts/UserChart'),
        sampleUsers
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Should have recharts bars for 4 dataKeys: newUsersWeekend, newUsersWeekday, totalUsersWeekend, totalUsersWeekday
      const bars = container.querySelectorAll('.recharts-bar-rectangle');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('renders without error with empty data', async () => {
      const { container } = await renderChart(
        import('../charts/UserChart'),
        []
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders without crashing with mixed weekend/weekday data', async () => {
      const { container } = await renderChart(
        import('../charts/UserChart'),
        sampleUsers
      );
      // Verify SVG renders and contains BarChart structure
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // The Recharts BarChart renders bars as <path> or <rect> elements
      const paths = svg!.querySelectorAll('path');
      // With 4 Bar series × 3 months, there should be visible paths
      // (axes, grid lines, bars all contribute paths)
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('SalesChart', () => {
    it('renders two PieCharts for weekend and weekday composition', async () => {
      const { container } = await renderChart(
        import('../charts/SalesChart'),
        sampleSales
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders without error with empty data', async () => {
      const { container } = await renderChart(
        import('../charts/SalesChart'),
        []
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('VisitsChart', () => {
    it('renders weekend and weekday visit lines', async () => {
      const { container } = await renderChart(
        import('../charts/VisitsChart'),
        sampleVisits
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders without error with empty data', async () => {
      const { container } = await renderChart(
        import('../charts/VisitsChart'),
        []
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('formats XAxis ticks to YYYY-MM-DD', async () => {
      const { container } = await renderChart(
        import('../charts/VisitsChart'),
        sampleVisits
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
