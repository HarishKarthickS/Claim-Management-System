const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Define a consistent JWT secret to use throughout the app
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    // Log the entire request headers for debugging
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'No authentication token provided.' });
    }

    try {
      // Log the token and secret being used for debugging
      console.log('JWT Secret exists:', !!JWT_SECRET);
      console.log('Token length:', token.length);
      console.log('Token first 10 chars:', token.substring(0, 10) + '...');
      
      // Verify the token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded successfully. User ID:', decoded.userId);
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError.message);
        throw verifyError;
      }
      
      // Check that the decoded token has the expected properties
      if (!decoded.userId) {
        console.log('Invalid token structure:', decoded);
        return res.status(401).json({ message: 'Invalid token structure.' });
      }
      
      // Find the user
      let user;
      try {
        user = await User.findOne({ _id: decoded.userId });
        if (!user) {
          console.log('User not found for token userId:', decoded.userId);
          return res.status(401).json({ message: 'User not found.' });
        }
        console.log('User found:', user.email);
      } catch (dbError) {
        console.error('Database error finding user:', dbError);
        return res.status(500).json({ message: 'Database error.' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'JsonWebTokenError') {
        console.log('JWT verification error:', jwtError.message);
        return res.status(401).json({ message: 'Invalid token signature.' });
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        console.log('Token expired:', jwtError.message);
        return res.status(401).json({ message: 'Token expired.' });
      }
      
      console.log('Unexpected JWT error:', jwtError);
      return res.status(401).json({ message: 'Authentication failed.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    next();
  };
};

// Export the JWT_SECRET for use in other files
module.exports = { auth, checkRole, JWT_SECRET }; 