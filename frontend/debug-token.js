// Debug script to check token in browser console
console.log('🔍 Debugging authentication token...');

// Check if token exists in localStorage
const token = localStorage.getItem('token');
console.log('Token from localStorage:', token);

if (token) {
  console.log('Token length:', token.length);
  console.log('Token type:', typeof token);
  console.log('Token starts with "Bearer":', token.startsWith('Bearer'));
  console.log('Token starts with "mock_token_":', token.startsWith('mock_token_'));
  console.log('Token starts with "token_":', token.startsWith('token_'));
  
  // Try to decode JWT token (basic check)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      console.log('Token appears to be JWT format');
      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT payload:', payload);
    } else {
      console.log('Token is not JWT format');
    }
  } catch (e) {
    console.log('Token is not a valid JWT:', e.message);
  }
} else {
  console.log('❌ No token found in localStorage');
  console.log('Available localStorage keys:', Object.keys(localStorage));
}

// Check if user is logged in
const user = localStorage.getItem('user');
console.log('User from localStorage:', user);

// Check auth context if available
if (window.authContext) {
  console.log('Auth context:', window.authContext);
}
