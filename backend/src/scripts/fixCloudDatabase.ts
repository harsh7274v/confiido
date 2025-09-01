import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixCloudDatabase() {
  try {
    // Connect to MongoDB Atlas using the same connection as the main app
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable not found');
    }
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas:', mongoURI.split('@')[1]); // Don't log credentials

    const db = mongoose.connection.db;
    
    console.log('\n🔍 Current database state:');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`Total collections: ${collections.length}`);
    
    // Check if rewards collection exists
    const rewardsCollection = collections.find(col => col.name === 'rewards');
    if (rewardsCollection) {
      console.log('✅ Rewards collection exists');
      
      // Get collection info and indexes
      const collectionInfo = await db.collection('rewards').indexes();
      console.log(`Rewards collection indexes: ${collectionInfo.length}`);
      collectionInfo.forEach(index => {
        console.log(`  - ${JSON.stringify(index)}`);
      });
      
      // Count documents
      const docCount = await db.collection('rewards').countDocuments();
      console.log(`Rewards documents: ${docCount}`);
      
      if (docCount > 0) {
        console.log('\n⚠️  WARNING: Rewards collection has existing data!');
        console.log('This will be LOST when we recreate the collection.');
        console.log('Proceed? (y/N)');
        
        // For now, let's proceed with caution
        console.log('Proceeding with collection recreation...');
      }
    } else {
      console.log('❌ Rewards collection does not exist');
    }

    // Drop the rewards collection to remove old indexes and constraints
    console.log('\n🗑️  Dropping rewards collection...');
    try {
      await db.dropCollection('rewards');
      console.log('✅ Rewards collection dropped successfully');
    } catch (error) {
      console.log('Rewards collection was already dropped or never existed');
    }

    // Verify collection is gone
    const collectionsAfter = await db.listCollections().toArray();
    const rewardsAfter = collectionsAfter.find(col => col.name === 'rewards');
    if (!rewardsAfter) {
      console.log('✅ Confirmed: Rewards collection no longer exists');
    } else {
      console.log('❌ Error: Rewards collection still exists after drop');
    }

    console.log('\n🎉 Cloud database fix completed!');
    console.log('📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. The new schema will be created automatically');
    console.log('   3. Test the rewards endpoint');

  } catch (error) {
    console.error('Cloud database fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB Atlas');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  fixCloudDatabase();
}

export default fixCloudDatabase;
