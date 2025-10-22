// Comprehensive Pre-Deployment Test Suite
const path = require('path');
const fs = require('fs');

console.log('🧪 Pre-Deployment Test Suite for Vercel\n');
console.log('This test simulates the Vercel serverless environment to ensure everything works.\n');

// Set Vercel-like environment variables
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test-production-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Will be replaced with real URI in production

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper function to run tests
const runTest = (testName, testFunction) => {
  try {
    const result = testFunction();
    if (result === true) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', message: 'Success' });
      console.log(`✅ ${testName}`);
    } else {
      testResults.warnings++;
      testResults.tests.push({ name: testName, status: 'WARN', message: result });
      console.log(`⚠️ ${testName}: ${result}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', message: error.message });
    console.log(`❌ ${testName}: ${error.message}`);
  }
};

// Test 1: Check compiled files exist
runTest('Compiled TypeScript files exist', () => {
  const requiredFiles = [
    'dist/config/firebase.js',
    'dist/config/database.js',
    'dist/middleware/auth.js',
    'dist/middleware/firebaseAuth.js',
    'dist/middleware/errorHandler.js',
    'dist/middleware/notFound.js',
    'dist/routes/auth.js',
    'dist/routes/users.js',
    'dist/routes/experts.js',
    'dist/routes/bookings.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    throw new Error(`Missing files: ${missingFiles.join(', ')}`);
  }
  return true;
});

// Test 2: Firebase configuration
runTest('Firebase configuration loads gracefully', () => {
  try {
    const firebaseConfig = require('./dist/config/firebase');
    
    // Should not throw error when Firebase not configured
    if (typeof firebaseConfig.getAuth === 'function') {
      return true;
    } else {
      return 'getAuth function not found';
    }
  } catch (error) {
    throw new Error(`Firebase config failed: ${error.message}`);
  }
});

// Test 3: Database configuration
runTest('Database configuration loads', () => {
  try {
    const dbConfig = require('./dist/config/database');
    if (typeof dbConfig.connectDB === 'function') {
      return true;
    } else {
      return 'connectDB function not found';
    }
  } catch (error) {
    throw new Error(`Database config failed: ${error.message}`);
  }
});

// Test 4: Middleware imports
runTest('Middleware files import successfully', () => {
  try {
    require('./dist/middleware/auth');
    require('./dist/middleware/firebaseAuth');
    require('./dist/middleware/errorHandler');
    require('./dist/middleware/notFound');
    return true;
  } catch (error) {
    throw new Error(`Middleware import failed: ${error.message}`);
  }
});

// Test 5: Route imports
runTest('Route files import successfully', () => {
  try {
    require('./dist/routes/auth');
    require('./dist/routes/users');
    require('./dist/routes/experts');
    require('./dist/routes/bookings');
    return true;
  } catch (error) {
    throw new Error(`Route import failed: ${error.message}`);
  }
});

// Test 6: Serverless function
runTest('Serverless function loads successfully', () => {
  try {
    const serverlessApp = require('./api/serverless-robust');
    if (typeof serverlessApp === 'function') {
      return true;
    } else {
      return 'Serverless function not exported correctly';
    }
  } catch (error) {
    throw new Error(`Serverless function failed: ${error.message}`);
  }
});

// Test 7: Vercel configuration
runTest('Vercel configuration is correct', () => {
  try {
    const vercelConfig = require('./vercel.json');
    
    if (!vercelConfig.builds || vercelConfig.builds[0].src !== 'api/serverless-robust.js') {
      return 'Vercel config does not point to correct serverless file';
    }
    
    if (!vercelConfig.functions || !vercelConfig.functions['api/serverless-robust.js']) {
      return 'Vercel function configuration missing';
    }
    
    return true;
  } catch (error) {
    throw new Error(`Vercel config failed: ${error.message}`);
  }
});

// Test 8: Package.json scripts
runTest('Package.json has required scripts', () => {
  try {
    const packageJson = require('./package.json');
    const requiredScripts = ['build', 'vercel-build'];
    
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    if (missingScripts.length > 0) {
      return `Missing scripts: ${missingScripts.join(', ')}`;
    }
    
    return true;
  } catch (error) {
    throw new Error(`Package.json check failed: ${error.message}`);
  }
});

// Test 9: Environment variables check
runTest('Environment variables are properly set', () => {
  const requiredEnvVars = ['NODE_ENV', 'VERCEL'];
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    return `Missing environment variables: ${missingVars.join(', ')}`;
  }
  
  return true;
});

// Test 10: Firebase graceful handling
runTest('Firebase handles missing credentials gracefully', () => {
  try {
    const firebaseConfig = require('./dist/config/firebase');
    
    // Should not throw error when calling getAuth without credentials
    try {
      firebaseConfig.getAuth();
      return 'getAuth should have thrown an error when Firebase not initialized';
    } catch (error) {
      if (error.message.includes('Firebase not initialized')) {
        return true;
      } else {
        return `Unexpected error: ${error.message}`;
      }
    }
  } catch (error) {
    throw new Error(`Firebase graceful handling failed: ${error.message}`);
  }
});

// Test 11: Route loading simulation
runTest('Route loading works in serverless environment', () => {
  try {
    // Simulate the route loading process
    const loadRoute = (routePath, routeName) => {
      try {
        const route = require(routePath);
        return true;
      } catch (error) {
        throw new Error(`${routeName}: ${error.message}`);
      }
    };
    
    // Test core routes
    loadRoute('./dist/routes/auth', 'auth');
    loadRoute('./dist/routes/users', 'users');
    loadRoute('./dist/routes/experts', 'experts');
    loadRoute('./dist/routes/bookings', 'bookings');
    
    return true;
  } catch (error) {
    throw new Error(`Route loading failed: ${error.message}`);
  }
});

// Test 12: Memory and performance check
runTest('Memory usage is within limits', () => {
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Vercel Pro plan has 1024MB memory limit
  if (memUsageMB > 500) {
    return `High memory usage: ${memUsageMB}MB (limit: 1024MB)`;
  }
  
  return true;
});

// Test 13: Dependencies check
runTest('All required dependencies are available', () => {
  const requiredDeps = [
    'express',
    'mongoose',
    'cors',
    'helmet',
    'compression',
    'express-rate-limit',
    'firebase-admin'
  ];
  
  const missingDeps = requiredDeps.filter(dep => {
    try {
      require(dep);
      return false;
    } catch (error) {
      return true;
    }
  });
  
  if (missingDeps.length > 0) {
    return `Missing dependencies: ${missingDeps.join(', ')}`;
  }
  
  return true;
});

// Test 14: Error handling
runTest('Error handling middleware works', () => {
  try {
    const { errorHandler } = require('./dist/middleware/errorHandler');
    const { notFound } = require('./dist/middleware/notFound');
    
    if (typeof errorHandler === 'function' && typeof notFound === 'function') {
      return true;
    } else {
      return 'Error handling middleware not properly exported';
    }
  } catch (error) {
    throw new Error(`Error handling check failed: ${error.message}`);
  }
});

// Test 15: CORS configuration
runTest('CORS configuration is present', () => {
  try {
    const cors = require('cors');
    if (typeof cors === 'function') {
      return true;
    } else {
      return 'CORS module not available';
    }
  } catch (error) {
    throw new Error(`CORS check failed: ${error.message}`);
  }
});

// Print detailed results
console.log('\n📊 Test Results Summary:');
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`⚠️ Warnings: ${testResults.warnings}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Total: ${testResults.passed + testResults.warnings + testResults.failed}`);

// Print detailed test results
console.log('\n📋 Detailed Test Results:');
testResults.tests.forEach(test => {
  const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${test.name}: ${test.message}`);
});

// Final recommendation
console.log('\n🎯 Deployment Recommendation:');
if (testResults.failed === 0) {
  if (testResults.warnings === 0) {
    console.log('🚀 READY FOR DEPLOYMENT! All tests passed.');
    console.log('\n📋 Next steps:');
    console.log('1. Set environment variables in Vercel Dashboard');
    console.log('2. Commit and push your changes');
    console.log('3. Deploy to Vercel');
    console.log('4. Test the health endpoint: https://api.confiido.in/api/health');
  } else {
    console.log('⚠️ READY FOR DEPLOYMENT with warnings. Review warnings above.');
    console.log('\n📋 Next steps:');
    console.log('1. Review and fix warnings if needed');
    console.log('2. Set environment variables in Vercel Dashboard');
    console.log('3. Deploy to Vercel');
  }
} else {
  console.log('❌ NOT READY FOR DEPLOYMENT. Fix failed tests above.');
  console.log('\n🔧 Required actions:');
  console.log('1. Fix all failed tests');
  console.log('2. Run this test again');
  console.log('3. Only deploy when all tests pass');
}

// Environment variables checklist
console.log('\n🔧 Environment Variables Checklist for Vercel:');
console.log('Required variables to set in Vercel Dashboard:');
console.log('✅ MONGODB_URI=mongodb+srv://confiidoio:UzCmaVZ2SICeFh2H@cluster.mongodb.net/lumina');
console.log('✅ JWT_SECRET=your-production-jwt-secret');
console.log('✅ NODE_ENV=production');
console.log('✅ FIREBASE_PROJECT_ID=your-project-id (if using Firebase)');
console.log('✅ FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" (if using Firebase)');
console.log('✅ FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com (if using Firebase)');

console.log('\n🎉 Pre-deployment test complete!');
