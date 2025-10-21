// Catch-all debug route for troubleshooting
import dotenv from 'dotenv';
dotenv.config();

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';

import { connectDB } from './config/database';
import Transaction from './models/Transaction';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import SocketService from './services/socketService';
import bookingTimeoutService from './services/bookingTimeoutService';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import expertRoutes from './routes/experts';
import bookingRoutes, { setSocketService as setBookingSocketService } from './routes/bookings';
import messageRoutes from './routes/messages';
import reviewRoutes from './routes/reviews';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
import courseRoutes from './routes/courses';
import enrollmentRoutes from './routes/enrollments';
import webinarRoutes from './routes/webinars';
import bundleRoutes from './routes/bundles';
import digitalProductRoutes from './routes/digitalProducts';
import analyticsRoutes from './routes/analytics';
import availabilityRoutes from './routes/availability';
import calendarRoutes from './routes/calendar';
import rewardsRoutes from './routes/rewards';
import dashboardRoutes from './routes/dashboard';

const app = express();
const server = createServer(app);
const PORT = process.env['PORT'] || 5003;

// Catch-all debug route for troubleshooting
app.use((req, res, next) => {
  console.log('[DEBUG] Incoming request:', req.method, req.originalUrl);
  next();
});

// Initialize Socket.IO service
const socketService = new SocketService(server);

// Security middleware
app.use(helmet());

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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'));
}

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
  next();
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

// Handle favicon.ico requests
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end(); // No content
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/webinars', webinarRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/digital-products', digitalProductRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);
import transactionsRoutes from './routes/transactions';
app.use('/api/transactions', transactionsRoutes);
app.use('/api/rewards', rewardsRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    try {
      // Ensure indexes are in sync and drop legacy snake_case index if present
      await Transaction.syncIndexes();
      const indexes = await Transaction.collection.indexes();
      const legacy = indexes.find((idx: any) => idx.name === 'transaction_id_1');
      if (legacy) {
        console.warn('[INIT] Dropping legacy index transaction_id_1');
        await Transaction.collection.dropIndex('transaction_id_1').catch(() => {});
      }
    } catch (idxErr) {
      console.warn('[INIT] Index sync/cleanup warning:', idxErr);
    }
    
    // Connect socket service with booking timeout service
    bookingTimeoutService.setSocketService(socketService);
    
    // Connect socket service with booking routes
    setBookingSocketService(socketService);
    
    // Start the booking timeout service
    bookingTimeoutService.start(1); // Check every 1 minute
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env['NODE_ENV']}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.IO enabled for real-time messaging`);
      console.log(`⏰ Booking timeout service started (checking every 1 minute)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize database connection for serverless
if (process.env['VERCEL'] === '1') {
  connectDB().catch((err) => {
    console.error('❌ Failed to connect to database on startup:', err);
    // Don't exit, let individual requests handle connection
  });
}

// Only start server if not in Vercel serverless environment
if (process.env['VERCEL'] !== '1') {
  startServer();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  bookingTimeoutService.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  bookingTimeoutService.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;