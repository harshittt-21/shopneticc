const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Regular user authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, access denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
};

// Admin authentication
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }
    
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false,
      message: 'Admin access denied' 
    });
  }
};

module.exports = { auth, adminAuth };
