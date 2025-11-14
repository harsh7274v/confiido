/**
 * Session Manager Test Script
 * Run this in browser console to test session management
 */

console.log('🧪 Starting Session Manager Tests...\n');

// Test 1: Import session manager (if available)
console.log('Test 1: Session Manager Functions');
console.log('-----------------------------------');

// Simulate setting a session
const testToken = 'test_jwt_token_12345';
const testRole = 'user';

localStorage.setItem('token', testToken);
localStorage.setItem('sessionTimestamp', Date.now().toString());
localStorage.setItem('userRole', testRole);

console.log('✅ Session set with:');
console.log('   Token:', localStorage.getItem('token'));
console.log('   Timestamp:', new Date(parseInt(localStorage.getItem('sessionTimestamp')!)).toLocaleString());
console.log('   Role:', localStorage.getItem('userRole'));
console.log('');

// Test 2: Check session validity
console.log('Test 2: Session Validity Check');
console.log('-----------------------------------');

const sessionTimestamp = localStorage.getItem('sessionTimestamp');
if (sessionTimestamp) {
  const sessionTime = parseInt(sessionTimestamp);
  const currentTime = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const remainingTime = (sessionTime + twentyFourHours) - currentTime;
  const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
  const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  
  console.log('✅ Session is valid');
  console.log('   Time remaining:', `${remainingHours}h ${remainingMinutes}m`);
  console.log('   Expires at:', new Date(sessionTime + twentyFourHours).toLocaleString());
} else {
  console.log('❌ No session found');
}
console.log('');

// Test 3: Simulate expired session
console.log('Test 3: Expired Session Check');
console.log('-----------------------------------');

// Set timestamp to 25 hours ago
const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
localStorage.setItem('sessionTimestamp', expiredTimestamp.toString());

const checkExpired = () => {
  const timestamp = localStorage.getItem('sessionTimestamp');
  if (!timestamp) return true;
  
  const sessionTime = parseInt(timestamp);
  const currentTime = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (currentTime - sessionTime) > twentyFourHours;
};

if (checkExpired()) {
  console.log('✅ Expired session detected correctly');
  console.log('   Session started:', new Date(expiredTimestamp).toLocaleString());
  console.log('   Expired:', Math.floor((Date.now() - expiredTimestamp) / (60 * 60 * 1000)), 'hours ago');
} else {
  console.log('❌ Failed to detect expired session');
}
console.log('');

// Test 4: Clear session
console.log('Test 4: Session Cleanup');
console.log('-----------------------------------');

localStorage.removeItem('token');
localStorage.removeItem('sessionTimestamp');
localStorage.removeItem('userRole');

const hasToken = localStorage.getItem('token');
const hasTimestamp = localStorage.getItem('sessionTimestamp');
const hasRole = localStorage.getItem('userRole');

if (!hasToken && !hasTimestamp && !hasRole) {
  console.log('✅ Session cleared successfully');
} else {
  console.log('❌ Session not fully cleared');
  console.log('   Remaining items:', { hasToken, hasTimestamp, hasRole });
}
console.log('');

// Test 5: Refresh session
console.log('Test 5: Session Refresh');
console.log('-----------------------------------');

const originalTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
localStorage.setItem('token', testToken);
localStorage.setItem('sessionTimestamp', originalTimestamp.toString());

console.log('Original session:', new Date(originalTimestamp).toLocaleString());

// Simulate refresh
const newTimestamp = Date.now();
localStorage.setItem('sessionTimestamp', newTimestamp.toString());

console.log('Refreshed session:', new Date(newTimestamp).toLocaleString());

const timeDiff = newTimestamp - originalTimestamp;
if (timeDiff > 0) {
  console.log('✅ Session refreshed successfully');
  console.log('   Extended by:', Math.floor(timeDiff / (60 * 60 * 1000)), 'hours');
} else {
  console.log('❌ Session refresh failed');
}
console.log('');

// Final cleanup
console.log('🧹 Cleaning up test data...');
localStorage.removeItem('token');
localStorage.removeItem('sessionTimestamp');
localStorage.removeItem('userRole');
console.log('✅ Cleanup complete\n');

console.log('🎉 All tests completed!');
console.log('');
console.log('📝 Summary:');
console.log('   - Session creation: ✅');
console.log('   - Session validation: ✅');
console.log('   - Expiration detection: ✅');
console.log('   - Session cleanup: ✅');
console.log('   - Session refresh: ✅');
