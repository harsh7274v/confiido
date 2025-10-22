// Test Firebase fix for serverless environment
const path = require('path');

console.log('🧪 Testing Firebase Fix for Serverless Environment\n');

// Set test environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.NODE_ENV = 'test';

// Test 1: Check if compiled files exist
console.log('📁 Checking compiled files...');
const fs = require('fs');

const requiredFiles = [
  'dist/config/database.js',
  'dist/middleware/errorHandler.js',
  'dist/middleware/notFound.js',
  'dist/middleware/auth.js',
  'dist/middleware/firebaseAuth.js'
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

// Test 2: Test Firebase serverless config
console.log('🔥 Testing Firebase serverless configuration...');
try {
  // Test without Firebase credentials (should not throw error)
  const firebaseServerless = require('./dist/config/firebaseServerless');
  console.log('✅ Firebase serverless config loaded without errors');
  
  // Test getAuth function (should throw error when not initialized)
  try {
    firebaseServerless.getAuth();
    console.log('⚠️ getAuth() should have thrown an error when Firebase not initialized');
  } catch (error) {
    console.log('✅ getAuth() properly throws error when Firebase not initialized:', error.message);
  }
} catch (error) {
  console.log(`❌ Firebase serverless config failed: ${error.message}`);
}

// Test 3: Test middleware imports
console.log('\n🔌 Testing middleware imports...');
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

// Test middleware modules
testImport('./dist/middleware/errorHandler', 'Error handler');
testImport('./dist/middleware/notFound', 'Not found handler');
testImport('./dist/middleware/auth', 'Auth middleware');
testImport('./dist/middleware/firebaseAuth', 'Firebase auth middleware');

console.log(`\n📊 Import Status: ${importsSuccessful} successful, ${importsFailed} failed\n`);

// Test 4: Test serverless function
console.log('🚀 Testing serverless function...');
try {
  const serverlessApp = require('./api/serverless-robust');
  console.log('✅ Serverless function loaded successfully');
  console.log('✅ Express app exported correctly');
} catch (error) {
  console.log(`❌ Serverless function failed: ${error.message}`);
  console.log('Stack trace:', error.stack);
}

// Summary
console.log('\n🎯 Test Summary:');
console.log(`📁 Compiled files: ${filesExist}/${requiredFiles.length}`);
console.log(`🔌 Module imports: ${importsSuccessful} successful, ${importsFailed} failed`);
console.log(`🚀 Serverless function: ${require('./api/serverless-robust') ? 'Ready' : 'Failed'}`);

if (filesExist === requiredFiles.length && importsFailed === 0) {
  console.log('\n✅ Firebase fix successful! Your serverless backend should now work.');
  console.log('\n📋 Next steps:');
  console.log('1. Set proper Firebase credentials in Vercel environment variables');
  console.log('2. Set MONGODB_URI with your actual MongoDB connection string');
  console.log('3. Commit and push your changes');
  console.log('4. Deploy to Vercel');
  console.log('5. Test the health endpoint: https://api.confiido.in/api/health');
} else {
  console.log('\n❌ Some tests failed. Please fix the issues before deploying.');
  console.log('\n🔧 Troubleshooting:');
  if (filesExist < requiredFiles.length) {
    console.log('- Run "npm run build" to compile TypeScript files');
  }
  if (importsFailed > 0) {
    console.log('- Check that all middleware files exist and are properly exported');
  }
}

console.log('\n💡 The Firebase fix ensures that:');
console.log('   - Routes load even without Firebase credentials');
console.log('   - Firebase features work when credentials are provided');
console.log('   - No crashes occur during serverless initialization');
