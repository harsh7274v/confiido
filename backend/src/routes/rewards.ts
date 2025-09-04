import { Router } from 'express';
import Reward from '../models/Reward';
import { protect } from '../middleware/auth';

const router = Router();

// Get current user's rewards
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    console.log('Rewards route - User:', user._id, user.email);
    
    const reward = await Reward.findOne({ userId: user._id });
    console.log('Rewards route - Reward found:', !!reward);

    if (!reward) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reward account not found. Please contact support.' 
      });
    }

    res.json({ success: true, data: reward });
  } catch (error) {
    console.error('Rewards route - Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      details: error.stack
    });
  }
});

// Redeem points (spend)
router.post('/redeem', protect, async (req, res) => {
  try {
    const { points, description, rewardId } = req.body as { points: number; description?: string; rewardId?: string };
    console.log('Redeem request received:', { points, description, rewardId, userId: req.user._id });
    
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Points must be a positive number' });
    }

    const user = req.user;
    const reward = await Reward.findOne({ userId: user._id });
    console.log('Reward found:', !!reward, reward ? { points: reward.points, newUserRewardRedeemed: reward.newUserRewardRedeemed } : null);
    
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward account not found' });
    }

    // Check if this is the new user reward (250 points) - this should ADD points, not spend them
    if (points === 250 && rewardId === '1') {
      if (reward.newUserRewardRedeemed) {
        return res.status(400).json({ success: false, message: 'New user reward can only be redeemed once' });
      }
      // Mark new user reward as redeemed and ADD 250 points
      reward.newUserRewardRedeemed = true;
      reward.points += points;
      reward.totalEarned += points;
      reward.history.unshift({
        type: 'earned',
        description: description || 'New User Welcome Bonus',
        points: points,
        status: 'completed',
        date: new Date(),
      });
    } else {
      // Regular redemption logic for other rewards (including payment discounts)
      if (reward.points < points) {
        return res.status(400).json({ success: false, message: 'Insufficient points' });
      }

      reward.points -= points;
      reward.totalSpent += points;
      reward.history.unshift({
        type: 'spent',
        description: description || (rewardId === 'payment' ? 'Payment discount' : 'Redeemed reward'),
        points: -points,
        status: 'completed',
        date: new Date(),
      });
    }
    await reward.save();
    console.log('Reward saved successfully:', { points: reward.points, newUserRewardRedeemed: reward.newUserRewardRedeemed });

    res.json({ success: true, data: reward });
  } catch (error) {
    console.error('Rewards redeem route - Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      details: error.stack
    });
  }
});

// Deduct loyalty points for payment (specific endpoint for payment processing)
router.post('/deduct-payment', protect, async (req, res) => {
  try {
    const { points, description, sessionId, expertName } = req.body as { 
      points: number; 
      description?: string; 
      sessionId?: string;
      expertName?: string;
    };
    console.log('Payment deduction request received:', { points, description, sessionId, expertName, userId: req.user._id });
    
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Points must be a positive number' });
    }

    const user = req.user;
    const reward = await Reward.findOne({ userId: user._id });
    
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward account not found' });
    }

    // Check if user has sufficient points
    if (reward.points < points) {
      return res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
    }

    // Deduct points for payment
    reward.points -= points;
    reward.totalSpent += points;
    reward.history.unshift({
      type: 'spent',
      description: description || `Payment discount for session with ${expertName || 'expert'}`,
      points: -points,
      status: 'completed',
      date: new Date(),
    });

    await reward.save();
    console.log('Payment deduction successful:', { points: reward.points, deducted: points });

    res.json({ 
      success: true, 
      data: reward,
      message: `Successfully deducted ${points} loyalty points for payment`
    });
  } catch (error) {
    console.error('Payment deduction route - Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      details: error.stack
    });
  }
});

export default router;


