// Build and test script
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔨 Building TypeScript files...');

try {
  // Build TypeScript files
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful');
  
  // Check if key files were compiled
  const keyFiles = [
    'dist/config/firebase.js',
    'dist/middleware/auth.js',
    'dist/middleware/firebaseAuth.js'
  ];
  
  console.log('\n📁 Checking compiled files...');
  keyFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
  
  // Run the test
  console.log('\n🧪 Running Firebase test...');
  execSync('node test-firebase-final.js', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Build or test failed:', error.message);
}
