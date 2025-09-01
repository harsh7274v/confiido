import mongoose from 'mongoose';
import User from '../models/User';
import Reward from '../models/Reward';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createMissingRewards() {
  try {
    // Connect to MongoDB using the same connection as the main app
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable not found');
    }
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas:', mongoURI.split('@')[1]); // Don't log credentials

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} total users`);

    let rewardsCreated = 0;
    let rewardsSkipped = 0;

    for (const user of users) {
      try {
        // Check if user already has rewards
        const existingReward = await Reward.findOne({ userId: user._id });
        
        if (existingReward) {
          console.log(`User ${user.email} already has rewards, skipping...`);
          rewardsSkipped++;
          continue;
        }

        // Create rewards for user
        await Reward.create({
          userId: user._id,
          user_id: user.user_id || 'EXISTING', // Include user_id if available, or placeholder
          points: 250,
          totalEarned: 250,
          totalSpent: 0,
          history: [
            {
              type: 'earned',
              description: 'Welcome bonus for existing user',
              points: 250,
              status: 'completed',
              date: new Date(),
            },
          ],
        });

        console.log(`✅ Created rewards for user: ${user.email} (${user.user_id || 'EXISTING'}) (${user._id})`);
        rewardsCreated++;

      } catch (error) {
        console.error(`❌ Failed to create rewards for user ${user.email}:`, error);
      }
    }

    console.log('\n🎉 Summary:');
    console.log(`Total users: ${users.length}`);
    console.log(`Rewards created: ${rewardsCreated}`);
    console.log(`Rewards skipped: ${rewardsSkipped}`);

  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createMissingRewards();
}

export default createMissingRewards;
