import { NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request) {
  // Get the origin from the request
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://claim-management-system-rho.vercel.app',
    'http://localhost:5173',
    'https://claim-management-s-git-f79749-harishkarthicks-projects-a601d0a1.vercel.app',
  ];
  
  // Check if the origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    
    // For credentialed requests, we must specify exact origin, not a wildcard
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      // For non-allowed origins or no origin, use wildcard (but credentials won't work)
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    return response;
  }

  // Handle regular requests
  const response = NextResponse.next();
  
  // For credentialed requests, we must specify exact origin, not a wildcard
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // For non-allowed origins or no origin, use wildcard (but credentials won't work)
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
  
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