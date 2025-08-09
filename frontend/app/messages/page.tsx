'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, MoreVertical, Phone, Video, Settings, 
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import MessageBubble from './components/MessageBubble';
import ConversationList from './components/ConversationList';
import MessageInput from './components/MessageInput';

interface ReactionData {
  reaction: string;
  userId: {
    firstName: string;
    lastName: string;
  };
}

interface Attachment {
  _id: string;
  type: string;
  name: string;
  fileName: string;
  url: string;
  size: number;
  fileSize?: number;
  mimeType: string;
}

interface Message {
  _id: string;
  content: string;
  senderId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  timestamp: string;
  createdAt?: string;
  type: 'text' | 'image' | 'audio' | 'file';
  audioUrl?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  reactions?: ReactionData[];
  status: 'sent' | 'delivered' | 'read';
  replyTo?: Message;
  isPriority?: boolean;
  priorityLevel?: string;
  attachments?: Attachment[];
  expiresAt?: string;
  // Legacy fields that might still be in use
  messageType?: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  receiverId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  isDeleted?: boolean;
  updatedAt?: string;
  readAt?: string;
  deliveredAt?: string;
}

interface LastMessage {
  content: string;
  senderId: string;
  timestamp: string;
  type: string;
}

interface Conversation {
  _id: string;
  participants: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  }[];
  type: 'direct' | 'group' | 'priority_dm';
  isPriorityConversation: boolean;
  priorityPrice?: number;
  priorityDuration?: number;
  priorityExpiresAt?: string;
  lastMessage?: LastMessage;
  lastMessageAt?: string;
  name?: string;
  description?: string;
  avatar?: string;
  adminId?: {
    _id: string;
    name: string;
    email: string;
  };
  settings: {
    notifications: boolean;
    autoDeleteAfter?: number;
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
  };
  mutedBy?: {
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    mutedUntil?: string;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocketEventData {
  message?: Message;
  conversationId?: string;
  messageId?: string;
  conversation?: Conversation;
  userName?: string;
  userId?: string;
}

export default function Messages() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<{ _id: string; content: string; senderId: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUserId] = useState('current-user-id');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('message_received', (data: SocketEventData) => {
      if (data.conversationId === selectedConversation?._id && data.message) {
        setMessages(prev => [...prev, data.message!]);
        scrollToBottom();
      }
      // Update conversation list
      fetchConversations();
    });

    newSocket.on('message_reaction_updated', (data: SocketEventData) => {
      if (data.conversationId === selectedConversation?._id && data.message) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.message!._id ? data.message! : msg
        ));
      }
    });

    newSocket.on('message_deleted', (data: SocketEventData) => {
      if (data.conversationId === selectedConversation?._id && data.messageId) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    });

    newSocket.on('user_typing', (data: SocketEventData) => {
      if (data.conversationId === selectedConversation?._id && data.userName) {
        setTypingUsers(prev => [...prev.filter(user => user !== data.userName), data.userName!]);
      }
    });

    newSocket.on('user_stopped_typing', (data: SocketEventData) => {
      if (data.conversationId === selectedConversation?._id && data.userName) {
        setTypingUsers(prev => prev.filter(user => user !== data.userName));
      }
    });

    newSocket.on('conversation_settings_updated', (data: SocketEventData) => {
      if (data.conversation) {
        setSelectedConversation(data.conversation);
        fetchConversations();
      }
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [selectedConversation?._id]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/messages/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
        setSelectedConversation(data.data.conversation);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
    if (socket) {
      socket.emit('join_conversation', conversation._id);
    }
  };

  const handleSendMessage = async (
    message: string, 
    files: File[], 
    isPriority: boolean, 
    priorityLevel: string, 
    replyTo?: { _id: string; content: string; senderId: string }, 
    expiresAt?: string
  ) => {
    if (!selectedConversation || !socket) return;

    const formData = new FormData();
    formData.append('conversationId', selectedConversation._id);
    formData.append('content', message);
    formData.append('messageType', 'text');
    formData.append('isPriority', isPriority.toString());
    formData.append('priorityLevel', priorityLevel);
    
    if (replyTo) {
      formData.append('replyTo', replyTo._id);
    }
    
    if (expiresAt) {
      formData.append('expiresAt', expiresAt);
    }

    // Add files
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/messages/${messageId}/reactions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reaction })
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown';
    }
    return conversation.participants.map(p => `${p.firstName} ${p.lastName}`).join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) return conversation.avatar;
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant?.avatar || otherParticipant?.firstName?.charAt(0) || '?';
    }
    return conversation.participants.map(p => p.firstName.charAt(0)).join('').slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-accent">
                Lumina
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-text-muted hover:text-white">
                Dashboard
              </Link>
              <Link href="/profile" className="text-text-muted hover:text-white">
                Profile
              </Link>
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        <div className="flex h-full">
          {/* Sidebar - Conversations List */}
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?._id}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-surface">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-semibold">
                        {getConversationAvatar(selectedConversation)}
                      </div>
                      {selectedConversation.isPriorityConversation && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="h-2 w-2 text-black" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {getConversationName(selectedConversation)}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {selectedConversation.isPriorityConversation ? 'Priority Conversation' : 'Active'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 text-text-muted hover:text-white"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-text-muted hover:text-white">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-text-muted hover:text-white">
                      <Video className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-text-muted hover:text-white">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <div className="p-4 border-b border-border bg-surface-light">
                    <h4 className="text-white font-medium mb-3">Conversation Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Notifications</span>
                        <input
                          type="checkbox"
                          checked={selectedConversation.settings.notifications}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">File Sharing</span>
                        <input
                          type="checkbox"
                          checked={selectedConversation.settings.allowFileSharing}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Voice Messages</span>
                        <input
                          type="checkbox"
                          checked={selectedConversation.settings.allowVoiceMessages}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    // Convert message format for MessageBubble component
                    const senderIdString = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
                    
                    const messageBubbleMsg = {
                      ...msg,
                      senderId: senderIdString,
                      timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
                      type: msg.type || (msg as unknown as { messageType?: string }).messageType || 'text',
                      status: msg.status || 'sent',
                      replyTo: undefined // Simplify for now to avoid recursive type issues
                    };
                    
                    return (
                      <MessageBubble
                        key={msg._id}
                        message={messageBubbleMsg}
                        isOwn={senderIdString === currentUserId}
                        onReply={(replyMsg) => {
                          const msgWithSender = replyMsg as unknown as { 
                            _id: string; 
                            content: string; 
                            senderId: string | { _id: string; firstName: string; lastName: string; email: string; avatar?: string; }; 
                          };
                          const senderIdString = typeof msgWithSender.senderId === 'object' && msgWithSender.senderId?._id 
                            ? msgWithSender.senderId._id 
                            : typeof msgWithSender.senderId === 'string' 
                              ? msgWithSender.senderId 
                              : '';
                          setReplyTo({
                            _id: msgWithSender._id,
                            content: msgWithSender.content,
                            senderId: senderIdString
                          });
                        }}
                        onReaction={handleReaction}
                        onDelete={handleDeleteMessage}
                        currentUserId={currentUserId}
                      />
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-surface-light text-white px-4 py-2 rounded-lg">
                        <p className="text-sm text-text-muted">
                          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  replyTo={replyTo || undefined}
                  onCancelReply={() => setReplyTo(null)}
                  allowFileSharing={selectedConversation.settings.allowFileSharing}
                  allowVoiceMessages={selectedConversation.settings.allowVoiceMessages}
                  isPriorityConversation={selectedConversation.isPriorityConversation}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-text-muted" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
                  <p className="text-text-muted">Choose a conversation from the list to start messaging.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 