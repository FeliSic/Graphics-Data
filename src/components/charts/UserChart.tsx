'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { UserData } from '@/types';

interface UserChartProps {
  data: UserData[];
}

export default function UserChart({ data }: UserChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="totalUsers" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
