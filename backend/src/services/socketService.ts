import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Message, Conversation } from '../models/Message';
import User from '../models/User';

interface AuthenticatedSocket {
  id: string;
  userId?: string;
  user?: any;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
  to: (room: string) => { emit: (event: string, data: any) => void };
  handshake: {
    auth: { token?: string };
    headers: { authorization?: string };
  };
}

class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of typing userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      // Store user's socket connection
      this.userSockets.set(socket.userId!, socket.id);

      // Join user's personal room for notifications
      socket.join(`user:${socket.userId}`);

      // Join user's conversations
      this.joinUserConversations(socket);

      // Handle joining a specific conversation
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      });

      // Handle leaving a conversation
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (conversationId: string) => {
        this.handleTypingStart(socket, conversationId);
      });

      socket.on('typing_stop', (conversationId: string) => {
        this.handleTypingStop(socket, conversationId);
      });

      // Handle new message
      socket.on('new_message', async (data: any) => {
        await this.handleNewMessage(socket, data);
      });

      // Handle message reactions
      socket.on('message_reaction', async (data: any) => {
        await this.handleMessageReaction(socket, data);
      });

      // Handle message deletion
      socket.on('delete_message', async (data: any) => {
        await this.handleMessageDeletion(socket, data);
      });

      // Handle conversation settings update
      socket.on('conversation_settings_update', async (data: any) => {
        await this.handleConversationSettingsUpdate(socket, data);
      });

      // Handle booking status updates
      socket.on('join_booking_updates', (bookingId: string) => {
        socket.join(`booking:${bookingId}`);
        console.log(`User ${socket.userId} joined booking updates for ${bookingId}`);
      });

      socket.on('leave_booking_updates', (bookingId: string) => {
        socket.leave(`booking:${bookingId}`);
        console.log(`User ${socket.userId} left booking updates for ${bookingId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        this.userSockets.delete(socket.userId!);
        this.removeUserFromTyping(socket.userId!);
      });
    });
  }

  private async joinUserConversations(socket: AuthenticatedSocket) {
    try {
      const conversations = await Conversation.find({
        participants: socket.userId,
        isActive: true
      });

      conversations.forEach(conversation => {
        socket.join(`conversation:${conversation._id}`);
      });
    } catch (error) {
      console.error('Error joining conversations:', error);
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, conversationId: string) {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    this.typingUsers.get(conversationId)!.add(socket.userId!);
    
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      conversationId,
      userId: socket.userId,
      userName: socket.user?.name
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, conversationId: string) {
    const typingSet = this.typingUsers.get(conversationId);
    if (typingSet) {
      typingSet.delete(socket.userId!);
      if (typingSet.size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }

    socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
      conversationId,
      userId: socket.userId
    });
  }

  private removeUserFromTyping(userId: string) {
    for (const [conversationId, typingSet] of this.typingUsers.entries()) {
      if (typingSet.has(userId)) {
        typingSet.delete(userId);
        if (typingSet.size === 0) {
          this.typingUsers.delete(conversationId);
        }
      }
    }
  }

  private async handleNewMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const { conversationId, content, messageType, isPriority, priorityLevel, replyTo, attachments, expiresAt } = data;

      // Create the message in the database
      const message = new Message({
        conversationId,
        senderId: socket.userId,
        receiverId: null, // Will be set based on conversation participants
        content,
        messageType: messageType || 'text',
        isPriority: isPriority || false,
        priorityLevel: priorityLevel || 'normal',
        attachments: attachments || [],
        replyTo,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      // Get conversation to set receiver and validate
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Set receiver (other participant in direct conversation)
      if (conversation.type === 'direct') {
        const otherParticipant = conversation.participants.find(
          (p: any) => p.toString() !== socket.userId
        );
        message.receiverId = otherParticipant;
      }

      await message.save();

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date()
      });

      // Populate the message with user data
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name email avatar')
        .populate('receiverId', 'name email avatar')
        .populate('replyTo');

      // Emit to all users in the conversation
      this.io.to(`conversation:${conversationId}`).emit('message_received', {
        message: populatedMessage,
        conversationId
      });

      // Send notification to offline users
      this.sendNotificationToOfflineUsers(conversation, populatedMessage);

    } catch (error) {
      console.error('Error handling new message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleMessageReaction(socket: AuthenticatedSocket, data: any) {
    try {
      const { messageId, reaction } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user already reacted
      const existingReactionIndex = message.reactions.findIndex(
        (r: any) => r.userId.toString() === socket.userId
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
          userId: new mongoose.Types.ObjectId(socket.userId),
          reaction,
          createdAt: new Date()
        });
      }

      await message.save();

      const populatedMessage = await Message.findById(messageId)
        .populate('senderId', 'firstName lastName email avatar')
        .populate('reactions.userId', 'firstName lastName email avatar');

      // Emit to all users in the conversation
      this.io.to(`conversation:${message.conversationId}`).emit('message_reaction_updated', {
        message: populatedMessage,
        conversationId: message.conversationId
      });

    } catch (error) {
      console.error('Error handling message reaction:', error);
      socket.emit('error', { message: 'Failed to update reaction' });
    }
  }

  private async handleMessageDeletion(socket: AuthenticatedSocket, data: any) {
    try {
      const { messageId } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user is the sender
      if (message.senderId.toString() !== socket.userId) {
        socket.emit('error', { message: 'Not authorized to delete this message' });
        return;
      }

      message.isDeleted = true;
      message.deletedBy = [new mongoose.Types.ObjectId(socket.userId)];
      await message.save();

      // Emit to all users in the conversation
      this.io.to(`conversation:${message.conversationId}`).emit('message_deleted', {
        messageId,
        conversationId: message.conversationId
      });

    } catch (error) {
      console.error('Error handling message deletion:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  }

  private async handleConversationSettingsUpdate(socket: AuthenticatedSocket, data: any) {
    try {
      const { conversationId, settings } = data;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId,
        isActive: true
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Update settings
      conversation.settings = { ...conversation.settings, ...settings };
      await conversation.save();

      const populatedConversation = await Conversation.findById(conversationId)
        .populate('participants', 'firstName lastName email avatar')
        .populate('adminId', 'firstName lastName email');

      // Emit to all users in the conversation
      this.io.to(`conversation:${conversationId}`).emit('conversation_settings_updated', {
        conversation: populatedConversation
      });

    } catch (error) {
      console.error('Error handling conversation settings update:', error);
      socket.emit('error', { message: 'Failed to update conversation settings' });
    }
  }

  private async sendNotificationToOfflineUsers(conversation: any, message: any) {
    try {
      const onlineUserIds = Array.from(this.userSockets.keys());
      
      for (const participantId of conversation.participants) {
        const participantIdStr = participantId.toString();
        
        // Skip if user is online or is the sender
        if (onlineUserIds.includes(participantIdStr) || participantIdStr === message.senderId._id.toString()) {
          continue;
        }

        // Send notification to offline user
        this.io.to(`user:${participantIdStr}`).emit('new_message_notification', {
          conversationId: conversation._id,
          conversationName: conversation.name || 'New message',
          senderName: `${message.senderId.firstName} ${message.senderId.lastName}`,
          messagePreview: message.content.substring(0, 50),
          messageType: message.messageType,
          isPriority: message.isPriority
        });
      }
    } catch (error) {
      console.error('Error sending notifications to offline users:', error);
    }
  }

  // Public methods for external use
  public getIO() {
    return this.io;
  }

  public getUserSocket(userId: string) {
    return this.userSockets.get(userId);
  }

  public isUserOnline(userId: string) {
    return this.userSockets.has(userId);
  }

  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  // Booking-related methods
  public emitBookingStatusUpdate(bookingId: string, sessionId: string, status: string, data: any) {
    this.io.to(`booking:${bookingId}`).emit('booking_status_updated', {
      bookingId,
      sessionId,
      status,
      data,
      timestamp: new Date().toISOString()
    });
  }

  public emitBookingTimeoutWarning(bookingId: string, sessionId: string, timeLeft: number) {
    this.io.to(`booking:${bookingId}`).emit('booking_timeout_warning', {
      bookingId,
      sessionId,
      timeLeft,
      timestamp: new Date().toISOString()
    });
  }

  public emitBookingExpired(bookingId: string, sessionId: string) {
    this.io.to(`booking:${bookingId}`).emit('booking_expired', {
      bookingId,
      sessionId,
      timestamp: new Date().toISOString()
    });
  }

  public emitPaymentStatusUpdate(bookingId: string, sessionId: string, paymentStatus: string, data: any) {
    this.io.to(`booking:${bookingId}`).emit('payment_status_updated', {
      bookingId,
      sessionId,
      paymentStatus,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

export default SocketService;