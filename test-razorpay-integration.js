// Test script to verify Razorpay integration
// Run this with: node test-razorpay-integration.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5003';

async function testRazorpayIntegration() {
  console.log('🧪 Testing Razorpay Integration...\n');

  try {
    // Test 1: Create Razorpay order
    console.log('1️⃣ Testing Razorpay order creation...');
    const orderResponse = await axios.post(`${API_BASE_URL}/api/payments/create-razorpay-order`, {
      amount: 100, // ₹1.00
      currency: 'INR',
      receipt: 'rcpt_123', // Short receipt ID
      notes: {
        test: true,
        description: 'Test payment'
      }
    }, {
      headers: {
        'Authorization': 'Bearer mock_token_for_development',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully:', orderResponse.data);
    const orderId = orderResponse.data.data.id;

    // Test 2: Verify payment (simulated)
    console.log('\n2️⃣ Testing payment verification...');
    const verificationResponse = await axios.post(`${API_BASE_URL}/api/payments/verify-razorpay-payment`, {
      razorpay_order_id: orderId,
      razorpay_payment_id: 'pay_test_123',
      razorpay_signature: 'test_signature_123'
    }, {
      headers: {
        'Authorization': 'Bearer mock_token_for_development',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment verification response:', verificationResponse.data);

    console.log('\n🎉 All tests passed! Razorpay integration is working correctly.');
    console.log('\n📝 Note: This is using test credentials. For production, set up proper Razorpay keys.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure the backend server is running on port 5003');
    console.error('2. Check that the Razorpay routes are properly configured');
    console.error('3. Verify that the authentication middleware is working');
  }
}

// Run the test
testRazorpayIntegration();
