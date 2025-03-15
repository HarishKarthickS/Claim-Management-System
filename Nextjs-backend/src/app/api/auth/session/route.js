import { NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import { auth } from '@/lib/middleware/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    const authResult = await auth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: authResult.status }
      );
    }

    // User is authenticated, return user info
    return NextResponse.json({
      user: {
        id: authResult.user._id,
        name: authResult.user.name,
        email: authResult.user.email,
        role: authResult.user.role
      }
    });
  } catch (error) {
    console.error('Session route error:', error);
    return NextResponse.json(
      { message: error.message || 'Server error' },
      { status: 500 }
    );
  }
} 