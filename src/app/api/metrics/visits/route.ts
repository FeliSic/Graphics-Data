import { NextResponse } from 'next/server';
import { generateVisitData } from '@/server/mockData';

export async function GET() {
  try {
    const data = generateVisitData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
