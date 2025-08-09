import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  expertId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  originalPrice?: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // total duration in minutes
  lessons: {
    title: string;
    description: string;
    videoUrl: string;
    duration: number; // in minutes
    isPreview: boolean;
    order: number;
    resources?: {
      title: string;
      type: 'pdf' | 'video' | 'link';
      url: string;
    }[];
  }[];
  thumbnail: string;
  previewVideo?: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    minlength: [100, 'Description must be at least 100 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  lessons: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Lesson title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Lesson description cannot exceed 500 characters']
    },
    videoUrl: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: [1, 'Lesson duration must be at least 1 minute']
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      required: true,
      min: [1, 'Order must be at least 1']
    },
    resources: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        required: true,
        enum: ['pdf', 'video', 'link']
      },
      url: {
        type: String,
        required: true
      }
    }]
  }],
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail is required']
  },
  previewVideo: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0,
    min: [0, 'Enrollment count cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ expertId: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });

export default mongoose.model<ICourse>('Course', courseSchema); 