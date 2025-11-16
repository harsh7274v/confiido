import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import OTP from '../models/OTP';
import Reward from '../models/Reward';
import { sendOTPEmail } from '../services/mailer';
import { sendWelcomeEmail } from '../services/welcomeEmail';
import { AppError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { verifyFirebaseToken } from '../middleware/firebaseAuth';
import { verifyFirebaseToken as verifyFirebaseTokenNew, isFirebaseAvailable } from '../config/firebase.server';
import { generateJWTToken } from '../utils/jwtGenerator';
import { generateUniqueUserId } from '../utils/userIdGenerator';

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
    // Rate limit: max 3 login OTP requests per 10 minutes per email
    const tenMinutesAgoLogin = new Date(Date.now() - 10 * 60 * 1000);
    const recentLoginCount = await OTP.countDocuments({ email, type: 'login', createdAt: { $gte: tenMinutesAgoLogin } });
    if (recentLoginCount >= 3) {
      return res.status(429).json({ success: false, error: 'Too many OTP requests. Try again in 10 minutes.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    // Remove previous OTPs
    await OTP.deleteMany({ email, type: 'login' });
    // Save OTP
    await OTP.create({ email, otp, expiresAt, type: 'login' });
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
    const otpDoc = await OTP.findOne({ email, otp, type: 'login' });
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
          role: user.role,
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

// @route   POST /api/auth/send-signup-otp
// @desc    Send OTP for signup verification
// @access  Public
router.post('/send-signup-otp', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    // Rate limit check
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Run independent checks in parallel for faster response
    const [existingUser, recentSignupCount] = await Promise.all([
      User.findOne({ email }),
      OTP.countDocuments({ 
        email, 
        type: 'signup', 
        createdAt: { $gte: tenMinutesAgo } 
      })
    ]);

    // Check if user already exists
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Rate limit: max 3 signup OTP requests per 10 minutes per email
    if (recentSignupCount >= 3) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many OTP requests. Try again in 10 minutes.' 
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Remove previous signup OTPs for this email
    await OTP.deleteMany({ email, type: 'signup' });

    // Save OTP
    await OTP.create({ email, otp, expiresAt, type: 'signup' });

    // Send OTP email (await to ensure it sends in serverless environment)
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      console.error('Failed to send signup OTP email to', email, ':', emailErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification code. Please try again.'
      });
    }

    res.json({ 
      success: true, 
      message: 'Verification code sent to email' 
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/verify-signup-otp
// @desc    Verify signup OTP and create account
// @access  Public
router.post('/verify-signup-otp', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp, password, firstName, lastName, userType } = req.body;

    // Verify OTP
    const otpDoc = await OTP.findOne({ email, otp, type: 'signup' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired verification code' 
      });
    }

    // Check if user already exists (double-check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // OTP valid, delete it
    await OTP.deleteMany({ email, type: 'signup' });

    // Generate a unique serial user_id starting from 1000
    const user_id = await generateUniqueUserId();

    // Determine role based on userType
    const role = userType === 'professional' ? 'expert' : 'user';

    // Create user
    const userData: any = {
      email,
      password, // Will be hashed by the pre-save middleware
      firstName,
      lastName,
      isVerified: true, // Email is verified through OTP
      isActive: true,
      role,
      isExpert: role === 'expert',
      user_id
    };

    const user = await User.create(userData);

    // Create initial rewards for the new user
    try {
      await Reward.create({
        userId: user._id,
        user_id: user.user_id,
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
        history: [
          {
            type: 'earned',
            description: 'Welcome bonus for new user registration',
            points: 0,
            status: 'completed',
            date: new Date(),
          },
        ],
      });
      console.log(`✅ Rewards created for new user: ${user.email} (${user.user_id})`);
    } catch (rewardError) {
      console.error('Failed to create rewards for new user:', rewardError);
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.firstName).catch(err => {
      console.error('Failed to send welcome email to', user.email, ':', err);
      // Email failure doesn't affect account creation
    });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
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

    // Generate a unique serial user_id starting from 1000
    const user_id = await generateUniqueUserId();

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

    // Create initial rewards for the new user
    try {
      await Reward.create({
        userId: user._id,
        user_id: user.user_id, // Include the 4-digit unique user_id
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
        history: [
          {
            type: 'earned',
            description: 'Welcome bonus for new user registration',
            points: 0,
            status: 'completed',
            date: new Date(),
          },
        ],
      });
      console.log(`✅ Rewards created for new user: ${user.email} (${user.user_id})`);
    } catch (rewardError) {
      console.error('Failed to create rewards for new user:', rewardError);
      // Don't fail registration if rewards creation fails
    }

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
          role: user.role,
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
// @desc    Verify Firebase token and sync user (legacy)
// @access  Public
router.post('/verify', verifyFirebaseToken, async (req, res, next) => {
  try {
    // Use JWT token from middleware if available, otherwise generate new one
    const jwtToken = (req as any).jwtToken || generateJWTToken(req.user.user_id);
    
    res.json({
      success: true,
      message: 'Firebase token verified successfully',
      data: { 
        user: {
          id: req.user._id,
          user_id: req.user.user_id, // Include the 4-digit user_id
          email: req.user.email,
          name: req.user.name || `${req.user.firstName} ${req.user.lastName}`,
          avatar: req.user.avatar,
          role: req.user.role || 'user'
        },
        token: jwtToken // Return JWT token for future authentication
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/firebase/verify
// @desc    Verify Firebase ID token and sync/create user (new implementation)
// @access  Public
router.post('/firebase/verify', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { idToken } = req.body;

    // Check if Firebase is available
    if (!isFirebaseAvailable()) {
      console.error('❌ Firebase not available. Check environment variables:');
      console.error('  FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
      console.error('  FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
      console.error('  FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
      
      return res.status(503).json({ 
        success: false, 
        error: 'Firebase authentication is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.' 
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyFirebaseTokenNew(idToken);

    // Find or create user
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Check if user exists with this email
      const existingUser = await User.findOne({ email: decodedToken.email });

      if (existingUser) {
        // Link Firebase account to existing user
        existingUser.firebaseUid = decodedToken.uid;
        existingUser.isVerified = true;
        existingUser.lastLogin = new Date();
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new Firebase user
        const nameParts = (decodedToken.name || '').split(' ') || ['', ''];
        const user_id = await generateUniqueUserId();

        user = new User({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          role: 'user',
          isExpert: false,
          isVerified: true,
          isActive: true,
          lastLogin: new Date(),
          username: '',
          password: 'firebase_dummy_password',
          phone: '',
          phoneNumber: '',
          whatsappNumber: '',
          dateOfBirth: null,
          gender: 'prefer-not-to-say',
          age: null,
          category: 'student',
          profession: '',
          domain: '',
          location: {
            country: '',
            city: '',
            timezone: 'UTC'
          },
          bio: '',
          user_id: user_id,
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: false
            },
            privacy: {
              profileVisibility: 'public',
              showOnlineStatus: true
            }
          },
          socialLinks: {
            linkedin: '',
            twitter: '',
            website: ''
          }
        });

        await user.save();

        // Create initial rewards
        try {
          await Reward.create({
            userId: user._id,
            user_id: user.user_id,
            points: 0,
            totalEarned: 0,
            totalSpent: 0,
            history: [{
              type: 'earned',
              description: 'Welcome bonus for Firebase user registration',
              points: 0,
              status: 'completed',
              date: new Date(),
            }],
          });
        } catch (rewardError) {
          console.error('Failed to create rewards for Firebase user:', rewardError);
        }
      }
    } else {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token
    const jwtToken = generateJWTToken(user.user_id);

    res.json({
      success: true,
      message: 'Firebase authentication successful',
      data: {
        user: {
          id: user._id,
          user_id: user.user_id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: user.role || 'user',
          isExpert: user.isExpert || false,
          isVerified: user.isVerified
        },
        token: jwtToken
      }
    });
  } catch (error: any) {
    console.error('Firebase verification error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Failed to verify Firebase token'
    });
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

    // Rate limit: max 3 reset requests per 10 minutes per email
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await OTP.countDocuments({ email, type: 'reset', createdAt: { $gte: tenMinutesAgo } });
    if (recentCount >= 3) {
      return res.status(429).json({ success: false, error: 'Too many reset requests. Try again in 10 minutes.' });
    }

    // Generate a 6-digit numeric code and store in OTP collection with expiry (5 minutes)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.deleteMany({ email, type: 'reset', expiresAt: { $lt: new Date() } });
    await OTP.create({ email, otp: resetCode, expiresAt, type: 'reset' });

    // Try to send via email using existing mailer
    try {
      const { sendSessionEmail } = await import('../services/mailer');
      const subject = 'Your password reset code';
      const text = `Your password reset code is: ${resetCode}. It will expire in 5 minutes.`;
      await sendSessionEmail(user.email, subject, text);
    } catch (mailErr) {
      console.error('Failed to send reset email:', mailErr);
    }

    res.json({
      success: true,
      message: 'Password reset code sent to email'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[^A-Za-z0-9]).+$/)
    .withMessage('Password must include at least one special character')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, otp, password } = req.body as { email: string; otp: string; password: string };

    // Verify OTP for this email
    const otpDoc = await OTP.findOne({ email, otp, type: 'reset' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code'
      });
    }

    // OTP valid: delete it and update password
    await OTP.deleteMany({ email });
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
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