import { NextRequest, NextResponse } from 'next/server';
import pool from '@/server/database/db';
import { getUserData } from '@/server/database/models';

export async function GET(_request: NextRequest) {
  try {
    const data = await getUserData(pool);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
