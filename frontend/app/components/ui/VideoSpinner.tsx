import React from 'react';

interface VideoSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const VideoSpinner: React.FC<VideoSpinnerProps> = ({ 
  size = 'md', 
  text, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`${sizeClasses[size]} object-contain`}
        style={{ pointerEvents: 'none' }}
      >
        <source src="/spinner.webm" type="video/webm" />
        {/* Fallback for browsers that don't support webm */}
        <div className="animate-spin rounded-full border-b-2 border-purple-600" style={{ width: '100%', height: '100%' }}></div>
      </video>
      {text && (
        <p className="text-gray-600 text-sm mt-2">{text}</p>
      )}
    </div>
  );
};

export default VideoSpinner;
