import { Router } from 'express';
import Transaction from '../models/Transaction';
import Booking from '../models/Booking';
import { protect } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

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

    // Query transactions by user_id - for now, sort by createdAt (most recent first)
    // TODO: Implement session createdTime sorting once we have proper session-transaction relationships
    const [transactions, total] = await Promise.all([
      Transaction.find({ user_id })
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ user_id })
    ]);

    // Debug: Log transaction sorting info
    console.log(`[DEBUG] Found ${transactions.length} transactions for user ${user_id}`);
    if (transactions.length > 0) {
      console.log('[DEBUG] First transaction:', {
        id: transactions[0]._id,
        createdAt: transactions[0].createdAt,
        type: transactions[0].type
      });
      console.log('[DEBUG] Last transaction:', {
        id: transactions[transactions.length - 1]._id,
        createdAt: transactions[transactions.length - 1].createdAt,
        type: transactions[transactions.length - 1].type
      });
    }

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

// PUT /api/transactions/:id/complete - complete a pending transaction
router.put('/:id/complete', protect, [
  body('paymentMethodId')
    .optional()
    .isString()
    .withMessage('Payment method ID must be a string')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { paymentMethodId } = req.body;
    const user_id = req.user.user_id;

    // Find the transaction
    const transaction = await Transaction.findOne({ 
      _id: id, 
      user_id 
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if transaction is already completed
    if (transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is already completed'
      });
    }

    // Check if transaction is pending
    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be completed'
      });
    }

    // Update transaction status to completed
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        completedAt: new Date(),
        ...(paymentMethodId && { paymentIntentId: paymentMethodId })
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Transaction completed successfully',
      data: updatedTransaction
    });
  } catch (err) {
    next(err);
  }
});

export default router;
