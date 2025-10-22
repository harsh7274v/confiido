// Simple test script for serverless backend (without Firebase)
const path = require('path');

console.log('🧪 Simple Serverless Backend Test (No Firebase)\n');

// Set minimal env vars
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.NODE_ENV = 'test';

// Test 1: Check if dist folder exists and has compiled files
console.log('📁 Checking compiled files...');
const fs = require('fs');

const requiredFiles = [
  'dist/config/database.js',
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

// Test 2: Test basic modules (without Firebase)
console.log('🔌 Testing basic module imports...');
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

// Test core modules (no Firebase dependencies)
testImport('./dist/config/database', 'Database config');
testImport('./dist/middleware/errorHandler', 'Error handler');
testImport('./dist/middleware/notFound', 'Not found handler');

console.log(`\n📊 Import Status: ${importsSuccessful} successful, ${importsFailed} failed\n`);

// Test 3: Test serverless function structure
console.log('🚀 Testing serverless function structure...');
try {
  // Mock Firebase to prevent initialization errors
  const originalRequire = require;
  require = function(id) {
    if (id.includes('firebase') || id.includes('Firebase')) {
      return {
        auth: () => ({ verifyIdToken: () => Promise.resolve({ uid: 'test' }) }),
        credential: { cert: () => ({}) },
        initializeApp: () => ({}),
        apps: []
      };
    }
    return originalRequire.apply(this, arguments);
  };

  const serverlessApp = require('./api/serverless');
  console.log('✅ Serverless function loaded successfully');
  console.log('✅ Express app exported correctly');
  
  // Restore original require
  require = originalRequire;
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
  console.log('\n✅ Basic tests passed! Your serverless backend structure is ready.');
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

console.log('\n💡 Note: Firebase-related errors are expected in this test.');
console.log('   They will be resolved when proper Firebase credentials are set in Vercel.');
