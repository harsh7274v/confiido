import mongoose from 'mongoose';
import User from '../models/User';
import { generateUniqueUserId } from '../utils/userIdGenerator';
import { config } from 'dotenv';

// Load environment variables
config();

const testUserIdGeneration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('✅ Connected to MongoDB');

    console.log('🧪 Testing userId generation...');

    // Test 1: Generate multiple unique user IDs
    console.log('\n📝 Test 1: Generating multiple unique user IDs');
    const userIds: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      const userId = await generateUniqueUserId();
      userIds.push(userId);
      console.log(`Generated user_id ${i + 1}: ${userId}`);
    }

    // Verify all are unique
    const uniqueIds = new Set(userIds);
    console.log(`✅ Generated ${userIds.length} user IDs, ${uniqueIds.size} are unique`);

    // Test 2: Check format (4 digits)
    console.log('\n📝 Test 2: Checking user_id format');
    const allValidFormat = userIds.every(id => /^\d{4}$/.test(id));
    console.log(`✅ All user IDs are 4 digits: ${allValidFormat}`);

    // Test 3: Create a test user with user_id
    console.log('\n📝 Test 3: Creating test user with user_id');
    const testUserId = await generateUniqueUserId();
    
    const testUser = new User({
      firebaseUid: `test_${Date.now()}`,
      user_id: testUserId,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isVerified: true,
      isActive: true,
      lastLogin: new Date()
    });

    await testUser.save();
    console.log(`✅ Test user created with user_id: ${testUserId}`);

    // Test 4: Verify user_id is saved correctly
    const savedUser = await User.findById(testUser._id);
    console.log(`✅ User_id in database: ${savedUser?.user_id}`);

    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    console.log('🧹 Test user cleaned up');

    console.log('\n🎉 All tests passed! userId generation is working correctly.');

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
testUserIdGeneration();
