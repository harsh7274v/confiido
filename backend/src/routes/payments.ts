import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import PaymentAccount from '../models/PaymentAccount';
import Expert from '../models/Expert';
import Transaction from '../models/Transaction';
import User from '../models/User';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to generate unique transaction ID
const generateUniqueTransactionId = (razorpayPaymentId?: string): string => {
  if (razorpayPaymentId && razorpayPaymentId.trim()) {
    return razorpayPaymentId;
  }
  // Generate a unique ID with timestamp and random string
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `txn_${timestamp}_${randomStr}`;
};

// Initialize Razorpay with fallback to test credentials for development
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_key'
});

// @route   POST /api/payments/create-razorpay-order
// @desc    Create Razorpay order for payment (Production Ready with Test Key Support)
// @access  Private
router.post('/create-razorpay-order', protect, [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0.01) {
        throw new Error('Amount must be at least 0.01');
      }
      return true;
    }),
  body('currency')
    .optional()
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD'),
  body('receipt')
    .optional()
    .isString()
    .isLength({ max: 40 })
    .withMessage('Receipt must be a string with maximum 40 characters'),
  body('notes')
    .optional()
    .isObject()
    .withMessage('Notes must be an object')
], async (req, res, next) => {
  try {
    // Log order creation with key type
    const keyType = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'LIVE' : 'TEST';
    console.log(`[RAZORPAY] Creating order for user ${req.user.email}, amount: ${req.body.amount}, key: ${keyType}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if Razorpay is properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('[RAZORPAY] Using fallback test credentials');
    }

    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    // Convert amount to paise (smallest currency unit for INR)
    const amountInPaise = Math.round(amount * 100);

    // Ensure receipt is within Razorpay's 40 character limit
    let finalReceipt = receipt || `rcpt_${Date.now().toString().slice(-6)}`;
    if (finalReceipt.length > 40) {
      finalReceipt = `rcpt_${Date.now().toString().slice(-6)}`;
    }

    const options = {
      amount: amountInPaise,
      currency,
      receipt: finalReceipt,
      notes: notes || {}
    };

    console.log('[RAZORPAY] Creating order with options:', options);

    // Create Razorpay order
    const order = await razorpay.orders.create(options);

    // Log successful order creation
    console.log(`[RAZORPAY] Order created successfully: ${order.id}`);

    res.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at
      },
      message: 'Razorpay order created successfully'
    });
  } catch (error) {
    console.error('[RAZORPAY] Order creation error:', error);
    next(error);
  }
});

// @route   POST /api/payments/verify-razorpay-payment
// @desc    Verify Razorpay payment signature (Production Ready)
// @access  Private
router.post('/verify-razorpay-payment', protect, [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Create signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret_key')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is authentic - update database
      console.log(`[RAZORPAY] Payment verified successfully: ${razorpay_payment_id}`);
      
      try {
        // Get user details
        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Get payment details from Razorpay
        let payment, order;
        try {
          payment = await razorpay.payments.fetch(razorpay_payment_id);
          order = await razorpay.orders.fetch(razorpay_order_id);
        } catch (razorpayError: any) {
          console.error('[RAZORPAY] Error fetching payment/order details:', razorpayError);
          return res.status(400).json({
            success: false,
            message: 'Failed to fetch payment details from Razorpay',
            error: 'RAZORPAY_API_ERROR',
            details: razorpayError.message
          });
        }
        
        // Convert amount from paise to rupees (ensure it's a number)
        const paymentAmount = typeof payment.amount === 'number' ? payment.amount : parseInt(payment.amount.toString());
        const amountInRupees = paymentAmount / 100;
        
        // Validate payment data
        if (!paymentAmount || paymentAmount <= 0) {
          console.error(`[RAZORPAY] Invalid payment amount: ${paymentAmount}`);
          return res.status(400).json({
            success: false,
            message: 'Invalid payment amount',
            error: 'INVALID_AMOUNT'
          });
        }

        // Validate required payment fields
        if (!razorpay_payment_id || !razorpay_order_id) {
          console.error(`[RAZORPAY] Missing required payment fields - payment_id: ${razorpay_payment_id}, order_id: ${razorpay_order_id}`);
          return res.status(400).json({
            success: false,
            message: 'Missing required payment information',
            error: 'MISSING_PAYMENT_DATA'
          });
        }

        if (!payment.currency) {
          console.error(`[RAZORPAY] Missing payment currency`);
          return res.status(400).json({
            success: false,
            message: 'Payment currency is missing',
            error: 'MISSING_CURRENCY'
          });
        }
        
        // Check if transaction already exists for this payment
        const existingTransaction = await Transaction.findOne({ 
          $or: [
            { razorpayPaymentId: razorpay_payment_id },
            { transactionId: razorpay_payment_id }
          ]
        });
        
        if (existingTransaction) {
          console.log(`[RAZORPAY] Transaction already exists for payment: ${razorpay_payment_id}`);
          return res.json({
            success: true,
            data: {
              order_id: razorpay_order_id,
              payment_id: razorpay_payment_id,
              transaction_id: existingTransaction._id,
              verified: true
            },
            message: 'Payment already processed'
          });
        }
        
        // Generate a unique transaction ID using utility function
        const uniqueTransactionId = generateUniqueTransactionId(razorpay_payment_id);
        
        // Create transaction record with guaranteed unique transactionId
        const transaction = new Transaction({
          user_id: user.user_id || user._id.toString().slice(-4), // Use 4-digit user_id or last 4 digits of _id
          type: 'booking', // Default type, can be updated based on context
          itemId: new mongoose.Types.ObjectId(), // This should be the booking/session ID - TODO: Link to actual booking
          amount: amountInRupees, // Convert from paise to rupees
          currency: payment.currency,
          status: 'completed',
          paymentMethod: 'razorpay',
          transactionId: uniqueTransactionId, // Always ensure we have a non-null unique transactionId
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          description: `Payment for expert consultation - Order: ${razorpay_order_id}`,
          metadata: {
            sessionTitle: 'Expert Consultation Session',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            userEmail: user.email,
            userName: `${user.firstName} ${user.lastName}`,
            paymentMethod: payment.method || 'unknown',
            paymentStatus: payment.status || 'unknown',
            paymentCreatedAt: payment.created_at,
            orderAmount: typeof order.amount === 'number' ? order.amount : parseInt(order.amount.toString()),
            orderCurrency: order.currency,
            orderReceipt: order.receipt,
            // Additional metadata for better tracking
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: razorpay_signature,
            timestamp: new Date().toISOString()
          },
          completedAt: new Date()
        });

        try {
          await transaction.save();
          console.log(`[RAZORPAY] Transaction saved successfully: ${transaction._id}`);
          
          res.json({
            success: true,
            data: {
              order_id: razorpay_order_id,
              payment_id: razorpay_payment_id,
              transaction_id: transaction._id,
              verified: true
            },
            message: 'Payment verified and transaction recorded successfully'
          });
        } catch (saveError: any) {
          console.error('[RAZORPAY] Transaction save error:', saveError);
          
          // Handle duplicate key error specifically
          if (saveError.code === 11000) {
            console.log(`[RAZORPAY] Duplicate key error detected, searching for existing transaction`);
            
            // Search for existing transaction by multiple criteria
            const existingTransaction = await Transaction.findOne({ 
              $or: [
                { razorpayPaymentId: razorpay_payment_id },
                { transactionId: uniqueTransactionId },
                { razorpayOrderId: razorpay_order_id }
              ]
            });
            
            if (existingTransaction) {
              console.log(`[RAZORPAY] Found existing transaction: ${existingTransaction._id}`);
              return res.json({
                success: true,
                data: {
                  order_id: razorpay_order_id,
                  payment_id: razorpay_payment_id,
                  transaction_id: existingTransaction._id,
                  verified: true
                },
                message: 'Payment verified (existing transaction found)'
              });
            } else {
              // If no existing transaction found but duplicate key error, try with a new unique ID
              console.log(`[RAZORPAY] No existing transaction found, retrying with new unique ID`);
              const retryTransactionId = generateUniqueTransactionId();
              transaction.transactionId = retryTransactionId;
              
              try {
                await transaction.save();
                console.log(`[RAZORPAY] Transaction saved with retry ID: ${transaction._id}`);
                
                return res.json({
                  success: true,
                  data: {
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id,
                    transaction_id: transaction._id,
                    verified: true
                  },
                  message: 'Payment verified and transaction recorded successfully'
                });
              } catch (retryError: any) {
                console.error('[RAZORPAY] Retry save also failed:', retryError);
                throw retryError;
              }
            }
          }
          
          // Re-throw the error if it's not a duplicate key error
          throw saveError;
        }
      } catch (dbError: any) {
        
        console.error('[RAZORPAY] Database error:', dbError);
        
        // Provide more specific error messages
        if (dbError.code === 11000) {
          console.error('[RAZORPAY] Duplicate key error:', dbError.keyValue);
          res.status(409).json({
            success: false,
            message: 'Transaction already exists for this payment',
            error: 'DUPLICATE_TRANSACTION'
          });
        } else if (dbError.name === 'ValidationError') {
          console.error('[RAZORPAY] Validation error:', dbError.errors);
          res.status(400).json({
            success: false,
            message: 'Invalid transaction data',
            error: 'VALIDATION_ERROR',
            details: dbError.errors
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Payment verified but failed to save transaction record',
            error: 'DATABASE_ERROR',
            details: dbError.message
          });
        }
      }
    } else {
      console.error(`[RAZORPAY] Payment verification failed: ${razorpay_payment_id}`);
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('[RAZORPAY] Payment verification error:', error);
    next(error);
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Razorpay webhooks (Production Ready)
// @access  Public
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    
    // Verify webhook signature
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret')
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('[RAZORPAY] Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
      
      // Handle webhook events
      const event = req.body;
      console.log(`[RAZORPAY] Webhook received: ${event.event}`);
      
      switch (event.event) {
        case 'payment.captured':
          // Handle successful payment
          console.log(`[RAZORPAY] Payment captured: ${event.payload.payment.entity.id}`);
          // TODO: Update booking status, send confirmation email, etc.
          break;
          
        case 'payment.failed':
          // Handle failed payment
          console.log(`[RAZORPAY] Payment failed: ${event.payload.payment.entity.id}`);
          // TODO: Update booking status, notify user, etc.
          break;
          
        case 'order.paid':
          // Handle successful order payment
          console.log(`[RAZORPAY] Order paid: ${event.payload.order.entity.id}`);
          // TODO: Update booking status, create transaction record, etc.
          break;
          
        default:
          console.log(`[RAZORPAY] Unhandled event: ${event.event}`);
      }
      
      return res.json({ received: true });
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('[RAZORPAY] Webhook error:', error);
    next(error);
  }
});

// @route   GET /api/payments/transactions
// @desc    Get user's transaction history with pagination and filtering
// @access  Private
router.get('/transactions', protect, [
  param('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  param('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  param('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { 
      user_id: user.user_id || user._id.toString().slice(-4) 
    };
    
    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('expertId', 'userId firstName lastName')
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Transaction history retrieved successfully'
    });
  } catch (error) {
    console.error('[TRANSACTIONS] Error fetching transactions:', error);
    next(error);
  }
});

// @route   GET /api/payments/transactions/:id
// @desc    Get specific transaction details
// @access  Private
router.get('/transactions/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const transaction = await Transaction.findOne({ 
      _id: id,
      user_id: user.user_id || user._id.toString().slice(-4) 
    }).populate('expertId', 'userId firstName lastName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction details retrieved successfully'
    });
  } catch (error) {
    console.error('[TRANSACTIONS] Error fetching transaction:', error);
    next(error);
  }
});

// @route   GET /api/payments/transactions/stats
// @desc    Get user's transaction statistics
// @access  Private
router.get('/transactions/stats', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user.user_id || user._id.toString().slice(-4);
    
    // Get transaction statistics
    const stats = await Transaction.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          refundedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      completedAmount: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
      refundedTransactions: 0
    };

    res.json({
      success: true,
      data: result,
      message: 'Transaction statistics retrieved successfully'
    });
  } catch (error) {
    console.error('[TRANSACTIONS] Error fetching transaction stats:', error);
    next(error);
  }
});

export default router;