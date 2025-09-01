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
    const { points, description } = req.body as { points: number; description?: string };
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Points must be a positive number' });
    }

    const user = req.user;
    const reward = await Reward.findOne({ userId: user._id });
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward account not found' });
    }

    if (reward.points < points) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }

    reward.points -= points;
    reward.totalSpent += points;
    reward.history.unshift({
      type: 'spent',
      description: description || 'Redeemed reward',
      points: -points,
      status: 'completed',
      date: new Date(),
    });
    await reward.save();

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

export default router;


