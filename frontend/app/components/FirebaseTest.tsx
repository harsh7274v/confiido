'use client';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/AuthComponents';

const FirebaseTest: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4">Loading Firebase...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Firebase Auth Status</h3>
      
      {user ? (
        <div className="space-y-2">
          <p className="text-green-600">✅ User is authenticated</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.displayName}</p>
          <p><strong>Photo:</strong> {user.photoURL ? '✅' : '❌'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">❌ User not authenticated</p>
          <GoogleSignInButton text="Test Firebase Login" />
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;
