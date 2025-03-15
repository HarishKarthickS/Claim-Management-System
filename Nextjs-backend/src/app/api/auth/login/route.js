import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/utils/db';
import User from '@/lib/models/User';
import { JWT_SECRET } from '@/lib/middleware/auth';
import { applyCorsHeaders, corsOptionsResponse } from '@/lib/cors';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;
    console.log('Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      const response = NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
      return applyCorsHeaders(response);
    }

    // Check password
    try {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Password mismatch for user:', email);
        const response = NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
        return applyCorsHeaders(response);
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      const response = NextResponse.json(
        { message: 'Error verifying credentials' },
        { status: 500 }
      );
      return applyCorsHeaders(response);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
    // Apply CORS headers to the success response
    return applyCorsHeaders(response);
  } catch (error) {
    console.error('Login route error:', error);
    const response = NextResponse.json(
      { message: error.message || 'Server error during login' },
      { status: 500 }
    );
    return applyCorsHeaders(response);
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  // Use the corsOptionsResponse function from our CORS library
  return corsOptionsResponse();
} 