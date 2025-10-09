import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import User from '../models/User';
import Reward from '../models/Reward';
import { auth } from '../config/firebase';
import { generateUniqueUserId, ensureUserId } from '../utils/userIdGenerator';
import { verifyJWTToken } from '../utils/jwtGenerator';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Enhanced debugging
  console.log('\n🔍 AUTH MIDDLEWARE DEBUG:');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Authorization header:', req.headers.authorization);
  console.log('All headers:', req.headers);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log('✅ Bearer token extracted:', token ? `${token.substring(0, 20)}...` : 'null');
  } else {
    console.log('❌ No Bearer token found in Authorization header');
    console.log('Authorization header value:', req.headers.authorization);
    console.log('Starts with Bearer:', req.headers.authorization?.startsWith('Bearer'));
  }

  console.log('Auth middleware - Token:', token);
  console.log('Auth middleware - NODE_ENV:', process.env.NODE_ENV);

  if (!token) {
    console.log('❌ No token provided - rejecting request');
    next(new AppError('Not authorized to access this route', 401));
    return;
  }

  try {
    let user;

    console.log('Processing authentication token');
    
    // First, try to verify as Firebase token
    try {
        const decodedToken = await auth.verifyIdToken(token);
        
        // Find user by Firebase UID first
        user = await User.findOne({ firebaseUid: decodedToken.uid });
        
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
            // Generate unique user_id for new Firebase user
            const userId = await generateUniqueUserId();
            
            user = new User({
              firebaseUid: decodedToken.uid,
              user_id: userId,
              email: decodedToken.email,
              name: decodedToken.name,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              avatar: decodedToken.picture,
              role: 'user',
              isVerified: true, // Firebase users are verified
              isActive: true,
              lastLogin: new Date()
            });
            await user.save();
            console.log(`Firebase user created successfully with user_id: ${userId}`);
            
            // Create initial rewards for the new Firebase user (same as traditional users)
            try {
              await Reward.create({
                userId: user._id,
                user_id: user.user_id, // Use the actual 4-digit user_id
                points: 0,
                totalEarned: 0,
                totalSpent: 0,
                history: [
                  {
                    type: 'earned',
                    description: 'Welcome bonus for new user registration',
                    points: 0,
                    status: 'completed',
                    date: new Date(),
                  },
                ],
              });
              console.log(`✅ Rewards created for new Firebase user: ${user.email} (${user.user_id})`);
            } catch (rewardError) {
              console.error('Failed to create rewards for new Firebase user:', rewardError);
              // Don't fail auth if rewards creation fails
            }
          }
        } else {
          // Update last login for existing Firebase user
          user.lastLogin = new Date();
          // Ensure user has userId
          await ensureUserId(user);
          await user.save();
        }
      } catch (firebaseError) {
        console.log('Firebase verification failed, trying JWT');
        // If Firebase verification fails, try custom JWT token
        try {
          // Try new JWT format first (user_id based)
          const userIdFromToken = verifyJWTToken(token);
          if (userIdFromToken) {
            console.log('JWT user_id found:', userIdFromToken);
            // Find user by user_id
            user = await User.findOne({ user_id: userIdFromToken }).select('-password');
            console.log('JWT user found by user_id:', user ? 'yes' : 'no');
          } else {
            // Try legacy JWT format (MongoDB _id based)
            const tokenParts = token.split('_');
            if (tokenParts.length < 2) {
              throw new Error('Invalid token format');
            }
            const decoded = { id: tokenParts[1] };
            console.log('Legacy JWT decoded ID:', decoded.id);

            // Get user from token
            user = await User.findById(decoded.id).select('-password');
            console.log('Legacy JWT user found:', user ? 'yes' : 'no');
          }
        } catch (jwtError) {
          console.log('JWT verification also failed');
          // Both Firebase and JWT verification failed
          next(new AppError('Not authorized to access this route', 401));
          return;
        }
      }

    if (!user) {
      console.log('No user found');
      next(new AppError('User not found', 404));
      return;
    }

    if (!user.isActive) {
      console.log('User is not active');
      next(new AppError('User account is deactivated', 401));
      return;
    }

    console.log('Authentication successful for user:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth middleware error:', error);
    next(new AppError('Not authorized to access this route', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Not authorized to access this route', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next();
    return;
  }

  try {
    let user;

    // Try Firebase token first
    try {
      const decodedToken = await auth.verifyIdToken(token);
      user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      if (user && user.isActive) {
        // Ensure Firebase user has user_id
        await ensureUserId(user);
        req.user = user;
      }
    } catch (firebaseError) {
      // Try custom JWT token
      try {
        // Try new JWT format first (user_id based)
        const userIdFromToken = verifyJWTToken(token);
        if (userIdFromToken) {
          console.log('OptionalAuth JWT user_id found:', userIdFromToken);
          user = await User.findOne({ user_id: userIdFromToken }).select('-password');
          
          if (user && user.isActive) {
            req.user = user;
          }
        } else {
          // Try legacy JWT format (MongoDB _id based)
          const tokenParts = token.split('_');
          if (tokenParts.length < 2) {
            throw new Error('Invalid token format');
          }
          const decoded = { id: tokenParts[1] };
          user = await User.findById(decoded.id).select('-password');

          if (user && user.isActive) {
            // Ensure JWT user has user_id
            await ensureUserId(user);
            req.user = user;
          }
        }
      } catch (jwtError) {
        // Both failed, continue without user
      }
    }

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
}; 