import { NextRequest, NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the response
  const response = NextResponse.next();

  // Add the CORS headers to the response
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // If it's a preflight request (OPTIONS), return with 200
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200 });
  }

  return response;
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
}; 