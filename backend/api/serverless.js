// Comprehensive Serverless Backend for Vercel
// This file contains all backend logic optimized for serverless deployment

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Initialize Express app
const app = express();

// Set Vercel environment flag
process.env.VERCEL = '1';

// ============================================================================
// DATABASE CONNECTION (Serverless Optimized)
// ============================================================================

let cachedConnection = null;

const connectDB = async () => {
  // Reuse existing connection in serverless environments
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Reusing existing MongoDB connection');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not configured. Please set MONGODB_URI environment variable.');
    }

    const isAtlas = mongoURI.includes('mongodb+srv://');
    
    console.log('🔌 Connecting to MongoDB...', { 
      isAtlas,
      isServerless: true,
      nodeVersion: process.version,
      uriPreview: mongoURI.replace(/(:)([^:@/]+)(@)/, '$1****$3') 
    });
    
    const connOptions = {
      // Serverless-optimized connection options
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 3000,
      maxPoolSize: 5, // Very low pool size for serverless
      minPoolSize: 0, // No minimum for serverless
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      readPreference: 'primaryPreferred',
      bufferCommands: false,
      bufferMaxEntries: 0,
    };

    // Add SSL/TLS options for Atlas connections
    if (isAtlas) {
      Object.assign(connOptions, {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development',
        tlsAllowInvalidHostnames: process.env.NODE_ENV === 'development',
      });
    }

    cachedConnection = await mongoose.connect(mongoURI, connOptions);
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cachedConnection = null;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      cachedConnection = null;
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  'https://confiido.in',
  'https://www.confiido.in',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
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
  maxAge: 86400
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================================
// DATABASE CONNECTION MIDDLEWARE
// ============================================================================

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ 
      success: false,
      error: 'Service temporarily unavailable - database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// ROUTE LOADING
// ============================================================================

let routesLoaded = 0;
let routesFailed = 0;
const routeErrors = [];

const loadRoute = (routePath, routeName) => {
  try {
    const routeModule = require(routePath);
    // Handle both CommonJS and ES6 default exports
    const route = routeModule.default || routeModule;
    
    if (typeof route !== 'function') {
      throw new Error(`Route is not a function, got ${typeof route}`);
    }
    
    app.use(`/api/${routeName}`, route);
    routesLoaded++;
    console.log(`✅ Loaded ${routeName} routes`);
    return true;
  } catch (error) {
    routesFailed++;
    routeErrors.push(`${routeName}: ${error.message}`);
    console.error(`❌ Failed to load ${routeName} routes:`, error.message);
    
    // Create a fallback route for failed routes
    app.use(`/api/${routeName}`, (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: `${routeName} routes failed to load`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
    
    return false;
  }
};

// Load all API routes
console.log('Loading API routes...');

// Core routes
loadRoute('../dist/routes/auth', 'auth');
loadRoute('../dist/routes/users', 'users');
loadRoute('../dist/routes/experts', 'experts');
loadRoute('../dist/routes/bookings', 'bookings');
loadRoute('../dist/routes/messages', 'messages');
loadRoute('../dist/routes/reviews', 'reviews');
loadRoute('../dist/routes/payments', 'payments');
loadRoute('../dist/routes/notifications', 'notifications');

// Course and education routes
loadRoute('../dist/routes/courses', 'courses');
loadRoute('../dist/routes/enrollments', 'enrollments');
loadRoute('../dist/routes/webinars', 'webinars');
loadRoute('../dist/routes/bundles', 'bundles');
loadRoute('../dist/routes/digitalProducts', 'digital-products');

// Business and analytics routes
loadRoute('../dist/routes/analytics', 'analytics');
loadRoute('../dist/routes/availability', 'availability');
loadRoute('../dist/routes/calendar', 'calendar');
loadRoute('../dist/routes/dashboard', 'dashboard');
loadRoute('../dist/routes/transactions', 'transactions');
loadRoute('../dist/routes/rewards', 'rewards');

console.log(`\n📊 Route Loading Summary:`);
console.log(`✅ Successfully loaded: ${routesLoaded} routes`);
console.log(`❌ Failed to load: ${routesFailed} routes`);

if (routeErrors.length > 0) {
  console.log(`\n⚠️ Route Errors:`);
  routeErrors.forEach(error => console.log(`  - ${error}`));
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

let errorHandler, notFound;
try {
  errorHandler = require('../dist/middleware/errorHandler').errorHandler;
  notFound = require('../dist/middleware/notFound').notFound;
  console.log('✅ Error handling middleware loaded');
} catch (error) {
  console.error('❌ Failed to load error handling middleware:', error.message);
  
  // Fallback error handlers
  notFound = (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method
    });
  };
  
  errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  };
}

// ============================================================================
// ENDPOINTS
// ============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Lumina API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    vercel: process.env.VERCEL === '1',
    database: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState
    }
  });
});

// Detailed health check
app.get('/api/health/detailed', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Lumina API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    vercel: process.env.VERCEL === '1',
    routes: {
      loaded: routesLoaded,
      failed: routesFailed,
      errors: routeErrors
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }
  });
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Lumina Backend API',
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      detailed: '/api/health/detailed'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// ============================================================================
// EXPORT FOR VERCEL
// ============================================================================

module.exports = app;
