import mongoose from 'mongoose';
import Booking from '../models/Booking';
import User from '../models/User';

async function fixBookingClientUserIds() {
  try {
    console.log('🔧 Starting booking clientUserId fix...');
    
    // Find all bookings that have clientUserId as "0000" or other derived IDs
    const bookingsToFix = await Booking.find({
      $or: [
        { clientUserId: '0000' },
        { clientUserId: { $regex: /^[0-9]{4}$/ } } // Any 4-digit number
      ]
    });

    console.log(`📋 Found ${bookingsToFix.length} bookings to fix`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const booking of bookingsToFix) {
      try {
        // Get the client user details
        const clientUser = await User.findById(booking.clientId);
        
        if (!clientUser) {
          console.log(`⚠️ Client user not found for booking ${booking._id}, skipping`);
          skippedCount++;
          continue;
        }

        console.log(`🔍 Processing booking ${booking._id}:`);
        console.log(`   Current clientUserId: ${booking.clientUserId}`);
        console.log(`   Client email: ${clientUser.email}`);
        console.log(`   Client firebaseUid: ${clientUser.firebaseUid}`);
        console.log(`   Client user_id: ${clientUser.user_id}`);

        // Determine the correct clientUserId: Firebase users use firebaseUid, email/password users use user_id
        const newClientUserId = clientUser.firebaseUid || clientUser.user_id;
        console.log(`   User type: ${clientUser.firebaseUid ? 'FIREBASE' : 'EMAIL_PASSWORD'}, using: ${newClientUserId}`);

        // Update the booking's clientUserId
        if (newClientUserId && newClientUserId !== booking.clientUserId) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: { clientUserId: newClientUserId }
          });
          
          // Also update all sessions' expertUserId if the expert is also a mock user
          for (const session of booking.sessions) {
            const expertUser = await User.findById(session.expertId);
            if (expertUser) {
              // Firebase users use firebaseUid, email/password users use user_id
              const newExpertUserId = expertUser.firebaseUid || expertUser.user_id;
              
              if (newExpertUserId && newExpertUserId !== session.expertUserId) {
                await Booking.updateOne(
                  { _id: booking._id, 'sessions.sessionId': session.sessionId },
                  { $set: { 'sessions.$.expertUserId': newExpertUserId } }
                );
                console.log(`   Updated expert session ${session.sessionId} expertUserId: ${newExpertUserId}`);
              }
            }
          }
          
          console.log(`   ✅ Updated booking ${booking._id} clientUserId: ${booking.clientUserId} → ${newClientUserId}`);
          fixedCount++;
        } else {
          console.log(`   ⏭️ No change needed for booking ${booking._id}`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing booking ${booking._id}:`, error);
        skippedCount++;
      }
    }

    console.log('\n📊 Fix Summary:');
    console.log(`   Total bookings processed: ${bookingsToFix.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('✅ Booking clientUserId fix completed!');

  } catch (error) {
    console.error('❌ Error in fixBookingClientUserIds:', error);
  }
}

// Run the script
fixBookingClientUserIds()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
