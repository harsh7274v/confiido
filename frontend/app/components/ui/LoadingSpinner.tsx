import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  return (
    <div className={`text-center space-y-3 ${className}`}>
      <div className="flex justify-center">
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
          <div className="animate-spin rounded-full border-b-2 border-purple-600 h-full w-full"></div>
        </video>
      </div>
      {text && (
        <p className="text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
