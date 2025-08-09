'use client';
import React from 'react';
import Link from 'next/link';

interface SimpleUserProfileProps {
  showFirebase?: boolean;
}

export const SimpleUserProfile: React.FC<SimpleUserProfileProps> = ({ showFirebase = false }) => {
  // For testing purposes, always show login/signup buttons
  return (
    <div className="flex items-center space-x-4">
      <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 px-3 py-2 rounded-lg hover:bg-blue-50">
        Login
      </Link>
      <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg">
        Sign Up
      </Link>
    </div>
  );
};
