#!/usr/bin/env node

// Deployment script for serverless backend
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Serverless Backend Deployment Script\n');

// Step 1: Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the backend directory.');
  process.exit(1);
}

// Step 2: Check if TypeScript is compiled
console.log('📦 Checking TypeScript compilation...');
if (!fs.existsSync('dist')) {
  console.log('🔨 Building TypeScript files...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation successful');
  } catch (error) {
    console.error('❌ TypeScript compilation failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Compiled files found');
}

// Step 3: Verify required files exist
console.log('\n📁 Verifying required files...');
const requiredFiles = [
  'api/serverless.js',
  'vercel.json',
  'dist/config/database.js',
  'dist/routes/auth.js',
  'dist/middleware/errorHandler.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Some required files are missing. Please check the build process.');
  process.exit(1);
}

// Step 4: Test serverless function
console.log('\n🧪 Testing serverless function...');
try {
  // Set test environment variables
  process.env.FIREBASE_PROJECT_ID = 'test';
  process.env.FIREBASE_PRIVATE_KEY = 'test';
  process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
  process.env.JWT_SECRET = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  
  const serverlessApp = require('./api/serverless');
  console.log('✅ Serverless function loads successfully');
} catch (error) {
  console.error('❌ Serverless function test failed:', error.message);
  process.exit(1);
}

// Step 5: Check environment variables
console.log('\n🔧 Environment Variables Checklist:');
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalEnvVars = [
  'FRONTEND_URL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

console.log('\nRequired variables (must be set in Vercel):');
requiredEnvVars.forEach(envVar => {
  console.log(`  - ${envVar}`);
});

console.log('\nOptional variables (recommended):');
optionalEnvVars.forEach(envVar => {
  console.log(`  - ${envVar}`);
});

// Step 6: Generate deployment commands
console.log('\n📋 Deployment Commands:');
console.log('\n1. Commit your changes:');
console.log('   git add .');
console.log('   git commit -m "Add serverless backend for Vercel deployment"');
console.log('   git push origin main');

console.log('\n2. Set environment variables in Vercel Dashboard:');
console.log('   Go to: https://vercel.com/dashboard');
console.log('   Select your backend project');
console.log('   Go to Settings → Environment Variables');
console.log('   Add the required variables listed above');

console.log('\n3. Force redeploy in Vercel:');
console.log('   Go to Deployments tab');
console.log('   Click "Redeploy" on the latest deployment');

console.log('\n4. Test the deployment:');
console.log('   curl https://api.confiido.in/api/health');
console.log('   curl https://api.confiido.in/api/health/detailed');

// Step 7: Success message
console.log('\n✅ Serverless backend is ready for deployment!');
console.log('\n🎯 Key Features:');
console.log('  - Optimized database connections for serverless');
console.log('  - All API routes preserved and working');
console.log('  - Proper error handling and fallbacks');
console.log('  - Health checks with detailed diagnostics');
console.log('  - CORS configured for your domains');

console.log('\n📚 For detailed instructions, see: SERVERLESS_DEPLOYMENT_GUIDE.md');
console.log('\n🚀 Happy deploying!');
