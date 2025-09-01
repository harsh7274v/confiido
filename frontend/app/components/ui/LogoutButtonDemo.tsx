'use client';
import React from 'react';
import LogoutButton from './LogoutButton';

const LogoutButtonDemo: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Logout Button Variants</h2>
      
      {/* Basic Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Basic Variants</h3>
        <div className="flex flex-wrap gap-4">
          <LogoutButton variant="default" size="md" />
          <LogoutButton variant="ghost" size="md" />
          <LogoutButton variant="outline" size="md" />
        </div>
      </div>

      {/* Size Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Size Variants</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <LogoutButton variant="default" size="sm" />
          <LogoutButton variant="default" size="md" />
          <LogoutButton variant="default" size="lg" />
        </div>
      </div>

      {/* With Overlay */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">With Overlay (Enhanced UX)</h3>
        <div className="flex flex-wrap gap-4">
          <LogoutButton 
            variant="default" 
            size="md" 
            useOverlay={true}
            text="Logout with Overlay"
          />
        </div>
      </div>

      {/* Custom Styling */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Custom Styling</h3>
        <div className="flex flex-wrap gap-4">
          <LogoutButton 
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            text="Gradient Logout"
          />
          <LogoutButton 
            className="bg-purple-600 hover:bg-purple-700 border-2 border-purple-300"
            text="Purple Theme"
          />
        </div>
      </div>
    </div>
  );
};

export default LogoutButtonDemo;
