import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import OTP from '../models/OTP';
import { sendOTPEmail } from '../services/mailer';
import { AppError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { verifyFirebaseToken } from '../middleware/firebaseAuth';

const router = express.Router();

// Generate JWT Token
const generateToken = (id: string): string => {
  // Simple token generation for development
  return `token_${id}_${Date.now()}`;
};
router.post('/request-otp', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email } = req.body;
  console.log('OTP request for email:', email);
  const user = await User.findOne({ email });
  console.log('User found:', user);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    // Remove previous OTPs
    await OTP.deleteMany({ email });
    // Save OTP
    await OTP.create({ email, otp, expiresAt });
    // Send OTP email
    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, otp } = req.body;
    const otpDoc = await OTP.findOne({ email, otp });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP' });
    }
    // OTP valid, delete it
    await OTP.deleteMany({ email });
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // Generate token
    const token = generateToken(user._id.toString());
    res.json({
      success: true,
      message: 'OTP verified, login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isExpert: user.isExpert,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('age')
    .optional()
    .isInt({ min: 16, max: 100 })
    .withMessage('Age must be between 16 and 100'),
  body('profession')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Profession must be between 2 and 100 characters'),
  body('domain')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Domain must be between 2 and 100 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      dateOfBirth, 
      gender,
      age,
      category,
      profession,
      domain,
      linkedinId
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Generate a unique 4-digit user_id
    let user_id;
    let tries = 0;
    do {
      user_id = Math.floor(1000 + Math.random() * 9000).toString();
      // Check uniqueness
      // eslint-disable-next-line no-await-in-loop
      var existingId = await User.findOne({ user_id });
      tries++;
    } while (existingId && tries < 10);
    if (existingId) {
      return res.status(500).json({ success: false, error: 'Could not generate unique user_id. Please try again.' });
    }

    // Prepare user data
    const userData: any = {
      email,
      password, // Will be hashed by the pre-save middleware
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      isVerified: false,
      isActive: true,
      role: 'user',
      user_id
  // Avatar/profile picture logic removed
    };

    // Add additional profile data if provided
    if (age) userData.age = parseInt(age);
    if (category) userData.category = category;
    if (profession) userData.profession = profession;
    if (domain) userData.domain = domain;
    if (linkedinId) {
      userData.socialLinks = {
        linkedin: linkedinId
      };
    }

    // Create user - password will be automatically hashed by pre-save middleware
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profession: user.profession,
          domain: user.domain,
          category: user.category,
          isExpert: user.isExpert,
          isVerified: user.isVerified,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isExpert: user.isExpert,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/verify
// @desc    Verify Firebase token and sync user
// @access  Public
router.post('/verify', verifyFirebaseToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { 
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name || `${req.user.firstName} ${req.user.lastName}`,
          avatar: req.user.avatar,
          role: req.user.role || 'user'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Private
router.post('/refresh', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isExpert: user.isExpert,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User with this email does not exist'
      });
    }

    // Generate reset token (in a real app, you'd send this via email)
    const resetToken = `reset_${user._id.toString()}_${Date.now()}`;

    // TODO: Send email with reset link
    // For now, just return the token
    res.json({
      success: true,
      message: 'Password reset email sent',
      data: { resetToken } // Remove this in production
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Verify token (simplified for development)
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      throw new Error('Invalid token format');
    }
    const decoded = { id: tokenParts[1] };
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token'
      });
    }

    // Update password
    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
});

export default router;