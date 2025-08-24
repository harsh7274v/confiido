import { Request, Response } from 'express';
import User from '../models/User';
import { Goal } from '../models/Goal';
import { SetupStep } from '../models/SetupStep';
import Booking from '../models/Booking';
import { Message } from '../models/Message';

interface DashboardData {
  user: {
    id: string;
    name: string;
    fullName: string;
    handle: string;
    email: string;
    profileUrl: string;
    userType: 'expert' | 'seeker';
  };
  setupSteps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    action: string;
    icon: string;
  }>;
  goals: Array<{
    id: string;
    text: string;
    completed: boolean;
    createdAt: Date;
  }>;
  stats: {
    totalBookings?: number;
    completedBookings?: number;
    pendingBookings?: number;
    totalEarnings?: number;
    thisMonthEarnings?: number;
    averageRating?: number;
    totalReviews?: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
    amount?: number;
  }>;
  inspiration?: Array<{
    id: string;
    name: string;
    avatar: string;
    handle: string;
  }>;
}

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get setup steps
    const setupSteps = await SetupStep.find({ userId }).sort({ order: 1 });

    // Get goals
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

    // Get stats based on user type
    let stats = {};
    let recentActivity = [];

    if (user.isExpert) {
      // Expert stats
      const bookings = await Booking.find({ expertId: userId });
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const pendingBookings = bookings.filter(b => b.status === 'pending');

      const totalEarnings = completedBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthEarnings = completedBookings
        .filter(b => b.createdAt && new Date(b.createdAt) >= thisMonth)
        .reduce((sum, booking) => sum + (booking.price || 0), 0);

      stats = {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookings.length,
        totalEarnings,
        thisMonthEarnings,
        averageRating: 0, // TODO: Calculate from reviews
        totalReviews: 0 // TODO: Calculate from reviews
      };

      // Recent activity for experts
      const recentBookings = await Booking.find({ expertId: userId })
        .populate('clientId', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      recentActivity = recentBookings.map(booking => ({
        id: booking._id.toString(),
        type: 'booking_received',
        title: `New booking from Client`,
        description: 'Consultation session',
        time: booking.createdAt.toISOString(),
        amount: booking.price
      }));
    } else {
      // Seeker stats
      const bookings = await Booking.find({ clientId: userId });
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const pendingBookings = bookings.filter(b => b.status === 'pending');

      const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthSpent = completedBookings
        .filter(b => b.createdAt && new Date(b.createdAt) >= thisMonth)
        .reduce((sum, booking) => sum + (booking.price || 0), 0);

      stats = {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookings.length,
        totalSpent,
        thisMonthSpent
      };

      // Recent activity for seekers
      const recentBookings = await Booking.find({ clientId: userId })
        .populate('expertId', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      recentActivity = recentBookings.map(booking => ({
        id: booking._id.toString(),
        type: 'session_booked',
        title: `Booked session with Expert`,
        description: 'Consultation session',
        time: booking.createdAt.toISOString(),
        amount: booking.price
      }));
    }

    // Get inspiration profiles (for experts)
    let inspiration = [];
    if (user.isExpert) {
      const topExperts = await User.find({ 
        isExpert: true, 
        _id: { $ne: userId },
        isVerified: true 
      })
      .select('firstName lastName avatar')
      .sort({ createdAt: -1 }) // Sort by creation date since we don't have averageRating
      .limit(3);

      inspiration = topExperts.map(expert => ({
  id: expert._id.toString(),
  name: `${expert.firstName} ${expert.lastName}`
      }));
    }

    const dashboardData: DashboardData = {
      user: {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        fullName: `${user.firstName} ${user.lastName}`,
        handle: user.email.split('@')[0], // Use email prefix as handle for now
        email: user.email,
  // avatar/profile picture removed
        profileUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/${user._id}`,
        userType: user.isExpert ? 'expert' : 'seeker'
      },
      setupSteps: setupSteps.map(step => ({
        id: step._id.toString(),
        title: step.title,
        description: step.description,
        completed: step.completed,
        action: step.action,
        icon: step.icon
      })),
      goals: goals.map(goal => ({
        id: goal._id.toString(),
        text: goal.text,
        completed: goal.completed,
        createdAt: goal.createdAt
      })),
      stats,
      recentActivity,
      inspiration
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data' 
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, displayName, bio, handle } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if handle is already taken
    // TODO: Add handle support to User model
    // if (handle && handle !== user.handle) {
    //   const existingUser = await User.findOne({ handle });
    //   if (existingUser) {
    //     return res.status(400).json({ message: 'Handle already taken' });
    //   }
    // }

    // Update user profile
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    // if (displayName) updateData.displayName = displayName; // TODO: Add displayName support
    if (bio) updateData.bio = bio;
    // if (handle) updateData.handle = handle; // TODO: Add handle support

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { username, currentPassword, newPassword, emailNotifications } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData: any = {};
    
    if (username) updateData.username = username;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    // Handle password change
    if (newPassword && currentPassword) {
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      updateData.password = newPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update settings' 
    });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { text } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!text) {
      return res.status(400).json({ message: 'Goal text is required' });
    }

    const goal = new Goal({
      userId,
      text,
      completed: false
    });

    await goal.save();

    res.status(201).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create goal' 
    });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { goalId } = req.params;
    const { text, completed } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { text, completed },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update goal' 
    });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { goalId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const goal = await Goal.findOneAndDelete({ _id: goalId, userId });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete goal' 
    });
  }
};

export const getGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch goals' 
    });
  }
};

export const getSetupSteps = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const setupSteps = await SetupStep.find({ userId }).sort({ order: 1 });

    res.json({
      success: true,
      data: setupSteps
    });
  } catch (error) {
    console.error('Error fetching setup steps:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch setup steps' 
    });
  }
};

export const updateSetupSteps = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { steps } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Update each step
    const updatePromises = steps.map((step: any) =>
      SetupStep.findOneAndUpdate(
        { _id: step.id, userId },
        { completed: step.completed },
        { new: true }
      )
    );

    const updatedSteps = await Promise.all(updatePromises);

    res.json({
      success: true,
      data: updatedSteps
    });
  } catch (error) {
    console.error('Error updating setup steps:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update setup steps' 
    });
  }
}; 