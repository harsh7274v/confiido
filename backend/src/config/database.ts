import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/lumina';
    const isAtlas = mongoURI.includes('mongodb+srv://');
    const connOptions: mongoose.ConnectOptions = {
      // Enhanced connection options for better reliability
      serverSelectionTimeoutMS: 30000, // Increased from 10s to 30s
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000, // Added connection timeout
      maxPoolSize: 10,
      minPoolSize: 1,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true, // Added retry reads
      tls: isAtlas ? true : undefined,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    };

    console.log('🔌 Connecting to MongoDB...', { isAtlas, uriPreview: mongoURI.replace(/(:)([^:@/]+)(@)/, '$1****$3') });
    await mongoose.connect(mongoURI, connOptions);
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
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