import { NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request) {
  // Get the response
  const response = NextResponse.next();
  
  // Add CORS headers using specific allowed origins
  const allowedOrigins = ['http://localhost:5173', 'https://claim-management-system-rho.vercel.app'];
  const origin = request.headers.get('origin');
  
  // Set CORS headers conditionally based on origin
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // For dev/testing purposes, you could use a wildcard
    // Comment this out for production if you want strict origin checking
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  // Match all request paths except for the ones starting with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};