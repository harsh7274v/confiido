import mongoose from 'mongoose';
import Reward from '../models/Reward';

async function testRewardModel() {
  try {
    console.log('Testing Reward model import...');
    
    // Test if model can be created
    console.log('Reward model imported successfully');
    console.log('Model name:', Reward.modelName);
    console.log('Collection name:', Reward.collection.name);
    
    // Test schema
    const schema = Reward.schema;
    console.log('Schema paths:');
    Object.keys(schema.paths).forEach(path => {
      console.log(`  - ${path}: ${schema.paths[path].instance}`);
    });
    
    console.log('✅ Reward model test completed successfully!');

  } catch (error) {
    console.error('❌ Reward model test failed:', error);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testRewardModel();
}

export default testRewardModel;
