import mongoose from 'mongoose';
import Booking from '../models/Booking';
import User from '../models/User';

async function checkBookingUserIds() {
  try {
    console.log('🔍 Checking booking clientUserId values...');
    
    // Find all bookings
    const allBookings = await Booking.find({}).populate('clientId', 'email firebaseUid user_id');
    
    console.log(`📋 Found ${allBookings.length} total bookings`);

    let needsFixCount = 0;
    let correctCount = 0;

    for (const booking of allBookings) {
      const clientUser = booking.clientId as any;
      
      if (!clientUser) {
        console.log(`⚠️ Booking ${booking._id}: No client user found`);
        continue;
      }

      // Firebase users use firebaseUid, email/password users use user_id
      const expectedClientUserId = clientUser.firebaseUid || clientUser.user_id;

      console.log(`\n📋 Booking ${booking._id}:`);
      console.log(`   Current clientUserId: ${booking.clientUserId}`);
      console.log(`   Client email: ${clientUser.email}`);
      console.log(`   Client firebaseUid: ${clientUser.firebaseUid}`);
      console.log(`   Client user_id: ${clientUser.user_id}`);
      console.log(`   User type: ${clientUser.firebaseUid ? 'FIREBASE' : 'EMAIL_PASSWORD'}`);
      console.log(`   Expected clientUserId: ${expectedClientUserId}`);
      
      if (booking.clientUserId === expectedClientUserId) {
        console.log(`   ✅ Correct`);
        correctCount++;
      } else {
        console.log(`   ❌ Needs fix: ${booking.clientUserId} → ${expectedClientUserId}`);
        needsFixCount++;
      }

      // Check sessions
      for (const session of booking.sessions) {
        console.log(`   📅 Session ${session.sessionId}:`);
        console.log(`      Current expertUserId: ${session.expertUserId}`);
        
        // Get expert user details
        const expertUser = await User.findById(session.expertId);
        if (expertUser) {
          // Firebase users use firebaseUid, email/password users use user_id
          const expectedExpertUserId = expertUser.firebaseUid || expertUser.user_id;
          
          console.log(`      Expert email: ${expertUser.email}`);
          console.log(`      Expert firebaseUid: ${expertUser.firebaseUid}`);
          console.log(`      Expert user_id: ${expertUser.user_id}`);
          console.log(`      Expected expertUserId: ${expectedExpertUserId}`);
          
          if (session.expertUserId === expectedExpertUserId) {
            console.log(`      ✅ Correct`);
          } else {
            console.log(`      ❌ Needs fix: ${session.expertUserId} → ${expectedExpertUserId}`);
          }
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total bookings: ${allBookings.length}`);
    console.log(`   Correct: ${correctCount}`);
    console.log(`   Need fix: ${needsFixCount}`);
    
    if (needsFixCount > 0) {
      console.log('\n💡 To fix these bookings, run: npm run fix:booking-user-ids');
    } else {
      console.log('\n✅ All bookings have correct clientUserId values!');
    }

  } catch (error) {
    console.error('❌ Error in checkBookingUserIds:', error);
  }
}

// Run the script
checkBookingUserIds()
  .then(() => {
    console.log('🎉 Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });
