'use client';

interface MetricCardProps {
  title: string;
  value?: string | number;
  weekendValue?: number;
  weekdayValue?: number;
  totalValue?: number;
  loading: boolean;
}

export default function MetricCard({
  title,
  value,
  weekendValue,
  weekdayValue,
  totalValue,
  loading,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="mt-2 space-y-2">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  // Breakdown mode: show proportional bar + legend
  if (weekendValue !== undefined && weekdayValue !== undefined && totalValue !== undefined) {
    const total = totalValue;
    const weekendPct = total > 0 ? Math.round((weekendValue / total) * 100) : 0;
    const weekdayPct = total > 0 ? Math.round((weekdayValue / total) * 100) : 0;

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${weekendPct}%` }}
          />
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${weekdayPct}%` }}
          />
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Finde: {weekendValue} | Semana: {weekdayValue} | <strong>Total: {totalValue}</strong>
        </p>
      </div>
    );
  }

  // Legacy mode: single value
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
