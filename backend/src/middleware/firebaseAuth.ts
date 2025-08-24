import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
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
            user_id: null,
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
      }
    } else {
      // Update last login for existing Firebase user
      user.lastLogin = new Date();
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
