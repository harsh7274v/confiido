import mongoose from 'mongoose';

// Cached connection for serverless
let cachedConnection: typeof mongoose | null = null;

export const connectDB = async (): Promise<void> => {
  // Reuse existing connection in serverless environments
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Reusing existing MongoDB connection');
    return;
  }

  try {
    const mongoURI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/lumina';
    const isAtlas = mongoURI.includes('mongodb+srv://');
    const isServerless = process.env['VERCEL'] === '1' || process.env['AWS_LAMBDA_FUNCTION_NAME'];
    
    const connOptions: mongoose.ConnectOptions = {
      // Serverless-optimized connection options
      serverSelectionTimeoutMS: isServerless ? 5000 : 10000,
      socketTimeoutMS: isServerless ? 30000 : 45000,
      connectTimeoutMS: isServerless ? 5000 : 10000,
      maxPoolSize: isServerless ? 10 : 100, // Lower pool size for serverless
      minPoolSize: isServerless ? 1 : 10,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      // Read preference for better performance
      readPreference: 'primaryPreferred',
    };

    // Add SSL/TLS options only for Atlas connections
    // For Node.js v18+ with OpenSSL 3.0, use more permissive settings in development
    if (isAtlas) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      Object.assign(connOptions, {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: isDevelopment, // Allow in dev to bypass SSL errors
        tlsAllowInvalidHostnames: isDevelopment,
      });
    }

    console.log('🔌 Connecting to MongoDB...', { 
      isAtlas,
      isServerless,
      nodeVersion: process.version,
      uriPreview: mongoURI.replace(/(:)([^:@/]+)(@)/, '$1****$3') 
    });
    
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
    mongoose.connection.on('serverDescriptionChanged', (event: any) => {
      const current = event?.newDescription?.error || event?.newDescription?.address;
      if (current) console.warn('ℹ️ Server description changed:', current);
    });
    mongoose.connection.on('serverHeartbeatFailed', (event: any) => {
      console.warn('💔 Server heartbeat failed:', event?.failure || event);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}; 