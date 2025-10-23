// Deployment Diagnostic Script
const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Deployment Diagnostic\n');

let issues = [];
let warnings = [];

// Check 1: Required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'api/serverless-robust.js',
  'vercel.json',
  'package.json',
  'dist/config/firebase.js',
  'dist/config/database.js',
  'dist/middleware/auth.js',
  'dist/routes/auth.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    issues.push(`Missing file: ${file}`);
  }
});

// Check 2: Package.json
console.log('\n📦 Checking package.json...');
try {
  const packageJson = require('./package.json');
  
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ Build script exists');
  } else {
    console.log('❌ Build script missing');
    issues.push('Missing build script in package.json');
  }
  
  if (packageJson.scripts && packageJson.scripts['vercel-build']) {
    console.log('✅ Vercel-build script exists');
  } else {
    console.log('⚠️ Vercel-build script missing (optional)');
    warnings.push('Consider adding vercel-build script');
  }
  
} catch (error) {
  console.log('❌ Cannot read package.json');
  issues.push('Cannot read package.json');
}

// Check 3: Vercel configuration
console.log('\n⚙️ Checking vercel.json...');
try {
  const vercelConfig = require('./vercel.json');
  
  if (vercelConfig.builds && vercelConfig.builds[0]) {
    console.log('✅ Builds configuration exists');
    if (vercelConfig.builds[0].src === 'api/serverless-robust.js') {
      console.log('✅ Correct serverless file specified');
    } else {
      console.log('❌ Wrong serverless file specified');
      issues.push('Vercel config points to wrong file');
    }
  } else {
    console.log('❌ Builds configuration missing');
    issues.push('Missing builds configuration in vercel.json');
  }
  
  if (vercelConfig.routes && vercelConfig.routes[0]) {
    console.log('✅ Routes configuration exists');
  } else {
    console.log('❌ Routes configuration missing');
    issues.push('Missing routes configuration in vercel.json');
  }
  
} catch (error) {
  console.log('❌ Cannot read vercel.json');
  issues.push('Cannot read vercel.json');
}

// Check 4: TypeScript compilation
console.log('\n🔨 Checking TypeScript compilation...');
try {
  const distFiles = fs.readdirSync('dist');
  if (distFiles.length > 0) {
    console.log('✅ Dist folder has files');
  } else {
    console.log('❌ Dist folder is empty');
    issues.push('Dist folder is empty - run npm run build');
  }
} catch (error) {
  console.log('❌ Dist folder does not exist');
  issues.push('Dist folder does not exist - run npm run build');
}

// Check 5: Serverless function
console.log('\n🚀 Checking serverless function...');
try {
  const serverlessContent = fs.readFileSync('api/serverless-robust.js', 'utf8');
  
  if (serverlessContent.includes('module.exports')) {
    console.log('✅ Serverless function exports correctly');
  } else {
    console.log('❌ Serverless function missing module.exports');
    issues.push('Serverless function missing module.exports');
  }
  
  if (serverlessContent.includes('loadRoute')) {
    console.log('✅ Route loading function exists');
  } else {
    console.log('❌ Route loading function missing');
    issues.push('Route loading function missing');
  }
  
} catch (error) {
  console.log('❌ Cannot read serverless function');
  issues.push('Cannot read serverless function');
}

// Check 6: Environment variables (simulation)
console.log('\n🔧 Checking environment variables...');
const requiredEnvVars = ['NODE_ENV', 'MONGODB_URI', 'JWT_SECRET'];
const optionalEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];

console.log('Required environment variables for Vercel:');
requiredEnvVars.forEach(envVar => {
  console.log(`  - ${envVar}`);
});

console.log('Optional environment variables (if using Firebase):');
optionalEnvVars.forEach(envVar => {
  console.log(`  - ${envVar}`);
});

// Summary
console.log('\n📊 Diagnostic Summary:');
console.log(`❌ Issues found: ${issues.length}`);
console.log(`⚠️ Warnings: ${warnings.length}`);

if (issues.length > 0) {
  console.log('\n🔧 Issues to fix:');
  issues.forEach(issue => {
    console.log(`  - ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️ Warnings:');
  warnings.forEach(warning => {
    console.log(`  - ${warning}`);
  });
}

if (issues.length === 0) {
  console.log('\n🎉 No critical issues found!');
  console.log('\n📋 Next steps:');
  console.log('1. Set environment variables in Vercel Dashboard');
  console.log('2. Deploy to Vercel');
  console.log('3. Check deployment logs if it fails');
} else {
  console.log('\n❌ Fix the issues above before deploying');
  console.log('\n🔧 Common fixes:');
  console.log('1. Run: npm run build');
  console.log('2. Check vercel.json configuration');
  console.log('3. Ensure all required files exist');
  console.log('4. Set environment variables in Vercel');
}

console.log('\n💡 If deployment still fails, check Vercel logs for specific error messages!');

