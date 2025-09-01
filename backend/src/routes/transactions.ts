import { Router } from 'express';
import Transaction from '../models/Transaction';
import { protect } from '../middleware/auth';

const router = Router();

// GET /api/transactions/user - fetch transactions for logged-in user
router.get('/user', protect, async (req, res, next) => {
  try {
  console.log('[DEBUG] /api/transactions/user called');
  console.log('[DEBUG] req.user:', req.user);
  const user_id = req.user.user_id;
  console.log('[DEBUG] user_id used for query:', user_id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Query transactions by user_id
    const [transactions, total] = await Promise.all([
      Transaction.find({ user_id })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Transaction.countDocuments({ user_id })
    ]);

    // Calculate stats
    const completed = await Transaction.countDocuments({ user_id, status: 'completed' });
    const failed = await Transaction.countDocuments({ user_id, status: 'failed' });
    const pending = await Transaction.countDocuments({ user_id, status: 'pending' });
    const totalSpentAgg = await Transaction.aggregate([
      { $match: { user_id, status: 'completed' } },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]);
    const totalSpent = totalSpentAgg[0]?.totalSpent || 0;

    res.json({
      transactions,
      stats: { total, completed, failed, pending, totalSpent },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
