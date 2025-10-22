// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import database connection
const { connectDB } = require('../dist/config/database');

// Import route modules (compiled from TypeScript)
const authRoutes = require('../dist/routes/auth');
const userRoutes = require('../dist/routes/users');
const expertRoutes = require('../dist/routes/experts');
const bookingRoutes = require('../dist/routes/bookings');
const messageRoutes = require('../dist/routes/messages');
const reviewRoutes = require('../dist/routes/reviews');
const paymentRoutes = require('../dist/routes/payments');
const notificationRoutes = require('../dist/routes/notifications');
const courseRoutes = require('../dist/routes/courses');
const enrollmentRoutes = require('../dist/routes/enrollments');
const webinarRoutes = require('../dist/routes/webinars');
const bundleRoutes = require('../dist/routes/bundles');
const digitalProductRoutes = require('../dist/routes/digitalProducts');
const analyticsRoutes = require('../dist/routes/analytics');
const availabilityRoutes = require('../dist/routes/availability');
const calendarRoutes = require('../dist/routes/calendar');
const rewardsRoutes = require('../dist/routes/rewards');
const dashboardRoutes = require('../dist/routes/dashboard');
const transactionsRoutes = require('../dist/routes/transactions');

// Import middleware
const { errorHandler } = require('../dist/middleware/errorHandler');
const { notFound } = require('../dist/middleware/notFound');

// Import your existing app configuration
const app = express();

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
  'https://confiido.in',
  'https://www.confiido.in',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Lumina API is running',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV']
  });
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Lumina Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Database connection middleware for API routes (serverless)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB(); // Will reuse existing connection if available
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ 
      success: false,
      error: 'Service temporarily unavailable - database connection failed' 
    });
  }
});

// Register all API routes
app.use('/api/auth', authRoutes.default || authRoutes);
app.use('/api/users', userRoutes.default || userRoutes);
app.use('/api/experts', expertRoutes.default || expertRoutes);
app.use('/api/bookings', bookingRoutes.default || bookingRoutes);
app.use('/api/messages', messageRoutes.default || messageRoutes);
app.use('/api/reviews', reviewRoutes.default || reviewRoutes);
app.use('/api/payments', paymentRoutes.default || paymentRoutes);
app.use('/api/notifications', notificationRoutes.default || notificationRoutes);
app.use('/api/courses', courseRoutes.default || courseRoutes);
app.use('/api/enrollments', enrollmentRoutes.default || enrollmentRoutes);
app.use('/api/webinars', webinarRoutes.default || webinarRoutes);
app.use('/api/bundles', bundleRoutes.default || bundleRoutes);
app.use('/api/digital-products', digitalProductRoutes.default || digitalProductRoutes);
app.use('/api/analytics', analyticsRoutes.default || analyticsRoutes);
app.use('/api/availability', availabilityRoutes.default || availabilityRoutes);
app.use('/api/calendar', calendarRoutes.default || calendarRoutes);
app.use('/api/dashboard', dashboardRoutes.default || dashboardRoutes);
app.use('/api/transactions', transactionsRoutes.default || transactionsRoutes);
app.use('/api/rewards', rewardsRoutes.default || rewardsRoutes);

// Error handling middleware (must be last)
app.use(notFound.default || notFound);
app.use(errorHandler.default || errorHandler);

// REMOVE THE MOCK ENDPOINTS BELOW - they are replaced by the real routes above
/* 
// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // For now, return a mock response to test connectivity
    // TODO: Replace with actual authentication logic
    res.json({
      success: true,
      message: 'Login endpoint is working',
      data: {
        user: {
          id: 'test-user-id',
          email: email,
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isExpert: false,
          isVerified: true
        },
        token: 'mock-jwt-token'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Firebase token verification endpoint
app.post('/api/auth/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }
    
    // For now, return a mock response
    // TODO: Replace with actual Firebase token verification
    res.json({
      success: true,
      message: 'Firebase token verified',
      data: {
        user: {
          id: 'firebase-user-id',
          email: 'user@example.com',
          firstName: 'Firebase',
          lastName: 'User',
          role: 'user',
          isExpert: false,
          isVerified: true
        },
        token: 'mock-jwt-token'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// OTP request endpoint
app.post('/api/auth/request-otp', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // For now, return a mock response
    // TODO: Replace with actual OTP sending logic
    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        email: email,
        otpSent: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// OTP verification endpoint
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }
    
    // For now, return a mock response
    // TODO: Replace with actual OTP verification logic
    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          id: 'otp-user-id',
          email: email,
          firstName: 'OTP',
          lastName: 'User',
          role: 'user',
          isExpert: false,
          isVerified: true
        },
        token: 'mock-jwt-token'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// User registration endpoint
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    // For now, return a mock response
    // TODO: Replace with actual registration logic
    res.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: 'new-user-id',
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: 'user',
          isExpert: false,
          isVerified: true
        },
        token: 'mock-jwt-token'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }
    
    // For now, return a mock response
    // TODO: Replace with actual user retrieval logic
    res.json({
      success: true,
      data: {
        user: {
          id: 'current-user-id',
          email: 'user@example.com',
          firstName: 'Current',
          lastName: 'User',
          role: 'user',
          isExpert: false,
          isVerified: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  try {
    // For now, return a mock response
    // TODO: Replace with actual logout logic (token blacklisting, etc.)
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
*/

// Export for Vercel
module.exports = app;
