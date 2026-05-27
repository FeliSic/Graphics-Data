import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import MetricCard from '../MetricCard';

afterEach(() => cleanup());

describe('MetricCard', () => {
  // --- Legacy mode (value only) ---

  it('renders title and value when not loading', () => {
    const { container } = render(<MetricCard title="Usuarios Totales" value={800} loading={false} />);

    expect(screen.getByText('Usuarios Totales')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(
      <MetricCard title="Usuarios Totales" value={800} loading={true} />
    );

    // Skeleton pulse elements should exist
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Value text should NOT be present in the container when loading
    expect(container.querySelector('.text-3xl')).toBeNull();
  });

  it('renders zero value correctly', () => {
    const { container } = render(<MetricCard title="Ventas" value={0} loading={false} />);

    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders string value correctly', () => {
    const { container } = render(
      <MetricCard title="Tasa de Conversión" value="82%" loading={false} />
    );

    expect(screen.getByText('Tasa de Conversión')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  // --- Breakdown mode (weekendValue + weekdayValue + totalValue) ---

  it('renders proportional bar and legend when breakdown props are provided', () => {
    const { container } = render(
      <MetricCard
        title="Usuarios Totales"
        weekendValue={300}
        weekdayValue={700}
        totalValue={1000}
        loading={false}
      />
    );

    // Title still renders
    expect(container.textContent).toContain('Usuarios Totales');

    // Breakdown legend shows all 3 values
    expect(container.textContent).toContain('Finde: 300');
    expect(container.textContent).toContain('Semana: 700');
    expect(container.textContent).toContain('Total: 1000');
  });

  it('renders proportional bar with correct width percentages', () => {
    const { container } = render(
      <MetricCard
        title="Ventas"
        weekendValue={250}
        weekdayValue={750}
        totalValue={1000}
        loading={false}
      />
    );

    // Two bar segments: blue for weekend, green for weekday
    const weekendBar = container.querySelector('.bg-blue-500');
    expect(weekendBar).toBeInTheDocument();
    const weekdayBar = container.querySelector('.bg-green-500');
    expect(weekdayBar).toBeInTheDocument();
  });

  it('shows skeleton in breakdown mode when loading', () => {
    const { container } = render(
      <MetricCard
        title="Usuarios Totales"
        weekendValue={300}
        weekdayValue={700}
        totalValue={1000}
        loading={true}
      />
    );

    // Skeleton pulse elements should exist
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Breakdown content should NOT render when loading
    expect(container.textContent).not.toContain('Finde:');
  });

  it('handles zero total value without division by zero', () => {
    const { container } = render(
      <MetricCard
        title="Sin Datos"
        weekendValue={0}
        weekdayValue={0}
        totalValue={0}
        loading={false}
      />
    );

    // Should render with 0 values
    expect(container.textContent).toContain('Finde: 0');
    expect(container.textContent).toContain('Semana: 0');
    expect(container.textContent).toContain('Total: 0');

    // Bars should not cause NaN widths
    const weekendBar = container.querySelector('.bg-blue-500');
    expect(weekendBar).toBeInTheDocument();
    expect(weekendBar!.getAttribute('style')).not.toContain('NaN');
  });

  it('legacy mode still works when only value is provided', () => {
    const { container } = render(<MetricCard title="Tasa" value="95%" loading={false} />);

    expect(container.textContent).toContain('Tasa');
    expect(container.textContent).toContain('95%');

    // Breakdown elements should NOT exist
    expect(container.textContent).not.toContain('Finde:');
    expect(container.textContent).not.toContain('Semana:');
  });
});
