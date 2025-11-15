'use client';

import { useEffect, useState } from 'react';

export default function SessionLoadingScreen() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: 'linear-gradient(135deg, #3E5F44 0%, #2d4532 100%)' }}>
      <div className="text-center">
        {/* Loading Text */}
        <div className="mb-6">
          <p className="text-2xl font-bold text-white">
            Loading Session{dots}
          </p>
        </div>

        {/* Animated Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-white border-opacity-20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Optional: Progress bar */}
        <div className="mt-8 w-64 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
}
