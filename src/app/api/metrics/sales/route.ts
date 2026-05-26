import { NextResponse } from 'next/server';
import { generateSalesData } from '@/server/mockData';

export async function GET() {
  try {
    const data = generateSalesData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
