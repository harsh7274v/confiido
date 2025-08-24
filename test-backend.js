const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5003/api/health');
    console.log('Health check response:', healthResponse.data);
    
    // Test users test endpoint
    const testResponse = await axios.get('http://localhost:5003/api/users/test');
    console.log('Users test response:', testResponse.data);
    
    console.log('✅ Backend is running and responding!');
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running. Please start it with: cd backend && npm run dev');
    }
  }
}

testBackend();



