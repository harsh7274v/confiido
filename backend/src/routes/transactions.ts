import { Router } from 'express';
import Transaction from '../models/Transaction';
import { protect } from '../middleware/auth';

const router = Router();

// GET /api/transactions/user - fetch transactions for logged-in user
router.get('/user', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
  const transactions = await Transaction.find({ userId });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

export default router;
