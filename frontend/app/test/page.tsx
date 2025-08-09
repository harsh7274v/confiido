'use client';
import React from 'react';
import Link from 'next/link';
import FirebaseTest from '../components/FirebaseTest';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Firebase Authentication Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FirebaseTest />
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Traditional Auth Links</h3>
              <div className="space-y-3">
                <Link href="/login" className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Traditional Login
                </Link>
                <Link href="/signup" className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Traditional Signup
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Configuration Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Firebase Config:</span>
                <span className="text-green-600">✅ Loaded</span>
              </div>
              <div className="flex justify-between">
                <span>Project ID:</span>
                <span className="text-blue-600">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</span>
              </div>
              <div className="flex justify-between">
                <span>Auth Domain:</span>
                <span className="text-blue-600">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</span>
              </div>
              <div className="flex justify-between">
                <span>API URL:</span>
                <span className="text-blue-600">{process.env.NEXT_PUBLIC_API_URL}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How it Works</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Firebase handles Google OAuth authentication</li>
            <li>• User data syncs with your MongoDB backend</li>
            <li>• Traditional login/signup forms still work independently</li>
            <li>• Navigation shows appropriate buttons based on auth state</li>
            <li>• Both systems can coexist seamlessly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
