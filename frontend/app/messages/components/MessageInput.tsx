'use client';
import { useState, useRef } from 'react';
import { 
  Send, Paperclip, Smile, Mic, Crown, X, 
  Image as ImageIcon, FileText, Music
} from 'lucide-react';

interface ReplyMessage {
  _id: string;
  content: string;
  senderId: string;
}

interface MessageInputProps {
  onSendMessage: (message: string, files: File[], isPriority: boolean, priorityLevel: string, replyTo?: ReplyMessage, expiresAt?: string) => void;
  replyTo?: ReplyMessage;
  onCancelReply: () => void;
  allowFileSharing: boolean;
  allowVoiceMessages: boolean;
  isPriorityConversation: boolean;
}

export default function MessageInput({
  onSendMessage,
  replyTo,
  onCancelReply,
  allowFileSharing,
  allowVoiceMessages,
  isPriorityConversation
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityLevel, setPriorityLevel] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSendMessage = () => {
    if (!message.trim() && uploadingFiles.length === 0) return;

    const isPriority = priorityLevel !== 'normal';
    onSendMessage(message, uploadingFiles, isPriority, priorityLevel, replyTo, expiresAt);
    
    // Reset form
    setMessage('');
    setUploadingFiles([]);
    setPriorityLevel('normal');
    setExpiresAt('');
    setShowPriorityModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadingFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
        setUploadingFiles(prev => [...prev, audioFile]);
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '👏', '🙏', '😍'];

  return (
    <div className="p-4 border-t border-border">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-3 p-3 border border-border rounded-lg bg-surface-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                <span className="text-xs text-white">↩</span>
              </div>
              <span className="text-sm text-text-muted">Replying to:</span>
              <span className="text-sm text-white truncate">{replyTo.content}</span>
            </div>
            <button
              onClick={onCancelReply}
              className="text-text-muted hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Priority modal */}
      {showPriorityModal && (
        <div className="mb-3 p-3 border border-border rounded-lg bg-surface-light">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">Priority Message Settings</h4>
            <button
              onClick={() => setShowPriorityModal(false)}
              className="text-text-muted hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-muted">Priority Level</label>
              <select
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value as 'normal' | 'high' | 'urgent')}
                className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded text-white"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-text-muted">Auto-delete after (hours)</label>
              <input
                type="number"
                value={expiresAt ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : ''}
                onChange={(e) => {
                  const hours = parseInt(e.target.value);
                  if (hours > 0) {
                    setExpiresAt(new Date(Date.now() + hours * 60 * 60 * 1000).toISOString());
                  } else {
                    setExpiresAt('');
                  }
                }}
                className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded text-white"
                placeholder="Leave empty for no expiration"
              />
            </div>
          </div>
        </div>
      )}

      {/* File uploads preview */}
      {uploadingFiles.length > 0 && (
        <div className="mb-3 space-y-2">
          {uploadingFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-surface-light rounded">
              <div className="flex items-center space-x-2">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 text-text-muted" />
                ) : file.type.startsWith('audio/') ? (
                  <Music className="h-4 w-4 text-text-muted" />
                ) : (
                  <FileText className="h-4 w-4 text-text-muted" />
                )}
                <span className="text-sm text-white">{file.name}</span>
                <span className="text-xs text-text-muted">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-text-muted hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message input */}
      <div className="flex items-center space-x-2">
        {allowFileSharing && (
          <button 
            className="p-2 text-text-muted hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        )}
        
        {allowVoiceMessages && (
          <button
            className={`p-2 ${isRecording ? 'text-red-400' : 'text-text-muted hover:text-white'}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            title="Record voice message"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2 bg-surface-light border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-white placeholder-text-muted"
          />
          
          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-surface border border-border rounded-lg">
              <div className="grid grid-cols-5 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="p-1 hover:bg-surface-light rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        {/* Priority button */}
        {isPriorityConversation && (
          <button
            onClick={() => setShowPriorityModal(!showPriorityModal)}
            className={`p-2 ${priorityLevel !== 'normal' ? 'text-yellow-400' : 'text-text-muted hover:text-white'}`}
            title="Priority message"
          >
            <Crown className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={handleSendMessage}
          disabled={!message.trim() && uploadingFiles.length === 0}
          className="p-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Recording indicator */}
      {isRecording && (
        <div className="mt-2 p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-400">Recording... Release to stop</span>
          </div>
        </div>
      )}
    </div>
  );
} 