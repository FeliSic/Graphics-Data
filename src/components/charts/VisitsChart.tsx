'use client';

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
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="visits" stroke="#3b82f6" />
      </LineChart>
    </ResponsiveContainer>
  );
}
