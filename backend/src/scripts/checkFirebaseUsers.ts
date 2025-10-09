import mongoose from 'mongoose';
import User from '../models/User';
import Booking from '../models/Booking';

async function checkFirebaseUsers() {
  try {
    console.log('🔍 Checking Firebase users in database...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('✅ Connected to database');

    // Get all users with Firebase UIDs
    const allUsers = await User.find({});
    console.log(`📋 Total users in database: ${allUsers.length}`);
    
    const firebaseUsers = await User.find({ 
      firebaseUid: { $exists: true, $ne: null } 
    });
    console.log(`📋 Found ${firebaseUsers.length} Firebase users`);
    
    // Debug: Show all users with firebaseUid field
    const usersWithFirebaseField = await User.find({ firebaseUid: { $exists: true } });
    console.log(`📋 Users with firebaseUid field: ${usersWithFirebaseField.length}`);
    
    for (const user of usersWithFirebaseField) {
      console.log(`   User ${user._id}: firebaseUid = "${user.firebaseUid}"`);
    }

    // Check each Firebase user
    for (const user of firebaseUsers) {
      console.log('\n👤 Firebase User Details:');
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      console.log(`   User ID: ${user.user_id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLogin}`);
      
      // Check if this user has mock email
      const hasMockEmail = user.email?.match(/^mock-[a-zA-Z0-9_-]+@example\.com$/);
      console.log(`   Has Mock Email: ${!!hasMockEmail}`);
      
      if (hasMockEmail) {
        console.log(`   ⚠️ PROBLEM: This Firebase user has a mock email!`);
      }
      
      // Show user's bookings
      const userBookings = await Booking.find({ clientId: user._id });
      console.log(`   Bookings: ${userBookings.length}`);
      
      if (userBookings.length > 0) {
        console.log('   📅 Recent Bookings:');
        for (const booking of userBookings.slice(0, 3)) { // Show only last 3
          console.log(`      Booking ID: ${booking._id}`);
          console.log(`      Client User ID: ${booking.clientUserId}`);
          console.log(`      Client Email: ${booking.clientEmail}`);
          console.log(`      Created: ${booking.createdAt}`);
        }
      }
    }

    // Check recent bookings to see what's being saved
    console.log('\n📋 Recent Bookings (last 10):');
    const recentBookings = await Booking.find({})
      .populate('clientId', 'email name firebaseUid user_id')
      .sort({ createdAt: -1 })
      .limit(10);
    
    for (const booking of recentBookings) {
      const clientUser = booking.clientId as any;
      console.log(`\n📅 Booking ${booking._id}:`);
      console.log(`   Client: ${clientUser?.email} (${clientUser?.name})`);
      console.log(`   Client Firebase UID: ${clientUser?.firebaseUid}`);
      console.log(`   Client User ID: ${clientUser?.user_id}`);
      console.log(`   Booking Client User ID: ${booking.clientUserId}`);
      console.log(`   Booking Client Email: ${booking.clientEmail}`);
      console.log(`   Created: ${booking.createdAt}`);
      
      const hasMockEmail = clientUser?.email?.match(/^mock-[a-zA-Z0-9_-]+@example\.com$/);
      console.log(`   Has Mock Email: ${!!hasMockEmail}`);
      
      if (hasMockEmail) {
        console.log(`   ⚠️ PROBLEM: This booking was created by a user with mock email!`);
      }
    }

    console.log('\n✅ Check completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in checkFirebaseUsers:', error);
    process.exit(1);
  }
}

// Run the script
checkFirebaseUsers();
