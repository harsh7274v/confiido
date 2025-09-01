import mongoose from 'mongoose';
import Reward from '../models/Reward';

async function testRewardsSchema() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Test creating a reward with the new schema
    const testReward = new Reward({
      userId: new mongoose.Types.ObjectId(), // Create a dummy ObjectId
      points: 100,
      totalEarned: 100,
      totalSpent: 0,
      history: [{
        type: 'earned',
        description: 'Test reward',
        points: 100,
        status: 'completed',
        date: new Date()
      }]
    });

    await testReward.save();
    console.log('✅ Test reward created successfully with new schema');
    console.log('Reward ID:', testReward._id);
    console.log('User ID:', testReward.userId);

    // Clean up test data
    await Reward.deleteOne({ _id: testReward._id });
    console.log('✅ Test reward cleaned up');

    console.log('Schema test completed successfully!');

  } catch (error) {
    console.error('❌ Schema test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testRewardsSchema();
}

export default testRewardsSchema;
