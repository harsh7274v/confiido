# Real-time Messaging System

## Overview

The Lumina platform now includes a comprehensive real-time messaging system with advanced features for expert consultation and communication. This system supports priority messaging, file attachments, voice messages, reactions, and auto-delete functionality.

## Features

### 🚀 Priority DM Feature (Paid Messaging)
- **Priority Conversations**: Create premium conversations with payment verification
- **Priority Levels**: Normal, High, and Urgent priority levels
- **Payment Integration**: Automatic payment deduction for priority access
- **Duration-based Access**: Time-limited priority conversations

### 📎 File Attachments & Voice Messages
- **Multiple File Types**: Images, documents, audio, video files
- **Voice Recording**: Built-in voice message recording
- **File Size Limits**: 10MB maximum file size
- **File Type Validation**: Secure file type checking
- **Download Support**: Easy file download functionality

### 💬 Message Reactions and Replies
- **Emoji Reactions**: Add/remove emoji reactions to messages
- **Reply System**: Reply to specific messages with context
- **Reaction Tracking**: Track who reacted and when
- **Interactive UI**: Hover actions for message interactions

### ⏰ Auto-delete and Conversation Settings
- **Message Expiration**: Set auto-delete timers for messages
- **Conversation Settings**: Customize notifications, file sharing, voice messages
- **Mute Functionality**: Mute conversations temporarily or permanently
- **Soft Delete**: Messages are soft-deleted (recoverable)

### 🔌 Real-time Features
- **Socket.IO Integration**: Real-time message delivery
- **Typing Indicators**: Show when users are typing
- **Online Status**: Real-time online/offline status
- **Read Receipts**: Message delivery and read status
- **Notifications**: Push notifications for offline users

## Backend Implementation

### API Endpoints

#### Conversations
- `GET /api/messages/conversations` - Get user's conversations
- `POST /api/messages/conversations` - Create new conversation
- `GET /api/messages/conversations/:id` - Get conversation messages
- `PUT /api/messages/conversations/:id/settings` - Update conversation settings
- `POST /api/messages/conversations/:id/mute` - Mute/unmute conversation

#### Messages
- `POST /api/messages` - Send message with file uploads
- `PUT /api/messages/:id/reactions` - Add/remove reactions
- `DELETE /api/messages/:id` - Delete message (soft delete)

### Socket.IO Events

#### Client to Server
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `new_message` - Send a new message
- `message_reaction` - Add/remove reaction
- `delete_message` - Delete a message
- `conversation_settings_update` - Update conversation settings

#### Server to Client
- `message_received` - New message received
- `message_reaction_updated` - Message reaction updated
- `message_deleted` - Message deleted
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `conversation_settings_updated` - Conversation settings updated
- `new_message_notification` - Notification for offline users

### Database Models

#### Message Schema
```typescript
interface IMessage {
  conversationId: ObjectId;
  senderId: ObjectId;
  receiverId: ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  isPriority: boolean;
  priorityLevel: 'normal' | 'high' | 'urgent';
  attachments?: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }[];
  status: 'sent' | 'delivered' | 'read';
  readAt?: Date;
  deliveredAt?: Date;
  replyTo?: ObjectId;
  reactions?: {
    userId: ObjectId;
    reaction: string;
    createdAt: Date;
  }[];
  expiresAt?: Date;
  isDeleted: boolean;
  deletedBy?: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Conversation Schema
```typescript
interface IConversation {
  participants: ObjectId[];
  type: 'direct' | 'group' | 'priority_dm';
  isPriorityConversation: boolean;
  priorityPrice?: number;
  priorityDuration?: number;
  priorityExpiresAt?: Date;
  lastMessage?: ObjectId;
  lastMessageAt?: Date;
  name?: string;
  description?: string;
  avatar?: string;
  adminId?: ObjectId;
  settings: {
    notifications: boolean;
    autoDeleteAfter?: number;
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
  };
  mutedBy?: {
    userId: ObjectId;
    mutedUntil?: Date;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Frontend Implementation

### Components

#### MessageBubble
- Displays individual messages with all features
- Shows priority indicators, reactions, and status
- Handles file attachments and voice messages
- Interactive actions (reply, react, delete)

#### ConversationList
- Lists all user conversations
- Shows priority indicators and mute status
- Search functionality
- Real-time updates

#### MessageInput
- Text input with emoji picker
- File upload support
- Voice recording functionality
- Priority message settings
- Reply preview

### Real-time Features

#### Socket Connection
```typescript
const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
  auth: { token }
});
```

#### Event Handling
```typescript
socket.on('message_received', (data) => {
  // Handle new message
});

socket.on('user_typing', (data) => {
  // Show typing indicator
});
```

## Usage Examples

### Creating a Priority Conversation
```typescript
const response = await fetch('/api/messages/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    participantIds: ['user-id'],
    type: 'priority_dm',
    isPriorityConversation: true,
    priorityPrice: 50,
    priorityDuration: 7 // 7 days
  })
});
```

### Sending a Message with Attachments
```typescript
const formData = new FormData();
formData.append('conversationId', conversationId);
formData.append('content', 'Hello!');
formData.append('isPriority', 'true');
formData.append('priorityLevel', 'high');
formData.append('attachments', file);

const response = await fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Adding a Reaction
```typescript
const response = await fetch(`/api/messages/${messageId}/reactions`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ reaction: '❤️' })
});
```

## Security Features

### Authentication
- JWT token-based authentication for all endpoints
- Socket.IO authentication middleware
- User verification for all operations

### File Upload Security
- File type validation
- File size limits (10MB)
- Secure file storage
- Virus scanning (recommended)

### Payment Security
- Payment verification before priority access
- Balance checking
- Secure payment processing

## Performance Optimizations

### Database Indexes
```typescript
// Message indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ isPriority: 1 });

// Conversation indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isPriorityConversation: 1 });
```

### Real-time Optimizations
- Room-based message broadcasting
- Typing indicator debouncing
- Efficient user presence tracking
- Offline notification system

## Environment Variables

```env
# Socket.IO Configuration
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760 # 10MB in bytes

# Payment Configuration
PRIORITY_MESSAGE_COST=10
PRIORITY_CONVERSATION_COST=50

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lumina

# JWT Configuration
JWT_SECRET=your-secret-key
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing
1. Start the backend server: `npm run dev`
2. Start the frontend: `npm run dev`
3. Create test users and conversations
4. Test real-time messaging features
5. Test file uploads and voice messages
6. Test priority messaging and payments

## Deployment

### Backend Deployment
1. Set environment variables
2. Configure MongoDB connection
3. Set up file storage (local or cloud)
4. Configure Socket.IO for production
5. Set up SSL certificates

### Frontend Deployment
1. Configure API endpoints
2. Set up Socket.IO client
3. Configure file upload URLs
4. Set up environment variables

## Future Enhancements

### Planned Features
- **End-to-end encryption** for message security
- **Message threading** for complex conversations
- **Advanced file sharing** with cloud storage
- **Message search** and filtering
- **Conversation analytics** and insights
- **Bot integration** for automated responses
- **Message scheduling** for delayed sending
- **Advanced notification** preferences

### Technical Improvements
- **Message compression** for better performance
- **Offline message sync** for mobile apps
- **Message backup** and recovery
- **Advanced caching** strategies
- **Load balancing** for Socket.IO
- **Message encryption** at rest

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Note**: This messaging system is designed to be scalable and secure, with real-time capabilities that enhance the expert consultation experience on the Lumina platform. 