// Firebase Test Script - Run this in browser console to test Firebase setup
// Copy and paste this in your browser's console on the login page

console.log('🔥 Firebase Authentication Test Script');
console.log('=====================================');

// Test 1: Check if Firebase is loaded
try {
  if (typeof firebase !== 'undefined' || typeof window.firebase !== 'undefined') {
    console.log('✅ Firebase SDK is loaded');
  } else {
    console.log('❌ Firebase SDK not found');
  }
} catch (error) {
  console.log('❌ Error checking Firebase:', error.message);
}

// Test 2: Check Firebase config
try {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  
  console.log('Firebase Config Check:');
  console.log('- API Key:', config.apiKey ? '✅ Set' : '❌ Missing');
  console.log('- Auth Domain:', config.authDomain ? '✅ Set' : '❌ Missing');
  console.log('- Project ID:', config.projectId ? '✅ Set' : '❌ Missing');
} catch (error) {
  console.log('❌ Error checking config:', error.message);
}

// Test 3: Check AuthContext
try {
  // This will only work if you're on a page with AuthContext
  console.log('AuthContext test - check for useAuth hook availability');
} catch (error) {
  console.log('❌ AuthContext error:', error.message);
}

// Test 4: Check Backend Connection
async function testBackendConnection() {
  try {
    const response = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'testpassword' })
    });
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Backend is running and responding');
    } else {
      console.log('⚠️ Backend response:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('Make sure backend server is running on port 5000');
  }
}

// Run backend test
testBackendConnection();

console.log('');
console.log('🧪 To test Google sign-in:');
console.log('1. Click the "Continue with Google" button');
console.log('2. Complete the Google OAuth flow');
console.log('3. Check if you are redirected to /dashboard');
console.log('4. Check browser network tab for API calls');

console.log('');
console.log('🐛 If issues occur:');
console.log('1. Check browser console for errors');
console.log('2. Verify environment variables are set');
console.log('3. Ensure Firebase project has Google auth enabled');
console.log('4. Check that your domain is authorized in Firebase console');
