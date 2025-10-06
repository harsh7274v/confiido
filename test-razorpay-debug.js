// Debug script to test Razorpay endpoint
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5003';

async function testRazorpayDebug() {
  console.log('🧪 Testing Razorpay Debug...\n');

  try {
    // Test with different amount formats
    const testCases = [
      { amount: 100, description: 'Integer amount' },
      { amount: 100.50, description: 'Float amount' },
      { amount: '100', description: 'String amount' },
      { amount: 0.50, description: 'Small amount' }
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.description} (${testCase.amount})`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/payments/create-razorpay-order`, {
          amount: testCase.amount,
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-6)}`, // Short receipt ID
          notes: {
            test: true,
            description: testCase.description
          }
        }, {
          headers: {
            'Authorization': 'Bearer mock_token_test',
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Success:', response.data);
      } catch (error) {
        console.log('❌ Failed:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          errors: error.response?.data?.errors
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Make sure the backend server is running on port 5003');
  }
}

testRazorpayDebug();
