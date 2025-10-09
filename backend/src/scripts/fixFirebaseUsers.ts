import mongoose from 'mongoose';
import User from '../models/User';
import Booking from '../models/Booking';

async function fixFirebaseUsers() {
  try {
    console.log('🔧 Fixing Firebase users with mock emails...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('✅ Connected to database');

    // Find Firebase users with mock emails
    const firebaseUsersWithMockEmails = await User.find({
      firebaseUid: { $exists: true, $ne: null },
      email: { $regex: /^mock-[a-zA-Z0-9_-]+@example\.com$/ }
    });

    console.log(`📋 Found ${firebaseUsersWithMockEmails.length} Firebase users with mock emails`);

    if (firebaseUsersWithMockEmails.length === 0) {
      console.log('✅ No Firebase users with mock emails found. All good!');
      process.exit(0);
    }

    for (const user of firebaseUsersWithMockEmails) {
      console.log(`\n🔍 Processing user ${user._id}:`);
      console.log(`   Current email: ${user.email}`);
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      
      // We can't get the real email from Firebase UID alone, so we need to ask the user
      console.log(`   ⚠️ Cannot automatically fix this user - we need the real email address`);
      console.log(`   📝 Please provide the real email for Firebase UID: ${user.firebaseUid}`);
      
      // For now, let's just delete these mock users and their bookings
      // The user will need to login again to create a proper Firebase user
      console.log(`   🗑️ Deleting mock user and their bookings...`);
      
      // Delete user's bookings
      const userBookings = await Booking.find({ clientId: user._id });
      console.log(`   📅 Found ${userBookings.length} bookings to delete`);
      
      for (const booking of userBookings) {
        await Booking.findByIdAndDelete(booking._id);
        console.log(`   🗑️ Deleted booking ${booking._id}`);
      }
      
      // Delete the user
      await User.findByIdAndDelete(user._id);
      console.log(`   🗑️ Deleted user ${user._id}`);
      
      console.log(`   ✅ User and bookings cleaned up. User will need to login again.`);
    }

    console.log('\n✅ Fix completed');
    console.log('📝 Note: Users with mock emails have been deleted and will need to login again to create proper Firebase users.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in fixFirebaseUsers:', error);
    process.exit(1);
  }
}

// Run the script
fixFirebaseUsers();

