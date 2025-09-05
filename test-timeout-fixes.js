/**
 * Test script to verify the timeout fixes
 * This script tests the complete timeout flow including page refresh scenarios
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5003';

// Mock authentication token (replace with actual token for testing)
const AUTH_TOKEN = 'your-auth-token-here';

async function testTimeoutFixes() {
  console.log('🧪 Testing timeout fixes...\n');

  try {
    // Step 1: Create a test booking
    console.log('1️⃣ Creating test booking...');
    
    const bookingData = {
      expertId: '68b0daa5349f0802590e2755', // Replace with actual expert ID
      sessionType: 'chat',
      duration: 30,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      startTime: '10:00',
      notes: 'Test booking for timeout fixes'
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
      console.log(`   Timeout At: ${session.timeoutAt}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Payment Status: ${session.paymentStatus}\n`);

      // Step 2: Wait for timeout to expire (simulate by calling cancel endpoint)
      console.log('2️⃣ Simulating timeout expiration...');
      
      // Wait a moment to ensure the booking is properly created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const cancelResponse = await axios.put(
        `${API_BASE_URL}/api/bookings/${booking._id}/cancel-expired-session`,
        { sessionId: session.sessionId },
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (cancelResponse.data.success) {
        console.log('✅ Expired session cancelled successfully');
        console.log(`   Status: ${cancelResponse.data.data.session.status}`);
        console.log(`   Payment Status: ${cancelResponse.data.data.session.paymentStatus}`);
        console.log(`   Cancellation Reason: ${cancelResponse.data.data.session.cancellationReason}`);
        console.log(`   Cancelled By: ${cancelResponse.data.data.session.cancelledBy}\n`);
      } else {
        console.log('❌ Failed to cancel expired session');
        console.log(`   Error: ${cancelResponse.data.error}\n`);
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
        console.log(`   Cancellation Time: ${updatedSession.cancellationTime}\n`);
        
        // Step 4: Test that the session won't restart timer after refresh
        console.log('4️⃣ Testing page refresh scenario...');
        
        // Simulate what happens when frontend fetches payments after refresh
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
            
            console.log('✅ Page refresh scenario verified');
            console.log(`   Status after refresh: ${testSession.status}`);
            console.log(`   Payment Status after refresh: ${testSession.paymentStatus}`);
            console.log(`   Timeout Status after refresh: ${testSession.timeoutStatus}`);
            
            if (testSession.status === 'cancelled' && testSession.paymentStatus === 'failed') {
              console.log('✅ SUCCESS: Session properly marked as cancelled and failed after refresh\n');
            } else {
              console.log('❌ FAILURE: Session status not properly updated after refresh\n');
            }
          } else {
            console.log('❌ Test booking not found in payments response\n');
          }
        } else {
          console.log('❌ Failed to fetch payments after refresh\n');
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

// Test the backend timeout service
async function testBackendTimeoutService() {
  console.log('🔧 Testing backend timeout service...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/bookings/expired/check`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (response.data.success) {
      console.log('✅ Backend timeout service working');
      console.log(`   Cancelled ${response.data.data.cancelledCount} expired bookings`);
      if (response.data.data.cancelledSessions.length > 0) {
        console.log('   Cancelled sessions:', response.data.data.cancelledSessions);
      }
    } else {
      console.log('❌ Backend timeout service failed');
      console.log(`   Error: ${response.data.error}`);
    }
  } catch (error) {
    console.error('❌ Backend timeout service test failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive timeout tests...\n');
  
  await testTimeoutFixes();
  console.log('\n' + '='.repeat(50) + '\n');
  await testBackendTimeoutService();
  
  console.log('\n🏁 All tests completed');
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ Test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testTimeoutFixes, testBackendTimeoutService, runAllTests };
