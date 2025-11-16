import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase.server';
import User from '../models/User';
import { generateUniqueUserId } from '../utils/userIdGenerator';
import Reward from '../models/Reward';
import { generateJWTToken } from '../utils/jwtGenerator';

interface AuthRequest extends Request {
  user?: any;
  jwtToken?: string;
}

export const verifyFirebaseToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Find user by Firebase UID first
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // Check if user exists with this email (traditional signup)
      const existingUser = await User.findOne({ email: decodedToken.email });
      
      if (existingUser) {
        // Link Firebase account to existing user
        existingUser.firebaseUid = decodedToken.uid;
  // Avatar/profile picture logic removed
        existingUser.isVerified = true; // Firebase users are verified
        existingUser.lastLogin = new Date();
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new Firebase user
        const nameParts = decodedToken.name?.split(' ') || ['', ''];
        
        // Generate unique user_id
        const user_id = await generateUniqueUserId();
        console.log(`🆔 Generated user_id for Firebase user: ${user_id}`);
        
          user = new User({
            firebaseUid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            // Avatar/profile picture logic removed
            role: 'user',
            isVerified: true, // Firebase users are verified
            isActive: true,
            lastLogin: new Date(),
            username: '',
            password: 'firebase_dummy_password', // Not used for Firebase, but must be at least 8 chars
            phone: '',
            phoneNumber: '',
            whatsappNumber: '',
            dateOfBirth: null,
            gender: 'prefer-not-to-say',
            age: null,
            category: 'student',
            profession: '',
            domain: '',
            location: {
              country: '',
              city: '',
              timezone: 'UTC'
            },
            bio: '',
            user_id: user_id, // Use generated user_id instead of null
            preferences: {
              notifications: {
                email: true,
                push: true,
                sms: false
              },
              privacy: {
                profileVisibility: 'public',
                showOnlineStatus: true
              }
            },
            socialLinks: {
              linkedin: '',
              twitter: '',
              website: ''
            }
          });
        await user.save();
        console.log(`✅ Firebase user created successfully with user_id: ${user.user_id}`);
        
        // Generate JWT token immediately for new Firebase user
        const jwtToken = generateJWTToken(user.user_id);
        req.jwtToken = jwtToken;
        console.log(`🔑 JWT token generated for new Firebase user: ${user.user_id}`);
        
        // Create initial rewards for new Firebase user
        try {
          await Reward.create({
            userId: user._id,
            user_id: user.user_id,
            points: 0,
            totalEarned: 0,
            totalSpent: 0,
            history: [
              {
                type: 'earned',
                description: 'Welcome bonus for Firebase user registration',
                points: 0,
                status: 'completed',
                date: new Date(),
              },
            ],
          });
          console.log(`✅ Rewards created for new Firebase user: ${user.email} (${user.user_id})`);
        } catch (rewardError) {
          console.error('❌ Failed to create rewards for Firebase user:', rewardError);
          // Don't fail registration if rewards creation fails
        }
      }
    } else {
      // Update last login for existing Firebase user
      user.lastLogin = new Date();
      await user.save();
      
      // Generate JWT token for existing Firebase user as well
      const jwtToken = generateJWTToken(user.user_id);
      req.jwtToken = jwtToken;
      console.log(`🔑 JWT token generated for existing Firebase user: ${user.user_id}`);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
