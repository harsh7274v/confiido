import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firebaseUid?: string;
  user_id?: string; // Unique 4-digit user ID
  username?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  name?: string; // For Firebase display name
  // avatar/profile picture field removed
  phone?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  age?: number;
  category?: 'student' | 'working_professional';
  profession?: string;
  domain?: string;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
  bio?: string;
  role?: 'user' | 'expert' | 'admin';
  isExpert: boolean;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'connections';
      showOnlineStatus: boolean;
    };
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    trim: true,
    maxlength: [100, 'Username cannot exceed 100 characters'],
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  profession: {
    type: String,
    trim: true,
    maxlength: [100, 'Profession cannot exceed 100 characters'],
    default: null
  },
  whatsappNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'WhatsApp number cannot exceed 20 characters'],
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    default: null
  },
  user_id: {
    type: String,
    unique: true,
    minlength: 4,
    maxlength: 4,
    sparse: true // allow null for legacy users
  },
  firebaseUid: {
    type: String,
    sparse: true, // Allow null/undefined values, but enforce uniqueness when present
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function(this: IUser) {
      // Password is required only if firebaseUid is not present (traditional signup)
      return !this.firebaseUid;
    },
    minlength: [8, 'Password must be at least 8 characters long']
  },
  firstName: {
    type: String,
    required: function(this: IUser) {
      // First name required only if name (from Firebase) is not present
      return !this.name;
    },
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: function(this: IUser) {
      // Last name required only if name (from Firebase) is not present
      return !this.name;
    },
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say']
  },
  age: {
    type: Number,
    min: [16, 'Age must be at least 16'],
    max: [100, 'Age cannot exceed 100']
  },
  category: {
    type: String,
    enum: ['student', 'working_professional'],
    trim: true
  },
  domain: {
    type: String,
    trim: true,
    maxlength: [100, 'Domain cannot exceed 100 characters']
  },
  location: {
    country: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  role: {
    type: String,
    enum: ['user', 'expert', 'admin'],
    default: 'user'
  },
  isExpert: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public'
      },
      showOnlineStatus: {
        type: Boolean,
        default: true
      }
    }
  },
  socialLinks: {
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Index for better query performance (email index is created automatically by unique: true)
userSchema.index({ isExpert: 1 });
userSchema.index({ isVerified: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);