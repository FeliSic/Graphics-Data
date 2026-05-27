'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { UserData } from '@/types';

interface UserChartProps {
  data: UserData[];
}

export default function UserChart({ data }: UserChartProps) {
  const mergedData = useMemo(() => {
    const map = new Map<
      string,
      {
        month: string;
        newUsersWeekend: number;
        newUsersWeekday: number;
        totalUsersWeekend: number;
        totalUsersWeekday: number;
      }
    >();
    for (const d of data) {
      const existing = map.get(d.month) ?? {
        month: d.month,
        newUsersWeekend: 0,
        newUsersWeekday: 0,
        totalUsersWeekend: 0,
        totalUsersWeekday: 0,
      };
      if (d.is_weekend) {
        existing.newUsersWeekend += d.newUsers;
        existing.totalUsersWeekend = d.totalUsers;
      } else {
        existing.newUsersWeekday += d.newUsers;
        existing.totalUsersWeekday = d.totalUsers;
      }
      map.set(d.month, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={mergedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="newUsersWeekend" fill="#3b82f6" name="Nuevos Finde" />
        <Bar dataKey="newUsersWeekday" fill="#10b981" name="Nuevos Semana" />
        <Bar dataKey="totalUsersWeekend" fill="#1d4ed8" name="Acum. Finde" />
        <Bar dataKey="totalUsersWeekday" fill="#047857" name="Acum. Semana" />
      </BarChart>
    </ResponsiveContainer>
  );
}
