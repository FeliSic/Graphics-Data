'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { VisitData } from '@/types';

interface VisitsChartProps {
  data: VisitData[];
}

export default function VisitsChart({ data }: VisitsChartProps) {
  const mergedData = useMemo(() => {
    const map = new Map<string, { date: string; weekendVisits: number; weekdayVisits: number }>();
    for (const d of data) {
      const existing = map.get(d.date) ?? { date: d.date, weekendVisits: 0, weekdayVisits: 0 };
      if (d.is_weekend) existing.weekendVisits += d.visits;
      else existing.weekdayVisits += d.visits;
      map.set(d.date, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mergedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(dateStr: string) => dateStr.split('T')[0]}
        />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="weekendVisits" stroke="#3b82f6" name="Finde" />
        <Line type="monotone" dataKey="weekdayVisits" stroke="#10b981" name="Semana" />
      </LineChart>
    </ResponsiveContainer>
  );
}
