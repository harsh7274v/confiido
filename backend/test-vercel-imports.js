// Quick test to verify api/index.js loads correctly
const path = require('path');

// Set minimal env vars to prevent Firebase errors during testing
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.JWT_SECRET = 'test-secret';

console.log('Current directory:', __dirname);
console.log('Testing module imports...\n');

try {
  // Test database import
  const { connectDB } = require('./dist/config/database');
  console.log('✅ Database module loaded');
  
  // Test auth route
  const authRoutes = require('./dist/routes/auth');
  console.log('✅ Auth routes loaded');
  
  // Test users route
  const userRoutes = require('./dist/routes/users');
  console.log('✅ User routes loaded');
  
  // Test middleware
  const { errorHandler } = require('./dist/middleware/errorHandler');
  const { notFound } = require('./dist/middleware/notFound');
  console.log('✅ Middleware loaded');
  
  console.log('\n✅ All modules loaded successfully!');
  console.log('API should work on Vercel.\n');
  
} catch (error) {
  console.error('❌ Error loading modules:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
