import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricCard from '../MetricCard';

describe('MetricCard', () => {
  it('renders title and value when not loading', () => {
    render(<MetricCard title="Usuarios Totales" value={800} loading={false} />);

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

    // Value container (.text-3xl) should NOT be present when loading
    const valueContainers = container.querySelectorAll('.text-3xl');
    expect(valueContainers.length).toBe(0);
  });

  it('renders zero value correctly', () => {
    render(<MetricCard title="Ventas" value={0} loading={false} />);

    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders string value correctly', () => {
    render(
      <MetricCard title="Tasa de Conversión" value="82%" loading={false} />
    );

    expect(screen.getByText('Tasa de Conversión')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
  });
});
