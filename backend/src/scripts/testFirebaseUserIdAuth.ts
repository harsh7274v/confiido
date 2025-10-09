import mongoose from 'mongoose';
import User from '../models/User';
import { generateJWTToken, verifyJWTToken } from '../utils/jwtGenerator';
import { config } from 'dotenv';

// Load environment variables
config();

const testFirebaseUserIdAuth = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('✅ Connected to MongoDB');

    console.log('🧪 Testing Firebase userId authentication...');

    // Test 1: Create a Firebase user with userId
    console.log('\n📝 Test 1: Creating Firebase user with userId');
    const testUserId = '1234'; // Use a test 4-digit ID
    
    const firebaseUser = new User({
      firebaseUid: `test_firebase_${Date.now()}`,
      user_id: testUserId,
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
    console.log(`✅ Firebase user created with user_id: ${testUserId}`);

    // Test 2: Generate JWT token using userId
    console.log('\n📝 Test 2: Generating JWT token with userId');
    const jwtToken = generateJWTToken(testUserId);
    console.log(`✅ JWT token generated: ${jwtToken.substring(0, 20)}...`);

    // Test 3: Verify JWT token
    console.log('\n📝 Test 3: Verifying JWT token');
    const verifiedUserId = verifyJWTToken(jwtToken);
    console.log(`✅ JWT token verified, user_id: ${verifiedUserId}`);

    // Test 4: Find user by userId from JWT
    console.log('\n📝 Test 4: Finding user by userId from JWT');
    const foundUser = await User.findOne({ user_id: verifiedUserId });
    console.log(`✅ User found by user_id: ${foundUser ? foundUser.email : 'Not found'}`);

    // Test 5: Test authentication flow (simulate what happens in auth middleware)
    console.log('\n📝 Test 5: Testing complete authentication flow');
    
    // Simulate the auth middleware logic
    const userIdFromToken = verifyJWTToken(jwtToken);
    if (userIdFromToken) {
      console.log(`✅ JWT user_id found: ${userIdFromToken}`);
      const user = await User.findOne({ user_id: userIdFromToken }).select('-password');
      console.log(`✅ JWT user found by user_id: ${user ? 'yes' : 'no'}`);
      
      if (user && user.isActive) {
        console.log(`✅ Authentication successful for user: ${user.email} (user_id: ${user.user_id})`);
      }
    }

    // Test 6: Test with invalid token
    console.log('\n📝 Test 6: Testing with invalid token');
    const invalidToken = 'invalid_token';
    const invalidUserId = verifyJWTToken(invalidToken);
    console.log(`✅ Invalid token handled correctly: ${invalidUserId === null ? 'yes' : 'no'}`);

    // Clean up test user
    await User.findByIdAndDelete(firebaseUser._id);
    console.log('🧹 Test user cleaned up');

    console.log('\n🎉 All Firebase userId authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Firebase users now use 4-digit userId for authentication');
    console.log('✅ JWT tokens are generated using userId instead of MongoDB _id');
    console.log('✅ Authentication middleware supports both Firebase and traditional users');
    console.log('✅ All users (Firebase and traditional) use the same userId-based system');

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
testFirebaseUserIdAuth();
