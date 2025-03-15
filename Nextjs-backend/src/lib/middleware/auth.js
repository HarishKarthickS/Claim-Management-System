import jwt from 'jsonwebtoken';
import User from '../models/User';

// Define a consistent JWT secret to use throughout the app
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyToken(token) {
  try {
    if (!token) {
      throw new Error('No authentication token provided.');
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check that the decoded token has the expected properties
    if (!decoded.userId) {
      throw new Error('Invalid token structure.');
    }
    
    // Find the user
    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      throw new Error('User not found.');
    }

    return { user, decoded };
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw error;
  }
}

export async function auth(req) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { success: false, status: 401, message: 'No authentication token provided.' };
    }

    try {
      const { user } = await verifyToken(token);
      return { success: true, user };
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'JsonWebTokenError') {
        return { success: false, status: 401, message: 'Invalid token signature.' };
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return { success: false, status: 401, message: 'Token expired.' };
      }
      
      return { success: false, status: 401, message: 'Authentication failed.' };
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return { success: false, status: 401, message: 'Please authenticate.' };
  }
}

export function checkRole(user, roles) {
  if (!roles.includes(user.role)) {
    return { success: false, status: 403, message: 'Access denied.' };
  }
  return { success: true };
} 