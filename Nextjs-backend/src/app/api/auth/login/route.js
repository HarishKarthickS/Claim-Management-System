import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/utils/db';
import User from '@/lib/models/User';
import { JWT_SECRET } from '@/lib/middleware/auth';
// Import removed to avoid conflicts with middleware.js

export async function POST(request) {
  console.log('Login route - POST request received');
  
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;
    console.log('Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      // Using direct NextResponse without applyCorsHeaders
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    try {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Password mismatch for user:', email);
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return NextResponse.json(
        { message: 'Error verifying credentials' },
        { status: 500 }
      );
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', email);
    
    // Return response directly - middleware will add CORS headers
    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json(
      { message: error.message || 'Server error during login' },
      { status: 500 }
    );
  }
}

// OPTIONS handler is handled by middleware.js
export async function OPTIONS() {
  console.log('Login route - OPTIONS request received');
  return new NextResponse(null, { status: 204 });
} 