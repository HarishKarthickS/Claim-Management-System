import { NextResponse } from 'next/server';

export function GET() {
  return new NextResponse(
    JSON.stringify({
      message: 'WebSocket endpoint is available at /api/socket/io'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
} 