// Force rebuild TypeScript files
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Force rebuilding TypeScript files...');

try {
  // Remove dist folder to force clean rebuild
  if (fs.existsSync('dist')) {
    console.log('🗑️ Removing dist folder...');
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  // Rebuild TypeScript files
  console.log('🔨 Building TypeScript files...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful');
  
  // Check if the updated firebase.js was created
  if (fs.existsSync('dist/config/firebase.js')) {
    console.log('✅ dist/config/firebase.js created');
    
    // Check the content to see if it has our graceful handling
    const content = fs.readFileSync('dist/config/firebase.js', 'utf8');
    if (content.includes('isFirebaseConfigured')) {
      console.log('✅ Firebase config has graceful handling');
    } else if (content.includes('throw new Error')) {
      console.log('❌ Firebase config still has strict validation');
    }
  } else {
    console.log('❌ dist/config/firebase.js not found');
  }
  
  // Check middleware files
  const middlewareFiles = [
    'dist/middleware/auth.js',
    'dist/middleware/firebaseAuth.js'
  ];
  
  console.log('\n📁 Checking middleware files...');
  middlewareFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      
      // Check if it imports getAuth
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('getAuth')) {
        console.log(`  ✅ ${file} uses getAuth`);
      } else {
        console.log(`  ⚠️ ${file} might not use getAuth`);
      }
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
