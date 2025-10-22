import mongoose from 'mongoose';

// Cached connection for serverless environments
let cachedConnection: typeof mongoose | null = null;

export const connectDB = async (): Promise<void> => {
  // Reuse existing connection in serverless environments
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Reusing existing MongoDB connection');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/lumina';
    
    if (!mongoURI || mongoURI === 'mongodb://localhost:27017/lumina') {
      throw new Error('MongoDB URI not configured. Please set MONGODB_URI environment variable.');
    }

    const isAtlas = mongoURI.includes('mongodb+srv://');
    const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    console.log('🔌 Connecting to MongoDB...', { 
      isAtlas,
      isServerless,
      nodeVersion: process.version,
      uriPreview: mongoURI.replace(/(:)([^:@/]+)(@)/, '$1****$3') 
    });
    
    const connOptions: mongoose.ConnectOptions = {
      // Serverless-optimized connection options
      serverSelectionTimeoutMS: isServerless ? 3000 : 10000,
      socketTimeoutMS: isServerless ? 20000 : 45000,
      connectTimeoutMS: isServerless ? 3000 : 10000,
      maxPoolSize: isServerless ? 5 : 100, // Very low pool size for serverless
      minPoolSize: isServerless ? 0 : 10, // No minimum for serverless
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      // Read preference for better performance
      readPreference: 'primaryPreferred',
      // Buffer commands for better performance
      bufferCommands: false,
    };

    // Add SSL/TLS options only for Atlas connections
    if (isAtlas) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      Object.assign(connOptions, {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: isDevelopment,
        tlsAllowInvalidHostnames: isDevelopment,
      });
    }

    cachedConnection = await mongoose.connect(mongoURI, connOptions);
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cachedConnection = null; // Clear cache on error
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      cachedConnection = null; // Clear cache on disconnect
    });

    mongoose.connection.on('connectionPoolCleared', (event: any) => {
      console.warn('⚠️ MongoDB connection pool cleared:', event);
    });
    
    // Graceful shutdown for serverless
    if (isServerless) {
      process.on('SIGTERM', async () => {
        if (cachedConnection) {
          await mongoose.connection.close();
          console.log('MongoDB connection closed through SIGTERM');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Don't exit in serverless environment, let individual requests handle it
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw error;
  }
};

// Function to check if database is connected
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Function to get connection status
export const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState as keyof typeof states],
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};
