/**
 * Test script to verify the payment completion flow
 * This script tests the complete payment flow from frontend to backend
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5003';

// Mock authentication token (replace with actual token for testing)
const AUTH_TOKEN = 'your-auth-token-here';

async function testPaymentCompletion() {
  console.log('🧪 Testing payment completion flow...\n');

  try {
    // Step 1: Create a test booking
    console.log('1️⃣ Creating test booking...');
    
    const bookingData = {
      expertId: '68b0daa5349f0802590e2755', // Replace with actual expert ID
      sessionType: 'chat',
      duration: 30,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      startTime: '10:00',
      notes: 'Test booking for payment completion'
    };

    const createResponse = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.data.success) {
      const booking = createResponse.data.data.booking;
      const session = createResponse.data.data.session;
      
      console.log('✅ Booking created successfully');
      console.log(`   Booking ID: ${booking._id}`);
      console.log(`   Session ID: ${session.sessionId}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Payment Status: ${session.paymentStatus}`);
      console.log(`   Price: ₹${session.price}\n`);

      // Step 2: Simulate successful payment completion
      console.log('2️⃣ Simulating successful payment completion...');
      
      const paymentData = {
        sessionId: session.sessionId,
        paymentMethod: 'stripe',
        loyaltyPointsUsed: 5 // Simulate using 5 loyalty points
      };
      
      const paymentResponse = await axios.put(
        `${API_BASE_URL}/api/bookings/${booking._id}/complete-payment`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (paymentResponse.data.success) {
        console.log('✅ Payment completed successfully');
        const updatedSession = paymentResponse.data.data.session;
        console.log(`   Status: ${updatedSession.status}`);
        console.log(`   Payment Status: ${updatedSession.paymentStatus}`);
        console.log(`   Payment Method: ${updatedSession.paymentMethod}`);
        console.log(`   Final Amount: ₹${updatedSession.finalAmount}`);
        console.log(`   Loyalty Points Used: ${updatedSession.loyaltyPointsUsed}`);
        console.log(`   Payment Completed At: ${updatedSession.paymentCompletedAt}\n`);
      } else {
        console.log('❌ Payment completion failed');
        console.log(`   Error: ${paymentResponse.data.error}\n`);
      }

      // Step 3: Verify the booking status was updated
      console.log('3️⃣ Verifying updated booking status...');
      
      const getResponse = await axios.get(`${API_BASE_URL}/api/bookings/${booking._id}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });

      if (getResponse.data.success) {
        const updatedBooking = getResponse.data.data.booking;
        const updatedSession = updatedBooking.sessions.find(s => s.sessionId.toString() === session.sessionId);
        
        console.log('✅ Booking status verified');
        console.log(`   Final Status: ${updatedSession.status}`);
        console.log(`   Final Payment Status: ${updatedSession.paymentStatus}`);
        console.log(`   Timeout Status: ${updatedSession.timeoutStatus}`);
        console.log(`   Payment Method: ${updatedSession.paymentMethod}`);
        console.log(`   Final Amount: ₹${updatedSession.finalAmount}`);
        console.log(`   Loyalty Points Used: ${updatedSession.loyaltyPointsUsed}`);
        console.log(`   Payment Completed At: ${updatedSession.paymentCompletedAt}\n`);
        
        // Step 4: Test that the session shows as completed in payments list
        console.log('4️⃣ Testing payments list view...');
        
        const paymentsResponse = await axios.get(`${API_BASE_URL}/api/bookings/user`, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
          }
        });

        if (paymentsResponse.data.success) {
          const bookings = paymentsResponse.data.data.bookings;
          const testBooking = bookings.find(b => b._id === booking._id);
          
          if (testBooking) {
            const testSession = testBooking.sessions.find(s => s.sessionId.toString() === session.sessionId);
            
            console.log('✅ Payments list view verified');
            console.log(`   Status in payments: ${testSession.status}`);
            console.log(`   Payment Status in payments: ${testSession.paymentStatus}`);
            
            if (testSession.status === 'completed' && testSession.paymentStatus === 'paid') {
              console.log('✅ SUCCESS: Payment properly completed and reflected in all views\n');
            } else {
              console.log('❌ FAILURE: Payment status not properly updated in payments view\n');
            }
          } else {
            console.log('❌ Test booking not found in payments response\n');
          }
        } else {
          console.log('❌ Failed to fetch payments after completion\n');
        }
      }

    } else {
      console.log('❌ Failed to create booking');
      console.log(`   Error: ${createResponse.data.error}\n`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

// Test error scenarios
async function testPaymentErrorScenarios() {
  console.log('🧪 Testing payment error scenarios...\n');

  try {
    // Test 1: Try to complete payment for non-existent session
    console.log('1️⃣ Testing payment completion for non-existent session...');
    
    const fakeBookingId = '507f1f77bcf86cd799439011';
    const fakeSessionId = '507f1f77bcf86cd799439012';
    
    try {
      await axios.put(
        `${API_BASE_URL}/api/bookings/${fakeBookingId}/complete-payment`,
        { sessionId: fakeSessionId },
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent booking');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 2: Try to complete payment without session ID
    console.log('\n2️⃣ Testing payment completion without session ID...');
    
    try {
      await axios.put(
        `${API_BASE_URL}/api/bookings/${fakeBookingId}/complete-payment`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly returned 400 for missing session ID');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error scenario test failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllPaymentTests() {
  console.log('🚀 Running comprehensive payment completion tests...\n');
  
  await testPaymentCompletion();
  console.log('\n' + '='.repeat(50) + '\n');
  await testPaymentErrorScenarios();
  
  console.log('\n🏁 All payment tests completed');
}

// Run the tests
if (require.main === module) {
  runAllPaymentTests()
    .then(() => {
      console.log('✅ Payment test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Payment test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentCompletion, testPaymentErrorScenarios, runAllPaymentTests };
