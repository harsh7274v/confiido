'use client';
import { Crown, DollarSign, VolumeX } from 'lucide-react';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  onSearchChange
}: ConversationListProps) {
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== 'current-user-id');
      return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown';
    }
    return conversation.participants.map(p => `${p.firstName} ${p.lastName}`).join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) return conversation.avatar;
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== 'current-user-id');
      return otherParticipant?.avatar || otherParticipant?.firstName?.charAt(0) || '?';
    }
    return conversation.participants.map(p => p.firstName.charAt(0)).join('').slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isMuted = (conversation: Conversation) => {
    return conversation.mutedBy?.some(mute => 
      mute.userId._id === 'current-user-id' && 
      (!mute.mutedUntil || new Date(mute.mutedUntil) > new Date())
    );
  };

  const isPriorityExpired = (conversation: Conversation) => {
    if (!conversation.priorityExpiresAt) return false;
    return new Date(conversation.priorityExpiresAt) < new Date();
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    const participantNames = conv.participants.map(p => `${p.firstName} ${p.lastName}`).join(' ');
    const lastMessage = conv.lastMessage?.content || '';
    return participantNames.toLowerCase().includes(searchLower) || 
           lastMessage.toLowerCase().includes(searchLower);
  });

  return (
    <div className="w-80 bg-surface border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-white mb-4">Messages</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-light border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-white placeholder-text-muted"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation._id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 border-b border-border cursor-pointer hover:bg-surface-light ${
              selectedConversationId === conversation._id ? 'bg-surface-light' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-semibold">
                  {getConversationAvatar(conversation)}
                </div>
                {conversation.isPriorityConversation && !isPriorityExpired(conversation) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Crown className="h-3 w-3 text-black" />
                  </div>
                )}
                {isMuted(conversation) && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <VolumeX className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-white truncate">
                      {getConversationName(conversation)}
                    </h3>
                    {conversation.isPriorityConversation && !isPriorityExpired(conversation) && (
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                    )}
                    {isMuted(conversation) && (
                      <VolumeX className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-xs text-text-muted">
                    {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : ''}
                  </span>
                </div>
                <p className="text-sm text-text-muted truncate">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
                {conversation.isPriorityConversation && conversation.priorityPrice && (
                  <p className="text-xs text-yellow-500">
                    ${conversation.priorityPrice} priority access
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredConversations.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-text-muted">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
} 