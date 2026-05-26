import { NextResponse } from 'next/server';
import { generateUserData } from '@/server/mockData';

export async function GET() {
  try {
    const data = generateUserData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
