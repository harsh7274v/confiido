import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Message, Conversation } from '../models/Message';
import User from '../models/User';
import PaymentAccount from '../models/PaymentAccount';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'firstName lastName email avatar')
    .populate('lastMessage')
    .populate('adminId', 'firstName lastName email')
    .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get messages for a specific conversation
// @access  Private
router.get('/conversations/:conversationId', protect, async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
      $or: [
        { deletedBy: { $ne: userId } },
        { deletedBy: { $exists: false } }
      ]
    })
    .populate('senderId', 'firstName lastName email avatar')
    .populate('receiverId', 'firstName lastName email avatar')
    .populate('replyTo')
    .populate('reactions.userId', 'firstName lastName email avatar')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: { messages, conversation }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', protect, [
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('type')
    .isIn(['direct', 'group', 'priority_dm'])
    .withMessage('Invalid conversation type'),
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string'),
  body('isPriorityConversation')
    .optional()
    .isBoolean()
    .withMessage('isPriorityConversation must be a boolean'),
  body('priorityPrice')
    .optional()
    .isNumeric()
    .withMessage('Priority price must be a number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { participantIds, type, name, description, isPriorityConversation, priorityPrice, priorityDuration } = req.body;
    const userId = req.user.id;

    // Add current user to participants
    const allParticipants = [...new Set([userId, ...participantIds])];

    // Check if direct conversation already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants },
        isActive: true
      });

      if (existingConversation) {
        return res.json({
          success: true,
          data: { conversation: existingConversation }
        });
      }
    }

    // For priority DMs, verify payment
    if (isPriorityConversation && priorityPrice) {
      const userPaymentAccount = await PaymentAccount.findOne({ userId });
      if (!userPaymentAccount || userPaymentAccount.balance < priorityPrice) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance for priority conversation'
        });
      }
    }

    const conversation = new Conversation({
      participants: allParticipants,
      type,
      name,
      description,
      isPriorityConversation,
      priorityPrice,
      priorityDuration,
      priorityExpiresAt: priorityDuration ? new Date(Date.now() + priorityDuration * 24 * 60 * 60 * 1000) : undefined,
      adminId: type === 'group' ? userId : undefined,
      settings: {
        notifications: true,
        allowFileSharing: true,
        allowVoiceMessages: true
      }
    });

    await conversation.save();

    // Deduct payment for priority conversation
    if (isPriorityConversation && priorityPrice) {
      await PaymentAccount.findOneAndUpdate(
        { userId },
        { $inc: { balance: -priorityPrice } }
      );
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName email avatar')
      .populate('adminId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: { conversation: populatedConversation }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, upload.array('attachments', 5), [
  body('conversationId')
    .notEmpty()
    .withMessage('Conversation ID is required'),
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'voice', 'video', 'system'])
    .withMessage('Invalid message type'),
  body('isPriority')
    .optional()
    .isBoolean()
    .withMessage('isPriority must be a boolean'),
  body('priorityLevel')
    .optional()
    .isIn(['normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      conversationId,
      content,
      messageType = 'text',
      isPriority = false,
      priorityLevel = 'normal',
      replyTo,
      expiresAt
    } = req.body;

    const userId = req.user.id;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if conversation allows file sharing
    if (req.files && req.files.length > 0 && !conversation.settings.allowFileSharing) {
      return res.status(400).json({
        success: false,
        message: 'File sharing is not allowed in this conversation'
      });
    }

    // Check if conversation allows voice messages
    if (messageType === 'voice' && !conversation.settings.allowVoiceMessages) {
      return res.status(400).json({
        success: false,
        message: 'Voice messages are not allowed in this conversation'
      });
    }

    // For priority messages, verify payment
    if (isPriority && conversation.isPriorityConversation) {
      const userPaymentAccount = await PaymentAccount.findOne({ userId });
      const priorityCost = conversation.priorityPrice || 10; // Default cost
      
      if (!userPaymentAccount || userPaymentAccount.balance < priorityCost) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance for priority message'
        });
      }
    }

    // Process attachments
    const attachments = req.files ? req.files.map((file: any) => ({
      url: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    })) : [];

    const message = new Message({
      conversationId,
      senderId: userId,
      receiverId: conversation.participants.find((p: any) => p.toString() !== userId),
      content: content || '',
      messageType,
      isPriority,
      priorityLevel,
      attachments,
      replyTo,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await message.save();

    // Deduct payment for priority message
    if (isPriority && conversation.isPriorityConversation) {
      const priorityCost = conversation.priorityPrice || 10;
      await PaymentAccount.findOneAndUpdate(
        { userId },
        { $inc: { balance: -priorityCost } }
      );
    }

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date()
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'firstName lastName email avatar')
      .populate('receiverId', 'firstName lastName email avatar')
      .populate('replyTo');

    res.status(201).json({
      success: true,
      data: { message: populatedMessage }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/messages/:messageId/reactions
// @desc    Add/remove reaction to a message
// @access  Private
router.put('/:messageId/reactions', protect, [
  body('reaction')
    .notEmpty()
    .withMessage('Reaction is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { reaction } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      (r: any) => r.userId.toString() === userId
    );

    if (existingReactionIndex > -1) {
      // Remove reaction if same emoji
      if (message.reactions[existingReactionIndex].reaction === reaction) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Update reaction
        message.reactions[existingReactionIndex].reaction = reaction;
        message.reactions[existingReactionIndex].createdAt = new Date();
      }
    } else {
      // Add new reaction
      message.reactions.push({
        userId,
        reaction,
        createdAt: new Date()
      });
    }

    await message.save();

    const populatedMessage = await Message.findById(messageId)
      .populate('senderId', 'firstName lastName email avatar')
      .populate('reactions.userId', 'firstName lastName email avatar');

    res.json({
      success: true,
      data: { message: populatedMessage }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/:messageId', protect, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or has permission
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    message.deletedBy = [userId];
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/messages/conversations/:conversationId/settings
// @desc    Update conversation settings
// @access  Private
router.put('/conversations/:conversationId/settings', protect, [
  body('settings.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  body('settings.autoDeleteAfter')
    .optional()
    .isNumeric()
    .withMessage('Auto delete must be a number'),
  body('settings.allowFileSharing')
    .optional()
    .isBoolean()
    .withMessage('Allow file sharing must be a boolean'),
  body('settings.allowVoiceMessages')
    .optional()
    .isBoolean()
    .withMessage('Allow voice messages must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { conversationId } = req.params;
    const { settings } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Update settings
    if (settings) {
      conversation.settings = { ...conversation.settings, ...settings };
    }

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName email avatar')
      .populate('adminId', 'firstName lastName email');

    res.json({
      success: true,
      data: { conversation: populatedConversation }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages/conversations/:conversationId/mute
// @desc    Mute/unmute a conversation
// @access  Private
router.post('/conversations/:conversationId/mute', protect, [
  body('mutedUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid mute date')
], async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { mutedUntil } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const existingMuteIndex = conversation.mutedBy.findIndex(
      (m: any) => m.userId.toString() === userId
    );

    if (existingMuteIndex > -1) {
      // Remove mute
      conversation.mutedBy.splice(existingMuteIndex, 1);
    } else {
      // Add mute
      conversation.mutedBy.push({
        userId,
        mutedUntil: mutedUntil ? new Date(mutedUntil) : undefined
      });
    }

    await conversation.save();

    res.json({
      success: true,
      message: existingMuteIndex > -1 ? 'Conversation unmuted' : 'Conversation muted'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 