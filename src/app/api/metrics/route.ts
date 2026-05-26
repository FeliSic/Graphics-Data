import { NextResponse } from 'next/server';
import { getMetricsSummary } from '@/server/mockData';

export async function GET() {
  try {
    const data = getMetricsSummary();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
