import { NextResponse } from 'next/server';

/**
 * Applies CORS headers to a NextResponse object
 * @param response The NextResponse object to add headers to
 * @returns The NextResponse object with CORS headers
 */
export function applyCorsHeaders(response: NextResponse): NextResponse {
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

/**
 * Creates an OPTIONS response with CORS headers
 * @returns A NextResponse object for OPTIONS requests
 */
export function corsOptionsResponse(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return applyCorsHeaders(response);
}
