// Vercel serverless function entry point - Complete API Integration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');

// Import routes with error handling for missing environment variables
let authRoutes, userRoutes, expertRoutes, bookingRoutes, messageRoutes, reviewRoutes;
let paymentRoutes, notificationRoutes, courseRoutes, enrollmentRoutes, webinarRoutes;
let bundleRoutes, digitalProductRoutes, analyticsRoutes, availabilityRoutes;
let calendarRoutes, rewardsRoutes, dashboardRoutes, transactionsRoutes;
let errorHandler, notFound;

try {
  // Import all your existing routes
  authRoutes = require('../dist/routes/auth').default;
  userRoutes = require('../dist/routes/users').default;
  expertRoutes = require('../dist/routes/experts').default;
  bookingRoutes = require('../dist/routes/bookings').default;
  messageRoutes = require('../dist/routes/messages').default;
  reviewRoutes = require('../dist/routes/reviews').default;
  paymentRoutes = require('../dist/routes/payments').default;
  notificationRoutes = require('../dist/routes/notifications').default;
  courseRoutes = require('../dist/routes/courses').default;
  enrollmentRoutes = require('../dist/routes/enrollments').default;
  webinarRoutes = require('../dist/routes/webinars').default;
  bundleRoutes = require('../dist/routes/bundles').default;
  digitalProductRoutes = require('../dist/routes/digitalProducts').default;
  analyticsRoutes = require('../dist/routes/analytics').default;
  availabilityRoutes = require('../dist/routes/availability').default;
  calendarRoutes = require('../dist/routes/calendar').default;
  rewardsRoutes = require('../dist/routes/rewards').default;
  dashboardRoutes = require('../dist/routes/dashboard').default;
  transactionsRoutes = require('../dist/routes/transactions').default;

  // Import middleware
  errorHandler = require('../dist/middleware/errorHandler').errorHandler;
  notFound = require('../dist/middleware/notFound').notFound;
  
  console.log('✅ All routes imported successfully');
} catch (error) {
  console.error('❌ Error importing routes:', error.message);
  console.log('This is expected if Firebase environment variables are missing');
  console.log('Routes will be loaded when environment variables are properly set');
}

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

// Database connection for Vercel serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 1, // Maintain up to 1 socket connection for serverless
      minPoolSize: 0, // Close connections when not in use
      maxIdleTimeMS: 10000, // Close connections after 10 seconds of inactivity
    });
    
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Connect to database on first request (only for routes that need DB)
app.use(async (req, res, next) => {
  // Skip DB connection for health and debug endpoints
  if (req.path === '/api/health' || req.path === '/api/debug/db') {
    return next();
  }
  
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Lumina API is running',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV']
  });
});

// Database diagnostic endpoint
app.get('/api/debug/db', async (_req, res) => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
    
    res.json({
      success: true,
      data: {
        hasMongoUri: !!mongoUri,
        mongoUriPrefix: mongoUri ? mongoUri.substring(0, 20) + '...' : 'Not set',
        environment: process.env.NODE_ENV,
        isConnected: isConnected,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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

// API Routes - Register routes only if they were imported successfully
if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered');
}
if (userRoutes) {
  app.use('/api/users', userRoutes);
  console.log('✅ User routes registered');
}
if (expertRoutes) {
  app.use('/api/experts', expertRoutes);
  console.log('✅ Expert routes registered');
}
if (bookingRoutes) {
  app.use('/api/bookings', bookingRoutes);
  console.log('✅ Booking routes registered');
}
if (messageRoutes) {
  app.use('/api/messages', messageRoutes);
  console.log('✅ Message routes registered');
}
if (reviewRoutes) {
  app.use('/api/reviews', reviewRoutes);
  console.log('✅ Review routes registered');
}
if (paymentRoutes) {
  app.use('/api/payments', paymentRoutes);
  console.log('✅ Payment routes registered');
}
if (notificationRoutes) {
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notification routes registered');
}
if (courseRoutes) {
  app.use('/api/courses', courseRoutes);
  console.log('✅ Course routes registered');
}
if (enrollmentRoutes) {
  app.use('/api/enrollments', enrollmentRoutes);
  console.log('✅ Enrollment routes registered');
}
if (webinarRoutes) {
  app.use('/api/webinars', webinarRoutes);
  console.log('✅ Webinar routes registered');
}
if (bundleRoutes) {
  app.use('/api/bundles', bundleRoutes);
  console.log('✅ Bundle routes registered');
}
if (digitalProductRoutes) {
  app.use('/api/digital-products', digitalProductRoutes);
  console.log('✅ Digital product routes registered');
}
if (analyticsRoutes) {
  app.use('/api/analytics', analyticsRoutes);
  console.log('✅ Analytics routes registered');
}
if (availabilityRoutes) {
  app.use('/api/availability', availabilityRoutes);
  console.log('✅ Availability routes registered');
}
if (calendarRoutes) {
  app.use('/api/calendar', calendarRoutes);
  console.log('✅ Calendar routes registered');
}
if (dashboardRoutes) {
  app.use('/api/dashboard', dashboardRoutes);
  console.log('✅ Dashboard routes registered');
}
if (transactionsRoutes) {
  app.use('/api/transactions', transactionsRoutes);
  console.log('✅ Transaction routes registered');
}
if (rewardsRoutes) {
  app.use('/api/rewards', rewardsRoutes);
  console.log('✅ Reward routes registered');
}

// Error handling middleware (must be last)
if (notFound) {
  app.use(notFound);
}
if (errorHandler) {
  app.use(errorHandler);
}

// Export for Vercel
module.exports = app;