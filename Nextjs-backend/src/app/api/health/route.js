import { NextResponse } from 'next/server';
import { applyCorsHeaders, corsOptionsResponse } from '../../../lib/cors';

export async function GET(request) {
  // Create the response
  return NextResponse.json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, { status: 200 });
<<<<<<< HEAD
}

// OPTIONS request is now handled by the middleware 
=======

  // Apply CORS headers using our utility function
  return applyCorsHeaders(response);
}

// Handle OPTIONS request explicitly
export async function OPTIONS() {
  // Use the utility function for OPTIONS responses
  return corsOptionsResponse();
} 
>>>>>>> 30f2ea48ac69ba7ec117be8d42a37812d542ee83
