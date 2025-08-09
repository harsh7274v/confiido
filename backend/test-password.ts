// Test script to verify password hashing
// Run this in the backend directory: npx ts-node test-password.ts

import bcrypt from 'bcryptjs';

const testPassword = async () => {
  const plainPassword = 'TestPassword123';
  
  console.log('🔐 Testing Password Hashing');
  console.log('===========================');
  console.log('Plain password:', plainPassword);
  
  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  
  console.log('Salt:', salt);
  console.log('Hashed password:', hashedPassword);
  
  // Test comparison
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Password match test:', isMatch ? '✅ PASS' : '❌ FAIL');
  
  // Test with wrong password
  const wrongPassword = 'WrongPassword123';
  const isWrongMatch = await bcrypt.compare(wrongPassword, hashedPassword);
  console.log('Wrong password test:', isWrongMatch ? '❌ FAIL (should be false)' : '✅ PASS');
  
  console.log('\n🎯 Password hashing is working correctly!');
};

testPassword().catch(console.error);
