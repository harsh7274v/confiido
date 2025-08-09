import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentAccount extends Document {
  userId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  accountType: 'stripe' | 'paypal' | 'bank_transfer' | 'upi' | 'crypto';
  
  // Stripe Connect for direct payments
  stripeAccountId?: string;
  stripeAccountStatus?: 'pending' | 'active' | 'restricted' | 'inactive';
  
  // PayPal
  paypalEmail?: string;
  paypalMerchantId?: string;
  
  // Bank Transfer
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    accountHolderName: string;
    swiftCode?: string;
    iban?: string;
  };
  
  // UPI (for Indian market)
  upiId?: string;
  
  // Crypto wallets
  cryptoWallets?: {
    bitcoin?: string;
    ethereum?: string;
    usdt?: string;
  };
  
  isVerified: boolean;
  isActive: boolean;
  
  // KYC information
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  kycDocuments?: {
    idType: 'passport' | 'driving_license' | 'national_id';
    idNumber: string;
    idDocument?: string; // URL to uploaded document
    addressDocument?: string; // URL to address proof
  };
  
  // Payout preferences
  payoutSchedule: 'instant' | 'daily' | 'weekly' | 'monthly';
  minimumPayout: number;
  currency: string;
  
  // Commission settings (0% as per requirement)
  commissionRate: number; // Should be 0
  
  // Balance for payments
  balance: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const paymentAccountSchema = new Schema<IPaymentAccount>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  accountType: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'upi', 'crypto'],
    required: true
  },
  stripeAccountId: String,
  stripeAccountStatus: {
    type: String,
    enum: ['pending', 'active', 'restricted', 'inactive']
  },
  paypalEmail: String,
  paypalMerchantId: String,
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    bankName: String,
    accountHolderName: String,
    swiftCode: String,
    iban: String
  },
  upiId: String,
  cryptoWallets: {
    bitcoin: String,
    ethereum: String,
    usdt: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_submitted'],
    default: 'not_submitted'
  },
  kycDocuments: {
    idType: {
      type: String,
      enum: ['passport', 'driving_license', 'national_id']
    },
    idNumber: String,
    idDocument: String,
    addressDocument: String
  },
  payoutSchedule: {
    type: String,
    enum: ['instant', 'daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  minimumPayout: {
    type: Number,
    default: 25
  },
  currency: {
    type: String,
    default: 'USD'
  },
  commissionRate: {
    type: Number,
    default: 0, // 0% commission as per requirement
    min: 0,
    max: 0
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
paymentAccountSchema.index({ userId: 1 });
paymentAccountSchema.index({ expertId: 1 });
paymentAccountSchema.index({ stripeAccountId: 1 });

export default mongoose.model<IPaymentAccount>('PaymentAccount', paymentAccountSchema);
