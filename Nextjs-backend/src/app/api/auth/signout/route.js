import { NextResponse } from 'next/server';

export async function POST() {
  // JWT invalidation would be handled on the client
  return NextResponse.json({ message: 'Logged out successfully' });
} 