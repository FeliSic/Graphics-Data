'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SalesData } from '@/types';

interface SalesChartProps {
  data: SalesData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SalesChart({ data }: SalesChartProps) {
  const weekendData = useMemo(() => data.filter((d) => d.is_weekend), [data]);
  const weekdayData = useMemo(() => data.filter((d) => !d.is_weekend), [data]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Weekend PieChart */}
      <div>
        <h3 className="mb-2 text-center text-sm font-semibold text-gray-700">Finde</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={weekendData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {weekendData.map((_, index) => (
                <Cell key={`weekend-cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Weekday PieChart */}
      <div>
        <h3 className="mb-2 text-center text-sm font-semibold text-gray-700">Semana</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={weekdayData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {weekdayData.map((_, index) => (
                <Cell key={`weekday-cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
