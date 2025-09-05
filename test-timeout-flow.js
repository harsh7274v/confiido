/**
 * Test script to verify the timeout flow from frontend to backend
 * This script simulates the timeout expiration process
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5003';

// Mock authentication token (replace with actual token for testing)
const AUTH_TOKEN = 'your-auth-token-here';

async function testTimeoutFlow() {
  console.log('🧪 Testing timeout flow...\n');

  try {
    // Step 1: Create a test booking with a very short timeout (1 minute)
    console.log('1️⃣ Creating test booking with 1-minute timeout...');
    
    const bookingData = {
      expertId: '68b0daa5349f0802590e2755', // Replace with actual expert ID
      sessionType: 'chat',
      duration: 30,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      startTime: '10:00',
      notes: 'Test booking for timeout flow'
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

      // Step 2: Wait for timeout to expire (in real scenario, this would be 5 minutes)
      console.log('2️⃣ Waiting for timeout to expire...');
      console.log('   (In real scenario, this would be 5 minutes)');
      console.log('   For testing, we\'ll simulate the timeout by calling the cancel endpoint\n');

      // Step 3: Simulate frontend calling the cancel expired session endpoint
      console.log('3️⃣ Simulating frontend timeout expiration...');
      
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
        console.log(`   Cancellation Reason: ${cancelResponse.data.data.session.cancellationReason}`);
        console.log(`   Cancelled By: ${cancelResponse.data.data.session.cancelledBy}\n`);
      } else {
        console.log('❌ Failed to cancel expired session');
        console.log(`   Error: ${cancelResponse.data.error}\n`);
      }

      // Step 4: Verify the booking status was updated
      console.log('4️⃣ Verifying updated booking status...');
      
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
      }

    } else {
      console.log('❌ Failed to create booking');
      console.log(`   Error: ${createResponse.data.error}\n`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testTimeoutFlow()
    .then(() => {
      console.log('🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTimeoutFlow };
