// Test script for serverless backend
const path = require('path');

// Set minimal env vars to prevent Firebase errors during testing
// Use proper format for Firebase private key to avoid parsing errors
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nwIu4Aq8bF1d2fXg2+8eZ7d8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9\n-----END PRIVATE KEY-----';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

console.log('🧪 Testing Serverless Backend Configuration...\n');

// Test 1: Check if dist folder exists and has compiled files
console.log('📁 Checking compiled files...');
const fs = require('fs');

const requiredFiles = [
  'dist/config/database.js',
  'dist/routes/auth.js',
  'dist/routes/users.js',
  'dist/middleware/errorHandler.js',
  'dist/middleware/notFound.js'
];

let filesExist = 0;
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}`);
    filesExist++;
  } else {
    console.log(`❌ ${file} - Missing!`);
  }
});

console.log(`\n📊 Files Status: ${filesExist}/${requiredFiles.length} files found\n`);

// Test 2: Test module imports
console.log('🔌 Testing module imports...');
let importsSuccessful = 0;
let importsFailed = 0;

const testImport = (modulePath, moduleName) => {
  try {
    require(modulePath);
    console.log(`✅ ${moduleName} imported successfully`);
    importsSuccessful++;
    return true;
  } catch (error) {
    console.log(`❌ ${moduleName} import failed: ${error.message}`);
    importsFailed++;
    return false;
  }
};

// Test core modules
testImport('./dist/config/database', 'Database config');
testImport('./dist/routes/auth', 'Auth routes');
testImport('./dist/routes/users', 'User routes');
testImport('./dist/routes/experts', 'Expert routes');
testImport('./dist/routes/bookings', 'Booking routes');
testImport('./dist/middleware/errorHandler', 'Error handler');
testImport('./dist/middleware/notFound', 'Not found handler');

console.log(`\n📊 Import Status: ${importsSuccessful} successful, ${importsFailed} failed\n`);

// Test 3: Test serverless function
console.log('🚀 Testing serverless function...');
try {
  const serverlessApp = require('./api/serverless');
  console.log('✅ Serverless function loaded successfully');
  console.log('✅ Express app exported correctly');
} catch (error) {
  console.log(`❌ Serverless function failed: ${error.message}`);
  console.log('Stack trace:', error.stack);
}

// Test 4: Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
  const packageJson = require('./package.json');
  const requiredScripts = ['build', 'vercel-build'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ ${script} script found`);
    } else {
      console.log(`❌ ${script} script missing`);
    }
  });
} catch (error) {
  console.log(`❌ Could not read package.json: ${error.message}`);
}

// Test 5: Check vercel.json configuration
console.log('\n⚙️ Checking Vercel configuration...');
try {
  const vercelConfig = require('./vercel.json');
  
  if (vercelConfig.builds && vercelConfig.builds[0].src === 'api/serverless.js') {
    console.log('✅ Vercel config points to correct serverless file');
  } else {
    console.log('❌ Vercel config does not point to serverless file');
  }
  
  if (vercelConfig.functions && vercelConfig.functions['api/serverless.js']) {
    console.log('✅ Vercel function configuration found');
  } else {
    console.log('❌ Vercel function configuration missing');
  }
} catch (error) {
  console.log(`❌ Could not read vercel.json: ${error.message}`);
}

// Summary
console.log('\n🎯 Test Summary:');
console.log(`📁 Compiled files: ${filesExist}/${requiredFiles.length}`);
console.log(`🔌 Module imports: ${importsSuccessful} successful, ${importsFailed} failed`);
console.log(`🚀 Serverless function: ${require('./api/serverless') ? 'Ready' : 'Failed'}`);

if (filesExist === requiredFiles.length && importsFailed === 0) {
  console.log('\n✅ All tests passed! Your serverless backend is ready for deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Set environment variables in Vercel dashboard');
  console.log('2. Commit and push your changes');
  console.log('3. Deploy to Vercel');
  console.log('4. Test the health endpoint: https://api.confiido.in/api/health');
} else {
  console.log('\n❌ Some tests failed. Please fix the issues before deploying.');
  console.log('\n🔧 Troubleshooting:');
  if (filesExist < requiredFiles.length) {
    console.log('- Run "npm run build" to compile TypeScript files');
  }
  if (importsFailed > 0) {
    console.log('- Check that all route files exist and are properly exported');
  }
}
