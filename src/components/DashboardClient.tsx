'use client';

import useSWR, { mutate } from 'swr';
import { METRICS_KEYS } from '@/app/api/metrics/constants';
import MetricCard from './MetricCard';
import UserChart from './charts/UserChart';
import SalesChart from './charts/SalesChart';
import VisitsChart from './charts/VisitsChart';
import type { MetricsSummary, UserData, SalesData, VisitData } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const swrOptions = { refreshInterval: 10000 };

export default function DashboardClient() {
  const { data: summary, isLoading: loadingSummary } = useSWR<MetricsSummary>(
    METRICS_KEYS[0],
    fetcher,
    swrOptions
  );
  const { data: users, isLoading: loadingUsers } = useSWR<UserData[]>(
    METRICS_KEYS[1],
    fetcher,
    swrOptions
  );
  const { data: sales, isLoading: loadingSales } = useSWR<SalesData[]>(
    METRICS_KEYS[2],
    fetcher,
    swrOptions
  );
  const { data: visits, isLoading: loadingVisits } = useSWR<VisitData[]>(
    METRICS_KEYS[3],
    fetcher,
    swrOptions
  );

  const handleRefresh = () => {
    mutate(METRICS_KEYS);
  };

  return (
    <div className="space-y-6">
      {/* Header with manual refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Métricas</h1>
        <button
          onClick={handleRefresh}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Usuarios Totales"
          value={summary?.totalUsers ?? 0}
          loading={loadingSummary}
        />
        <MetricCard
          title="Ventas Totales"
          value={summary?.totalSales ?? 0}
          loading={loadingSales}
        />
        <MetricCard
          title="Visitas Totales"
          value={summary?.totalVisits ?? 0}
          loading={loadingVisits}
        />
        <MetricCard
          title="Tasa de Conversión"
          value={summary ? `${summary.conversionRate}%` : '0%'}
          loading={loadingSummary}
        />
      </div>

      {/* Charts */}
      {users && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Crecimiento de Usuarios
          </h2>
          <UserChart data={users} />
        </div>
      )}
      {sales && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Distribución de Ventas
          </h2>
          <SalesChart data={sales} />
        </div>
      )}
      {visits && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Historial de Visitas
          </h2>
          <VisitsChart data={visits} />
        </div>
      )}
    </div>
  );
}
