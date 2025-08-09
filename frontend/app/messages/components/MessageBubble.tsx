'use client';
import { useState } from 'react';
import { 
  Heart, Reply, Trash2, Download, Play, Pause, 
  Image as ImageIcon, FileText, Music, Crown, 
  Clock, AlertCircle, CheckCircle
} from 'lucide-react';

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

interface ReactionData {
  reaction: string;
  userId: {
    firstName: string;
    lastName: string;
  };
}

interface Message {
  _id: string;
  content: string;
  senderId: string;
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
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  onReaction: (messageId: string, reaction: string) => void;
  onDelete: (messageId: string) => void;
  currentUserId: string;
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  onReply, 
  onReaction, 
  onDelete, 
  currentUserId 
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handlePlayAudio = (url: string) => {
    const audio = new Audio(url);
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
        isOwn
          ? 'bg-accent text-white'
          : 'bg-surface-light text-white'
      }`}>
        {/* Reply to message */}
        {message.replyTo && (
          <div className="mb-2 p-2 bg-black bg-opacity-20 rounded text-xs">
            <p className="text-text-muted">Replying to:</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Priority indicator */}
        {message.isPriority && (
          <div className="flex items-center space-x-1 mb-1">
            <Crown className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-yellow-500 uppercase">
              {message.priorityLevel} Priority
            </span>
          </div>
        )}

        {/* Message content */}
        <div className="space-y-2">
          {message.content && <p className="text-sm">{message.content}</p>}
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment: Attachment, index: number) => (
                <div key={index} className="border border-border rounded p-2">
                  {attachment.mimeType.startsWith('image/') ? (
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-text-muted" />
                      <span className="text-xs">{attachment.fileName}</span>
                      <Download className="h-4 w-4 text-text-muted cursor-pointer" />
                    </div>
                  ) : attachment.mimeType.startsWith('audio/') ? (
                    <div className="flex items-center space-x-2">
                      <Music className="h-4 w-4 text-text-muted" />
                      <span className="text-xs">{attachment.fileName}</span>
                      <button
                        onClick={() => handlePlayAudio(attachment.url)}
                        className="text-text-muted hover:text-white"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-text-muted" />
                      <span className="text-xs">{attachment.fileName}</span>
                      <span className="text-xs text-text-muted">
                        {formatFileSize(attachment.fileSize || attachment.size)}
                      </span>
                      <Download className="h-4 w-4 text-text-muted cursor-pointer" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Expiration warning */}
          {message.expiresAt && !isExpired(message.expiresAt) && (
            <div className="flex items-center space-x-1 text-xs text-orange-400">
              <Clock className="h-3 w-3" />
              <span>Expires {formatTime(message.expiresAt)}</span>
            </div>
          )}

          {/* Expired message */}
          {message.expiresAt && isExpired(message.expiresAt) && (
            <div className="flex items-center space-x-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              <span>Message expired</span>
            </div>
          )}

          {/* Message status */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${
              isOwn ? 'text-red-200' : 'text-text-muted'
            }`}>
              {formatTime(message.createdAt || message.timestamp)}
            </span>
            {isOwn && (
              <div className="flex items-center space-x-1">
                {message.status === 'sent' && <Clock className="h-3 w-3 text-text-muted" />}
                {message.status === 'delivered' && <CheckCircle className="h-3 w-3 text-blue-400" />}
                {message.status === 'read' && <CheckCircle className="h-3 w-3 text-green-400" />}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction: ReactionData, index: number) => (
                                  <span
                    key={index}
                    className="px-2 py-1 bg-surface rounded-full text-xs cursor-pointer hover:bg-surface-light"
                    onClick={() => onReaction(message._id, reaction.reaction)}
                  >
                    {reaction.reaction} {reaction.userId.firstName} {reaction.userId.lastName}
                  </span>
              ))}
            </div>
          )}
        </div>

        {/* Message actions */}
        {showActions && (
          <div className="absolute -top-8 right-0 flex items-center space-x-1 bg-surface border border-border rounded-lg p-1 opacity-100 transition-opacity">
            <button
              onClick={() => onReply(message)}
              className="p-1 text-text-muted hover:text-white"
              title="Reply"
            >
              <Reply className="h-3 w-3" />
            </button>
            <button
              onClick={() => onReaction(message._id, '❤️')}
              className="p-1 text-text-muted hover:text-white"
              title="React"
            >
              <Heart className="h-3 w-3" />
            </button>
            {message.senderId === currentUserId && (
              <button
                onClick={() => onDelete(message._id)}
                className="p-1 text-text-muted hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 