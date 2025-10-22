// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Check if dist folder exists
const distPath = path.join(__dirname, '../dist');
const distExists = fs.existsSync(distPath);

if (!distExists) {
  console.error('❌ ERROR: dist folder not found! TypeScript may not have been compiled.');
  console.error('Expected path:', distPath);
}

// Import database connection
let connectDB, authRoutes, userRoutes, expertRoutes, bookingRoutes, messageRoutes;
let reviewRoutes, paymentRoutes, notificationRoutes, courseRoutes, enrollmentRoutes;
let webinarRoutes, bundleRoutes, digitalProductRoutes, analyticsRoutes, availabilityRoutes;
let calendarRoutes, rewardsRoutes, dashboardRoutes, transactionsRoutes;
let errorHandler, notFound;

try {
  // Import modules with error handling
  ({ connectDB } = require('../dist/config/database'));
  
  // Import route modules (compiled from TypeScript)
  authRoutes = require('../dist/routes/auth');
  userRoutes = require('../dist/routes/users');
  expertRoutes = require('../dist/routes/experts');
  bookingRoutes = require('../dist/routes/bookings');
  messageRoutes = require('../dist/routes/messages');
  reviewRoutes = require('../dist/routes/reviews');
  paymentRoutes = require('../dist/routes/payments');
  notificationRoutes = require('../dist/routes/notifications');
  courseRoutes = require('../dist/routes/courses');
  enrollmentRoutes = require('../dist/routes/enrollments');
  webinarRoutes = require('../dist/routes/webinars');
  bundleRoutes = require('../dist/routes/bundles');
  digitalProductRoutes = require('../dist/routes/digitalProducts');
  analyticsRoutes = require('../dist/routes/analytics');
  availabilityRoutes = require('../dist/routes/availability');
  calendarRoutes = require('../dist/routes/calendar');
  rewardsRoutes = require('../dist/routes/rewards');
  dashboardRoutes = require('../dist/routes/dashboard');
  transactionsRoutes = require('../dist/routes/transactions');
  
  // Import middleware
  ({ errorHandler } = require('../dist/middleware/errorHandler'));
  ({ notFound } = require('../dist/middleware/notFound'));
  
  console.log('✅ Successfully loaded all route modules');
} catch (error) {
  console.error('❌ ERROR loading modules:', error.message);
  console.error('Stack:', error.stack);
}

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
    environment: process.env['NODE_ENV'],
    distExists: distExists,
    routesLoaded: {
      auth: !!authRoutes,
      users: !!userRoutes,
      experts: !!expertRoutes,
      bookings: !!bookingRoutes,
      messages: !!messageRoutes,
      reviews: !!reviewRoutes,
      payments: !!paymentRoutes,
      notifications: !!notificationRoutes,
      courses: !!courseRoutes,
      enrollments: !!enrollmentRoutes,
      webinars: !!webinarRoutes,
      bundles: !!bundleRoutes,
      digitalProducts: !!digitalProductRoutes,
      analytics: !!analyticsRoutes,
      availability: !!availabilityRoutes,
      calendar: !!calendarRoutes,
      dashboard: !!dashboardRoutes,
      transactions: !!transactionsRoutes,
      rewards: !!rewardsRoutes
    }
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
    if (connectDB) {
      await connectDB(); // Will reuse existing connection if available
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ 
      success: false,
      error: 'Service temporarily unavailable - database connection failed' 
    });
  }
});

// Register all API routes with error handling
if (authRoutes) {
  app.use('/api/auth', authRoutes.default || authRoutes);
} else {
  console.error('❌ authRoutes not loaded');
}

if (userRoutes) {
  app.use('/api/users', userRoutes.default || userRoutes);
}

if (expertRoutes) {
  app.use('/api/experts', expertRoutes.default || expertRoutes);
}

if (bookingRoutes) {
  app.use('/api/bookings', bookingRoutes.default || bookingRoutes);
}

if (messageRoutes) {
  app.use('/api/messages', messageRoutes.default || messageRoutes);
}

if (reviewRoutes) {
  app.use('/api/reviews', reviewRoutes.default || reviewRoutes);
}

if (paymentRoutes) {
  app.use('/api/payments', paymentRoutes.default || paymentRoutes);
}

if (notificationRoutes) {
  app.use('/api/notifications', notificationRoutes.default || notificationRoutes);
}

if (courseRoutes) {
  app.use('/api/courses', courseRoutes.default || courseRoutes);
}

if (enrollmentRoutes) {
  app.use('/api/enrollments', enrollmentRoutes.default || enrollmentRoutes);
}

if (webinarRoutes) {
  app.use('/api/webinars', webinarRoutes.default || webinarRoutes);
}

if (bundleRoutes) {
  app.use('/api/bundles', bundleRoutes.default || bundleRoutes);
}

if (digitalProductRoutes) {
  app.use('/api/digital-products', digitalProductRoutes.default || digitalProductRoutes);
}

if (analyticsRoutes) {
  app.use('/api/analytics', analyticsRoutes.default || analyticsRoutes);
}

if (availabilityRoutes) {
  app.use('/api/availability', availabilityRoutes.default || availabilityRoutes);
}

if (calendarRoutes) {
  app.use('/api/calendar', calendarRoutes.default || calendarRoutes);
}

if (dashboardRoutes) {
  app.use('/api/dashboard', dashboardRoutes.default || dashboardRoutes);
}

if (transactionsRoutes) {
  app.use('/api/transactions', transactionsRoutes.default || transactionsRoutes);
}

if (rewardsRoutes) {
  app.use('/api/rewards', rewardsRoutes.default || rewardsRoutes);
}

// Error handling middleware (must be last)
if (notFound) {
  app.use(notFound.default || notFound);
}

if (errorHandler) {
  app.use(errorHandler.default || errorHandler);
}

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
