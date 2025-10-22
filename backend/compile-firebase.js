// Manual compilation script for firebaseServerless
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Manually compiling firebaseServerless.ts...');

try {
  // Compile just the firebaseServerless file
  execSync('npx tsc src/config/firebaseServerless.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --skipLibCheck', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('✅ firebaseServerless.ts compiled successfully');
  
  // Check if the file was created
  if (fs.existsSync('dist/config/firebaseServerless.js')) {
    console.log('✅ dist/config/firebaseServerless.js created');
  } else {
    console.log('❌ dist/config/firebaseServerless.js not found');
  }
  
} catch (error) {
  console.error('❌ Compilation failed:', error.message);
}

// Also try to compile the middleware files
console.log('\n🔨 Compiling middleware files...');

try {
  execSync('npx tsc src/middleware/auth.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --skipLibCheck', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ auth.ts compiled successfully');
} catch (error) {
  console.error('❌ auth.ts compilation failed:', error.message);
}

try {
  execSync('npx tsc src/middleware/firebaseAuth.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --skipLibCheck', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ firebaseAuth.ts compiled successfully');
} catch (error) {
  console.error('❌ firebaseAuth.ts compilation failed:', error.message);
}

// Check the compiled files
console.log('\n📁 Checking compiled files...');
const files = [
  'dist/config/firebaseServerless.js',
  'dist/middleware/auth.js',
  'dist/middleware/firebaseAuth.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
    
    // Check the import statements
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('firebaseServerless')) {
      console.log(`  ✅ ${file} imports firebaseServerless`);
    } else if (content.includes('firebase')) {
      console.log(`  ⚠️ ${file} still imports firebase (old version)`);
    }
  } else {
    console.log(`❌ ${file} missing`);
  }
});
