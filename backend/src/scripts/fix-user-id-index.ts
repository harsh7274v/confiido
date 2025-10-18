// Script to fix duplicate user_id null issue
// Run this with: npx ts-node src/scripts/fix-user-id-index.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';

async function fixUserIdIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const usersCollection = db.collection('users');

    // Step 1: Check current indexes
    console.log('\n📋 Current indexes on users collection:');
    const indexes = await usersCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Step 2: Drop the old user_id index if it exists
    try {
      console.log('\n🗑️  Attempting to drop old user_id index...');
      await usersCollection.dropIndex('user_id_1');
      console.log('✅ Old user_id index dropped');
    } catch (error: any) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  No existing user_id index to drop');
      } else {
        throw error;
      }
    }

    // Step 3: Find and fix users with null user_id
    console.log('\n🔍 Finding users with null user_id...');
    const usersWithNullId = await usersCollection.find({ 
      $or: [
        { user_id: null },
        { user_id: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${usersWithNullId.length} users with null user_id`);

    // Step 4: Generate user_ids for users that don't have one
    if (usersWithNullId.length > 0) {
      console.log('\n🔢 Generating user_ids for users without one...');
      
      // Get the highest existing user_id
      const highestUser = await usersCollection.findOne(
        { user_id: { $exists: true, $ne: null } },
        { sort: { user_id: -1 } }
      );
      
      let nextUserId = 1000;
      if (highestUser && highestUser.user_id) {
        nextUserId = parseInt(highestUser.user_id) + 1;
      }

      console.log(`Starting from user_id: ${nextUserId}`);

      // Update each user
      for (const user of usersWithNullId) {
        const newUserId = nextUserId.toString().padStart(4, '0');
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { user_id: newUserId } }
        );
        console.log(`✅ Updated user ${user.email || user._id} with user_id: ${newUserId}`);
        nextUserId++;
      }
    }

    // Step 5: Create new sparse unique index
    console.log('\n🔨 Creating new sparse unique index on user_id...');
    await usersCollection.createIndex(
      { user_id: 1 },
      { 
        unique: true, 
        sparse: true,
        name: 'user_id_1'
      }
    );
    console.log('✅ New sparse unique index created');

    // Step 6: Verify the new index
    console.log('\n✅ Updated indexes on users collection:');
    const newIndexes = await usersCollection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n🎉 User ID index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing user_id index:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixUserIdIndex()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
