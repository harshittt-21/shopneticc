const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({ 
      username, 
      email, 
      password, 
      isAdmin: isAdmin || false 
    });
    
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.isAdmin 
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.isAdmin 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// Get Current User
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      isAdmin: req.user.isAdmin
    }
  });
});

module.exports = router;
