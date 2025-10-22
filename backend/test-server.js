// Simple test server for MongoDB connection testing
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Database connection for testing
let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  
  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }
  
  connectionPromise = (async () => {
    try {
      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
      }
      
      // Get MongoDB URI from environment variables
      const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
      console.log('MongoDB URI found:', !!mongoUri);
      console.log('Environment:', process.env.NODE_ENV);
      
      if (!mongoUri) {
        throw new Error('MongoDB URI not found in environment variables. Please check MONGODB_URI in .env file.');
      }
      
      // Close any existing connection first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      // Connect with serverless-optimized settings
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false,
        maxPoolSize: 1,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
      });
      
      isConnected = true;
      console.log('✅ MongoDB connected successfully');
      console.log('Connection state:', mongoose.connection.readyState);
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      isConnected = false;
      connectionPromise = null;
      throw error;
    }
  })();
  
  return connectionPromise;
};

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Test API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Environment variables test endpoint
app.get('/api/test/env', (_req, res) => {
  res.json({
    success: true,
    data: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasMongoUriProd: !!process.env.MONGODB_URI_PROD,
      mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('MONGO')),
      timestamp: new Date().toISOString()
    }
  });
});

// Database diagnostic endpoint
app.get('/api/debug/db', async (_req, res) => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Try to connect if not already connected
    let connectionTest = null;
    if (connectionState !== 1) {
      try {
        await connectDB();
        connectionTest = 'success';
      } catch (error) {
        connectionTest = error.message;
      }
    }
    
    res.json({
      success: true,
      data: {
        hasMongoUri: !!mongoUri,
        mongoUriPrefix: mongoUri ? mongoUri.substring(0, 20) + '...' : 'Not set',
        environment: process.env.NODE_ENV,
        isConnected: isConnected,
        connectionState: connectionStates[connectionState] || 'unknown',
        connectionTest: connectionTest,
        timestamp: new Date().toISOString(),
        allEnvVars: Object.keys(process.env).filter(key => key.includes('MONGO'))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test database connection endpoint
app.get('/api/test/db', async (_req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: 'Database connection successful',
      connectionState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Test Server for MongoDB Connection',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment test: http://localhost:${PORT}/api/test/env`);
  console.log(`🗄️  Database debug: http://localhost:${PORT}/api/debug/db`);
  console.log(`🔗 Database test: http://localhost:${PORT}/api/test/db`);
});
