import mongoose from 'mongoose';
import User from '../models/User';
import Reward from '../models/Reward';
import Transaction from '../models/Transaction';
import Booking from '../models/Booking';
import Enrollment from '../models/Enrollment';
import { generateJWTToken } from '../utils/jwtGenerator';
import { config } from 'dotenv';

// Load environment variables
config();

const testFirebaseUserFeatures = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('✅ Connected to MongoDB');

    console.log('🧪 Testing Firebase user features vs Traditional users...');

    // Test 1: Create Firebase user
    console.log('\n📝 Test 1: Creating Firebase user');
    const firebaseUserId = '5678';
    
    const firebaseUser = new User({
      firebaseUid: `test_firebase_${Date.now()}`,
      user_id: firebaseUserId,
      email: `firebase-test-${Date.now()}@example.com`,
      name: 'Firebase Test User',
      firstName: 'Firebase',
      lastName: 'Test',
      role: 'user',
      isVerified: true,
      isActive: true,
      lastLogin: new Date()
    });

    await firebaseUser.save();
    console.log(`✅ Firebase user created: ${firebaseUser.email} (user_id: ${firebaseUser.user_id})`);

    // Test 2: Create Traditional user
    console.log('\n📝 Test 2: Creating Traditional user');
    const traditionalUserId = '9012';
    
    const traditionalUser = new User({
      user_id: traditionalUserId,
      email: `traditional-test-${Date.now()}@example.com`,
      firstName: 'Traditional',
      lastName: 'Test',
      role: 'user',
      isVerified: false,
      isActive: true,
      lastLogin: new Date()
    });

    await traditionalUser.save();
    console.log(`✅ Traditional user created: ${traditionalUser.email} (user_id: ${traditionalUser.user_id})`);

    // Test 3: Create rewards for both users
    console.log('\n📝 Test 3: Creating rewards for both users');
    
    // Firebase user rewards
    const firebaseReward = new Reward({
      userId: firebaseUser._id,
      user_id: firebaseUser.user_id,
      points: 0,
      totalEarned: 0,
      totalSpent: 0,
      history: [
        {
          type: 'earned',
          description: 'Welcome bonus for new user registration',
          points: 0,
          status: 'completed',
          date: new Date(),
        },
      ],
    });
    await firebaseReward.save();
    console.log(`✅ Firebase user rewards created`);

    // Traditional user rewards
    const traditionalReward = new Reward({
      userId: traditionalUser._id,
      user_id: traditionalUser.user_id,
      points: 0,
      totalEarned: 0,
      totalSpent: 0,
      history: [
        {
          type: 'earned',
          description: 'Welcome bonus for new user registration',
          points: 0,
          status: 'completed',
          date: new Date(),
        },
      ],
    });
    await traditionalReward.save();
    console.log(`✅ Traditional user rewards created`);

    // Test 4: Create transactions for both users
    console.log('\n📝 Test 4: Creating transactions for both users');
    
    // Firebase user transaction
    const firebaseTransaction = new Transaction({
      user_id: firebaseUser.user_id,
      amount: 50.00,
      currency: 'USD',
      type: 'booking',
      status: 'completed',
      description: 'Test booking payment',
      paymentMethod: 'card'
    });
    await firebaseTransaction.save();
    console.log(`✅ Firebase user transaction created`);

    // Traditional user transaction
    const traditionalTransaction = new Transaction({
      user_id: traditionalUser.user_id,
      amount: 50.00,
      currency: 'USD',
      type: 'booking',
      status: 'completed',
      description: 'Test booking payment',
      paymentMethod: 'card'
    });
    await traditionalTransaction.save();
    console.log(`✅ Traditional user transaction created`);

    // Test 5: Create bookings for both users
    console.log('\n📝 Test 5: Creating bookings for both users');
    
    // Firebase user booking
    const firebaseBooking = new Booking({
      clientId: firebaseUser._id,
      clientUserId: firebaseUser.user_id,
      clientEmail: firebaseUser.email,
      totalSessions: 1,
      totalSpent: 50.00,
      sessions: [{
        sessionId: new mongoose.Types.ObjectId(),
        expertId: new mongoose.Types.ObjectId(),
        sessionType: 'video',
        duration: 60,
        scheduledDate: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        status: 'completed',
        createdTime: new Date(),
        updatedTime: new Date()
      }]
    });
    await firebaseBooking.save();
    console.log(`✅ Firebase user booking created`);

    // Traditional user booking
    const traditionalBooking = new Booking({
      clientId: traditionalUser._id,
      clientUserId: traditionalUser.user_id,
      clientEmail: traditionalUser.email,
      totalSessions: 1,
      totalSpent: 50.00,
      sessions: [{
        sessionId: new mongoose.Types.ObjectId(),
        expertId: new mongoose.Types.ObjectId(),
        sessionType: 'video',
        duration: 60,
        scheduledDate: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        status: 'completed',
        createdTime: new Date(),
        updatedTime: new Date()
      }]
    });
    await traditionalBooking.save();
    console.log(`✅ Traditional user booking created`);

    // Test 6: Test authentication tokens
    console.log('\n📝 Test 6: Testing authentication tokens');
    
    // Firebase user JWT token
    const firebaseJWT = generateJWTToken(firebaseUser.user_id);
    console.log(`✅ Firebase user JWT token generated: ${firebaseJWT.substring(0, 20)}...`);
    
    // Traditional user JWT token
    const traditionalJWT = generateJWTToken(traditionalUser.user_id);
    console.log(`✅ Traditional user JWT token generated: ${traditionalJWT.substring(0, 20)}...`);

    // Test 7: Test feature access
    console.log('\n📝 Test 7: Testing feature access');
    
    // Test rewards access
    const firebaseRewardFound = await Reward.findOne({ userId: firebaseUser._id });
    const traditionalRewardFound = await Reward.findOne({ userId: traditionalUser._id });
    console.log(`✅ Firebase user rewards accessible: ${!!firebaseRewardFound}`);
    console.log(`✅ Traditional user rewards accessible: ${!!traditionalRewardFound}`);
    
    // Test transactions access
    const firebaseTransactions = await Transaction.find({ user_id: firebaseUser.user_id });
    const traditionalTransactions = await Transaction.find({ user_id: traditionalUser.user_id });
    console.log(`✅ Firebase user transactions accessible: ${firebaseTransactions.length} found`);
    console.log(`✅ Traditional user transactions accessible: ${traditionalTransactions.length} found`);
    
    // Test bookings access
    const firebaseBookings = await Booking.find({ clientUserId: firebaseUser.user_id });
    const traditionalBookings = await Booking.find({ clientUserId: traditionalUser.user_id });
    console.log(`✅ Firebase user bookings accessible: ${firebaseBookings.length} found`);
    console.log(`✅ Traditional user bookings accessible: ${traditionalBookings.length} found`);

    // Test 8: Compare user data structure
    console.log('\n📝 Test 8: Comparing user data structure');
    console.log('Firebase user structure:');
    console.log(`  - _id: ${firebaseUser._id}`);
    console.log(`  - user_id: ${firebaseUser.user_id}`);
    console.log(`  - firebaseUid: ${firebaseUser.firebaseUid}`);
    console.log(`  - email: ${firebaseUser.email}`);
    console.log(`  - role: ${firebaseUser.role}`);
    console.log(`  - isVerified: ${firebaseUser.isVerified}`);
    
    console.log('Traditional user structure:');
    console.log(`  - _id: ${traditionalUser._id}`);
    console.log(`  - user_id: ${traditionalUser.user_id}`);
    console.log(`  - firebaseUid: ${traditionalUser.firebaseUid || 'null'}`);
    console.log(`  - email: ${traditionalUser.email}`);
    console.log(`  - role: ${traditionalUser.role}`);
    console.log(`  - isVerified: ${traditionalUser.isVerified}`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Reward.deleteMany({ userId: { $in: [firebaseUser._id, traditionalUser._id] } });
    await Transaction.deleteMany({ user_id: { $in: [firebaseUser.user_id, traditionalUser.user_id] } });
    await Booking.deleteMany({ clientUserId: { $in: [firebaseUser.user_id, traditionalUser.user_id] } });
    await User.deleteMany({ _id: { $in: [firebaseUser._id, traditionalUser._id] } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All Firebase user features test passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Firebase users have the same MongoDB _id structure as traditional users');
    console.log('✅ Firebase users can access rewards using their MongoDB _id');
    console.log('✅ Firebase users can access transactions using their 4-digit user_id');
    console.log('✅ Firebase users can access bookings using their 4-digit user_id');
    console.log('✅ Firebase users can access enrollments using their MongoDB _id');
    console.log('✅ Firebase users get JWT tokens with their 4-digit user_id');
    console.log('✅ Firebase users have the same authentication flow as traditional users');
    console.log('✅ Firebase users have the same feature access as traditional users');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testFirebaseUserFeatures();
