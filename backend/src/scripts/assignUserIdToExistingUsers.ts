import mongoose from 'mongoose';
import User from '../models/User';
import { generateUniqueUserId } from '../utils/userIdGenerator';
import { config } from 'dotenv';

// Load environment variables
config();

const assignUserIdToExistingUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('✅ Connected to MongoDB');

    // Find all users without user_id
    const usersWithoutUserId = await User.find({ 
      $or: [
        { user_id: { $exists: false } },
        { user_id: null },
        { user_id: '' }
      ]
    });

    console.log(`📊 Found ${usersWithoutUserId.length} users without user_id`);

    if (usersWithoutUserId.length === 0) {
      console.log('✅ All users already have user_id assigned');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of usersWithoutUserId) {
      try {
        console.log(`🔄 Processing user: ${user.email} (${user._id})`);
        
        // Generate unique user_id
        const userId = await generateUniqueUserId();
        
        // Update user with new user_id
        user.user_id = userId;
        await user.save();
        
        console.log(`✅ Assigned user_id ${userId} to user: ${user.email}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to assign user_id to user ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Successfully assigned user_id to ${successCount} users`);
    console.log(`❌ Failed to assign user_id to ${errorCount} users`);
    console.log(`📊 Total processed: ${successCount + errorCount} users`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
assignUserIdToExistingUsers();
