const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, checkRole, JWT_SECRET } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    try {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Password mismatch for user:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.status(500).json({ message: 'Error verifying credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
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
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check session (get current user)
router.get('/session', auth, async (req, res) => {
  try {
    // User is already attached to request by auth middleware
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Signout (just a placeholder - JWT invalidation would be handled on the client)
router.post('/signout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router; 