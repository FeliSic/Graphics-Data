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
  { month: '2024-01', newUsers: 120, totalUsers: 120 },
  { month: '2024-02', newUsers: 135, totalUsers: 255 },
  { month: '2024-03', newUsers: 110, totalUsers: 365 },
];

const sampleSales: SalesData[] = [
  { category: 'Electrónica', amount: 4500, percentage: 38 },
  { category: 'Ropa', amount: 3200, percentage: 27 },
  { category: 'Hogar', amount: 2800, percentage: 23 },
  { category: 'Libros', amount: 1500, percentage: 13 },
];

const sampleVisits: VisitData[] = [
  { date: '2024-01-01', visits: 855 },
  { date: '2024-01-02', visits: 842 },
  { date: '2024-01-03', visits: 862 },
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
    it('renders a Recharts BarChart with data', async () => {
      const { container } = await renderChart(
        import('../charts/UserChart'),
        sampleUsers
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders without error with empty data', async () => {
      const { container } = await renderChart(
        import('../charts/UserChart'),
        []
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('SalesChart', () => {
    it('renders a Recharts PieChart with data', async () => {
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
    it('renders a Recharts LineChart with data', async () => {
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
  });
});
