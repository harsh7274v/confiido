import mongoose from 'mongoose';
import User from '../models/User';
import { generateJWTToken, verifyJWTToken } from '../utils/jwtGenerator';
import { config } from 'dotenv';

// Load environment variables
config();

const debugAuthIssue = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Debugging authentication issue...');

    // Test 1: Check if we can find any users
    console.log('\n📝 Test 1: Checking existing users');
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} users in database`);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('Sample user:', {
        _id: user._id,
        user_id: user.user_id,
        email: user.email,
        firebaseUid: user.firebaseUid,
        isActive: user.isActive
      });
    }

    // Test 2: Test JWT token generation and verification
    console.log('\n📝 Test 2: Testing JWT token generation');
    if (users.length > 0) {
      const user = users[0];
      const testUserId = user.user_id || '1234';
      
      console.log(`Testing with user_id: ${testUserId}`);
      
      // Generate JWT token
      const jwtToken = generateJWTToken(testUserId);
      console.log(`Generated JWT token: ${jwtToken.substring(0, 50)}...`);
      
      // Verify JWT token
      const verifiedUserId = verifyJWTToken(jwtToken);
      console.log(`Verified user_id: ${verifiedUserId}`);
      
      // Test if we can find user by user_id
      const foundUser = await User.findOne({ user_id: verifiedUserId });
      console.log(`User found by user_id: ${foundUser ? 'Yes' : 'No'}`);
      
      if (foundUser) {
        console.log('Found user details:', {
          _id: foundUser._id,
          user_id: foundUser.user_id,
          email: foundUser.email,
          isActive: foundUser.isActive
        });
      }
    }

    // Test 3: Test different token formats
    console.log('\n📝 Test 3: Testing different token formats');
    
    // Test Firebase token format (mock)
    const mockFirebaseToken = 'mock_token_test123';
    console.log(`Mock Firebase token: ${mockFirebaseToken}`);
    
    // Test JWT token format
    const jwtToken = generateJWTToken('1234');
    console.log(`JWT token: ${jwtToken.substring(0, 50)}...`);
    
    // Test legacy token format
    const legacyToken = `token_${users[0]?._id}_${Date.now()}`;
    console.log(`Legacy token: ${legacyToken}`);

    // Test 4: Check auth middleware logic
    console.log('\n📝 Test 4: Simulating auth middleware logic');
    
    const testTokens = [
      mockFirebaseToken,
      jwtToken,
      legacyToken,
      'invalid_token',
      null,
      undefined
    ];

    for (const token of testTokens) {
      console.log(`\nTesting token: ${token ? token.substring(0, 20) + '...' : 'null/undefined'}`);
      
      if (!token) {
        console.log('❌ Token is null/undefined - would fail at line 37');
        continue;
      }

      if (token.startsWith('mock_token_')) {
        console.log('✅ Mock token detected');
        const mockUid = token.replace('mock_token_', '');
        const mockUser = await User.findOne({ firebaseUid: mockUid });
        console.log(`Mock user found: ${mockUser ? 'Yes' : 'No'}`);
      } else {
        // Try JWT verification
        const userIdFromToken = verifyJWTToken(token);
        if (userIdFromToken) {
          console.log(`✅ JWT token verified, user_id: ${userIdFromToken}`);
          const user = await User.findOne({ user_id: userIdFromToken });
          console.log(`User found by user_id: ${user ? 'Yes' : 'No'}`);
        } else {
          // Try legacy format
          const tokenParts = token.split('_');
          if (tokenParts.length >= 2) {
            console.log(`✅ Legacy token format detected, ID: ${tokenParts[1]}`);
            const user = await User.findById(tokenParts[1]);
            console.log(`User found by _id: ${user ? 'Yes' : 'No'}`);
          } else {
            console.log('❌ Invalid token format');
          }
        }
      }
    }

    console.log('\n🎯 Debugging complete! Check the results above to identify the issue.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the debug
debugAuthIssue();
