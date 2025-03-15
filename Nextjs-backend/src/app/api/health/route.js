import { NextResponse } from 'next/server';

export async function GET(request) {
  // Create the response
  return NextResponse.json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, { status: 200 });
}

// OPTIONS request is now handled by the middleware