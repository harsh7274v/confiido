import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import User from '../models/User';
import UserData from '../models/UserData';
import Availability from '../models/Availability'; // Added import for Availability


const router = express.Router();

// ... existing code ...

// @route   GET /api/users/experts
// @desc    Get all expert users with their availability data
// @access  Public
router.get('/experts', async (req, res, next) => {
  try {
    // Find all users with role 'expert'
    const expertUsers = await User.find({ 
      role: 'expert',
      isActive: true 
    }).select('firstName lastName email user_id role isVerified');

    // Get availability data for each expert
    const expertsWithAvailability = await Promise.all(
      expertUsers.map(async (user) => {
        // Find availability data using user_id
        const availability = await Availability.findOne({ 
          user_id: user.user_id 
        });

        return {
          _id: user._id,
          userId: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          user_id: user.user_id,
          title: `${user.firstName} ${user.lastName}`,
          company: 'Independent Consultant',
          expertise: ['Career Guidance', 'Professional Development'],
          description: `Experienced professional offering career guidance and mentorship services.`,
          hourlyRate: 50,
          currency: 'USD',
          rating: 4.5,
          totalReviews: 0,
          isAvailable: availability ? availability.availabilityPeriods.some(p => p.isActive) : false,
          verificationStatus: user.isVerified ? 'verified' : 'pending',
          isFeatured: true,
          hasAvailability: !!availability
        };
      })
    );

    res.json({
      success: true,
      data: { 
        experts: expertsWithAvailability,
        total: expertsWithAvailability.length
      }
    });
  } catch (error) {
    console.error('Error fetching expert users:', error);
    next(error);
  }
});

// Test endpoint to verify backend is working
router.get('/test', (req, res) => {
  res.json({ message: 'Users API is working!' });
});

// @route   GET /api/users/userdata
// @desc    Get current user's profile fields (from users collection)
// @access  Private
router.get('/userdata', protect, async (req, res, next) => {
  try {
    console.log('=== GET USERDATA DEBUG ===');
    console.log('User ID:', req.user._id);
    
    const user = await User.findById(req.user._id).select('-password');
    console.log('Found user:', JSON.stringify(user, null, 2));
    
    const userData = user ? {
      username: user.username || '',
      password: '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0,10) : '',
      profession: user.profession || '',
      phoneNumber: user.phoneNumber || user.phone || '',
      whatsappNumber: user.whatsappNumber || '',
      linkedin: user.socialLinks?.linkedin || ''
    } : null;
    
    console.log('Returning userData:', JSON.stringify(userData, null, 2));
    
    res.json({
      success: true,
      data: { userdata: userData }
    });
  } catch (error) {
    console.error('Error in userdata endpoint:', error);
    next(error);
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please enter a valid phone number'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Country must be at least 2 characters'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City must be at least 2 characters'),
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('Please enter a valid LinkedIn URL'),
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Please enter a valid Twitter URL'),
  body('socialLinks.website')
    .optional()
    .isURL()
    .withMessage('Please enter a valid website URL'),
  // Add validation for userdata fields
  body('userdata.username')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Username cannot exceed 100 characters'),
  body('userdata.gender')
    .optional()
    .isIn(['male', 'female', 'prefer-not-to-say'])
    .withMessage('Gender must be male, female, or prefer-not-to-say'),
  body('userdata.dateOfBirth')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('Date of birth must be a valid date'),
  body('userdata.profession')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Profession cannot exceed 100 characters'),
  body('userdata.phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('userdata.whatsappNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('WhatsApp number cannot exceed 20 characters'),
  body('userdata.linkedin')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('LinkedIn URL cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Save edit profile fields directly into users collection
    if (req.body.userdata) {
      try {
        const profile = req.body.userdata;
        console.log('=== PROFILE UPDATE DEBUG ===');
        console.log('Received profile data:', JSON.stringify(profile, null, 2));
        console.log('User ID from request:', req.user._id);
        console.log('User object:', JSON.stringify(req.user, null, 2));
        
        const update: any = {};
        
        // Handle each field properly - allow empty strings but not undefined
        if (profile.username !== undefined) {
          update.username = profile.username;
          console.log('Setting username:', profile.username);
        }
        if (profile.gender !== undefined) {
          update.gender = profile.gender;
          console.log('Setting gender:', profile.gender);
        }
        if (profile.dateOfBirth !== undefined && profile.dateOfBirth !== '') {
          update.dateOfBirth = new Date(profile.dateOfBirth);
          console.log('Setting dateOfBirth:', profile.dateOfBirth);
        } else if (profile.dateOfBirth === '') {
          update.dateOfBirth = null;
          console.log('Setting dateOfBirth to null');
        }
        if (profile.profession !== undefined) {
          update.profession = profile.profession;
          console.log('Setting profession:', profile.profession);
        }
        if (profile.phoneNumber !== undefined) {
          update.phoneNumber = profile.phoneNumber;
          console.log('Setting phoneNumber:', profile.phoneNumber);
        }
        if (profile.whatsappNumber !== undefined) {
          update.whatsappNumber = profile.whatsappNumber;
          console.log('Setting whatsappNumber:', profile.whatsappNumber);
        }
        if (profile.user_id !== undefined) {
          update.user_id = profile.user_id;
          console.log('Setting user_id:', profile.user_id);
        }
        if (profile.linkedin !== undefined) {
          update.socialLinks = {
            ...(req.user?.socialLinks || {}),
            linkedin: profile.linkedin
          };
          console.log('Setting linkedin:', profile.linkedin);
        }
        
        console.log('Final update object:', JSON.stringify(update, null, 2));
        console.log('User ID for update:', req.user._id);
        
        // First, let's check if the user exists
        const existingUser = await User.findById(req.user._id);
        console.log('Existing user before update:', JSON.stringify(existingUser, null, 2));
        
        if (!existingUser) {
          throw new Error('User not found in database');
        }
        
        const updatedUser = await User.findByIdAndUpdate(
          req.user._id, 
          update, 
          { new: true, runValidators: true }
        );
        
        console.log('Updated user result:', JSON.stringify(updatedUser, null, 2));
        
        if (!updatedUser) {
          throw new Error('User not found or update failed');
        }
        
        console.log('=== PROFILE UPDATE SUCCESS ===');
        
        // Return the updated user data immediately
        return res.json({
          success: true,
          message: 'Profile updated successfully',
          data: { user: updatedUser }
        });
        
      } catch (err) {
        console.error('=== PROFILE UPDATE ERROR ===');
        console.error('Error saving User edit profile fields:', err);
        console.error('Error stack:', err.stack);
        return res.status(500).json({
          success: false,
          error: 'Failed to update profile',
          details: err.message
        });
      }
    }

    // If no userdata was provided, return success
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: req.user }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, [
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be a boolean'),
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be a boolean'),
  body('preferences.privacy.profileVisibility')
    .optional()
    .isIn(['public', 'private', 'connections'])
    .withMessage('Invalid profile visibility setting'),
  body('preferences.privacy.showOnlineStatus')
    .optional()
    .isBoolean()
    .withMessage('Show online status preference must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: req.body.preferences },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', protect, async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 