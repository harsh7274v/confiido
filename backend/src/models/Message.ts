import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  
  // For priority DM feature
  isPriority: boolean;
  priorityLevel: 'normal' | 'high' | 'urgent';
  
  // File attachments
  attachments?: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }[];
  
  // Message status
  status: 'sent' | 'delivered' | 'read';
  readAt?: Date;
  deliveredAt?: Date;
  
  // Reply functionality
  replyTo?: mongoose.Types.ObjectId;
  
  // Message reactions
  reactions?: {
    userId: mongoose.Types.ObjectId;
    reaction: string; // emoji
    createdAt: Date;
  }[];
  
  // Auto-delete for temporary messages
  expiresAt?: Date;
  
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'direct' | 'group' | 'priority_dm';
  
  // For priority DM
  isPriorityConversation: boolean;
  priorityPrice?: number; // Price for priority access
  priorityDuration?: number; // Duration in days
  priorityExpiresAt?: Date;
  
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  
  // Group chat details
  name?: string;
  description?: string;
  avatar?: string;
  adminId?: mongoose.Types.ObjectId;
  
  // Conversation settings
  settings: {
    notifications: boolean;
    autoDeleteAfter?: number; // Days
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
  };
  
  // Muted participants
  mutedBy?: {
    userId: mongoose.Types.ObjectId;
    mutedUntil?: Date;
  }[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video', 'system'],
    default: 'text'
  },
  isPriority: {
    type: Boolean,
    default: false
  },
  priorityLevel: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  attachments: [{
    url: String,
    fileName: String,
    fileSize: Number,
    mimeType: String
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: Date,
  deliveredAt: Date,
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Conversation Schema
const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group', 'priority_dm'],
    default: 'direct'
  },
  isPriorityConversation: {
    type: Boolean,
    default: false
  },
  priorityPrice: Number,
  priorityDuration: Number,
  priorityExpiresAt: Date,
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: Date,
  name: String,
  description: String,
  avatar: String,
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    autoDeleteAfter: Number,
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowVoiceMessages: {
      type: Boolean,
      default: true
    }
  },
  mutedBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedUntil: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ isPriority: 1 });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isPriorityConversation: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
