import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import PaymentAccount from '../models/PaymentAccount';
import Expert from '../models/Expert';

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for booking/course/webinar (Direct to mentor)
// @access  Private
router.post('/create-payment-intent', protect, [
  body('type')
    .isIn(['booking', 'course', 'webinar', 'bundle', 'digital_product', 'priority_dm'])
    .withMessage('Invalid payment type'),
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('expertId')
    .isMongoId()
    .withMessage('Valid expert ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, itemId, amount, currency = 'USD', expertId } = req.body;

    // Get expert's payment account
    const paymentAccount = await PaymentAccount.findOne({
      expertId,
      isVerified: true,
      isActive: true
    });

    if (!paymentAccount) {
      return res.status(400).json({
        success: false,
        message: 'Expert payment account not set up or not verified'
      });
    }

    // Create payment intent that goes directly to expert
    // This is where you'd integrate with Stripe Connect, PayPal, etc.
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Convert to cents for Stripe
      currency,
      type,
      itemId,
      expertId,
      expertAccountId: paymentAccount.stripeAccountId || paymentAccount.paypalMerchantId,
      commissionRate: 0, // 0% commission as per requirement
      netAmount: amount, // Full amount goes to expert
      status: 'requires_payment_method'
    };

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        expertAccountId: paymentIntent.expertAccountId,
        commissionRate: paymentIntent.commissionRate,
        netAmount: paymentIntent.netAmount
      },
      message: 'Payment intent created - funds will go directly to expert'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/confirm
// @desc    Confirm payment (Direct to mentor)
// @access  Private
router.post('/confirm', protect, [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required'),
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

    const { paymentIntentId, paymentMethodId } = req.body;

    // Here you would confirm the payment with your payment provider
    // ensuring the money goes directly to the expert's account
    
    // For demo purposes, we'll simulate a successful payment
    const paymentResult = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 5000, // $50.00
      currency: 'usd',
      expertAccountId: 'acct_expert_123',
      transferId: 'tr_direct_transfer_123',
      commissionAmount: 0, // No commission taken
      netAmount: 5000, // Full amount to expert
      processed_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: paymentResult,
      message: 'Payment confirmed - funds transferred directly to expert'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/payments/account
// @desc    Get expert's payment account details
// @access  Private (Expert only)
router.get('/account', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const paymentAccount = await PaymentAccount.findOne({ expertId: expert._id });

    res.json({
      success: true,
      data: paymentAccount || {},
      message: paymentAccount ? 'Payment account found' : 'No payment account set up'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/account/setup
// @desc    Set up expert payment account for direct payments
// @access  Private (Expert only)
router.post('/account/setup', protect, [
  body('accountType')
    .isIn(['stripe', 'paypal', 'bank_transfer', 'upi', 'crypto'])
    .withMessage('Invalid account type'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'])
    .withMessage('Invalid currency')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    // Check if payment account already exists
    let paymentAccount = await PaymentAccount.findOne({ expertId: expert._id });

    if (paymentAccount) {
      return res.status(400).json({
        success: false,
        message: 'Payment account already exists'
      });
    }

    // Create new payment account
    paymentAccount = new PaymentAccount({
      userId: req.user.id,
      expertId: expert._id,
      accountType: req.body.accountType,
      currency: req.body.currency || 'USD',
      commissionRate: 0, // 0% commission
      ...req.body
    });

    await paymentAccount.save();

    res.status(201).json({
      success: true,
      data: paymentAccount,
      message: 'Payment account created successfully. Direct payments enabled with 0% commission.'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/payments/account/update
// @desc    Update expert payment account
// @access  Private (Expert only)
router.put('/account/update', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const paymentAccount = await PaymentAccount.findOne({ expertId: expert._id });
    if (!paymentAccount) {
      return res.status(404).json({
        success: false,
        message: 'Payment account not found'
      });
    }

    // Ensure commission rate stays at 0%
    if (req.body.commissionRate && req.body.commissionRate > 0) {
      req.body.commissionRate = 0;
    }

    const updatedAccount = await PaymentAccount.findByIdAndUpdate(
      paymentAccount._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedAccount,
      message: 'Payment account updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/payout
// @desc    Request payout (for testing - normally automatic)
// @access  Private (Expert only)
router.post('/payout', protect, [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least $1')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const paymentAccount = await PaymentAccount.findOne({ 
      expertId: expert._id,
      isVerified: true,
      isActive: true 
    });

    if (!paymentAccount) {
      return res.status(400).json({
        success: false,
        message: 'Payment account not set up or not verified'
      });
    }

    // Check minimum payout amount
    if (req.body.amount < paymentAccount.minimumPayout) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is ${paymentAccount.currency} ${paymentAccount.minimumPayout}`
      });
    }

    // Simulate payout processing
    const payout = {
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: req.body.amount,
      currency: paymentAccount.currency,
      status: 'pending',
      estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      accountType: paymentAccount.accountType,
      commissionDeducted: 0, // No commission
      netAmount: req.body.amount
    };

    res.json({
      success: true,
      data: payout,
      message: 'Payout initiated - full amount will be transferred (no commission deducted)'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle payment provider webhooks
// @access  Public
router.post('/webhook', async (req, res, next) => {
  try {
    // Handle webhooks from payment providers (Stripe, PayPal, etc.)
    // Verify webhook signature and process events
    
    const event = req.body;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment successful - money already went directly to expert
        console.log('Payment succeeded:', event.data.object.id);
        break;
        
      case 'transfer.created':
        // Direct transfer to expert account
        console.log('Transfer to expert:', event.data.object.id);
        break;
        
      case 'payout.paid':
        // Payout completed to expert
        console.log('Payout completed:', event.data.object.id);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/payments/earnings
// @desc    Get expert's earnings summary
// @access  Private (Expert only)
router.get('/earnings', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    // This would typically come from your payment provider or database
    const earnings = {
      totalEarnings: 12500.00,
      currentBalance: 2300.00,
      pendingBalance: 850.00,
      lastPayout: {
        amount: 1500.00,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      currency: 'USD',
      commissionRate: 0, // 0% commission
      payoutSchedule: 'weekly',
      nextPayoutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    };

    res.json({
      success: true,
      data: earnings,
      message: 'Earnings summary - 100% of payments go directly to you'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 