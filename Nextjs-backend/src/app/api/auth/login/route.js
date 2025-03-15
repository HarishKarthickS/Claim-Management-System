import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/utils/db';
import User from '@/lib/models/User';
import { JWT_SECRET } from '@/lib/middleware/auth';

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