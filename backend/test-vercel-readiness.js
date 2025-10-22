// Quick Vercel Readiness Test
console.log('🚀 Vercel Deployment Readiness Test\n');

// Set Vercel-like environment
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

let testsPassed = 0;
let testsFailed = 0;

const test = (name, fn) => {
  try {
    const result = fn();
    if (result === true) {
      console.log(`✅ ${name}`);
      testsPassed++;
    } else {
      console.log(`⚠️ ${name}: ${result}`);
      testsPassed++;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
};

// Test 1: Compiled files exist
test('Compiled files exist', () => {
  const fs = require('fs');
  const requiredFiles = [
    'dist/config/firebase.js',
    'dist/config/database.js',
    'dist/middleware/auth.js',
    'dist/routes/auth.js'
  ];
  
  const missing = requiredFiles.filter(f => !fs.existsSync(f));
  if (missing.length > 0) {
    throw new Error(`Missing: ${missing.join(', ')}`);
  }
  return true;
});

// Test 2: Firebase loads gracefully
test('Firebase loads gracefully', () => {
  const firebase = require('./dist/config/firebase');
  if (typeof firebase.getAuth === 'function') {
    return true;
  }
  throw new Error('getAuth function not found');
});

// Test 3: Serverless function loads
test('Serverless function loads', () => {
  const app = require('./api/serverless-robust');
  if (typeof app === 'function') {
    return true;
  }
  throw new Error('Serverless function not exported correctly');
});

// Test 4: Routes import successfully
test('Routes import successfully', () => {
  require('./dist/routes/auth');
  require('./dist/routes/users');
  require('./dist/routes/experts');
  return true;
});

// Test 5: Vercel config is correct
test('Vercel config is correct', () => {
  const config = require('./vercel.json');
  if (config.builds[0].src === 'api/serverless-robust.js') {
    return true;
  }
  throw new Error('Vercel config points to wrong file');
});

// Results
console.log(`\n📊 Results: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed === 0) {
  console.log('\n🎉 READY FOR VERCEL DEPLOYMENT!');
  console.log('\n📋 Next steps:');
  console.log('1. Set environment variables in Vercel Dashboard');
  console.log('2. git add . && git commit -m "Ready for deployment" && git push');
  console.log('3. Deploy to Vercel');
  console.log('4. Test: curl https://api.confiido.in/api/health');
} else {
  console.log('\n❌ NOT READY - Fix failed tests first');
}
