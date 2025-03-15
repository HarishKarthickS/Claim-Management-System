import { NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request) {
  // Get the origin from the request
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://claim-management-system-rho.vercel.app',
    'https://claim-management-system-6zxd.vercel.app',
    'http://localhost:5173',
    'https://claim-management-s-git-f79749-harishkarthicks-projects-a601d0a1.vercel.app',
  ];
  
  console.log('Middleware - Request origin:', origin); // Debug logging
  
  // Check if the origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  console.log('Middleware - Is origin allowed:', isAllowedOrigin); // Debug logging
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    console.log('Middleware - Handling OPTIONS request');
    const response = new NextResponse(null, { status: 204 });
    
    // Always set exact origin for credentialed requests
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Debug log the response headers
    console.log('Middleware - OPTIONS response headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
    });
    
    return response;
  }

  // Handle regular requests
  const response = NextResponse.next();
  
  // Always set exact origin for credentialed requests
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
  
  // Debug log the response headers
  console.log('Middleware - Regular response headers:', {
    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
  });
  
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