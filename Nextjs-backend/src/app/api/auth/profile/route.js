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

    // Return user profile without password
    const user = authResult.user.toObject();
    delete user.password;
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile route error:', error);
    return NextResponse.json(
      { message: error.message || 'Server error' },
      { status: 500 }
    );
  }
} 