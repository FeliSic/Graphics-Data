import { NextResponse } from 'next/server';
import pool from '@/server/database/db';
import { getSalesData } from '@/server/database/models';

export async function GET() {
  try {
    const data = await getSalesData(pool);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
