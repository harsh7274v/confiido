'use client';
import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, CreditCard, Palette, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    profileVisibility: 'public',
    sessionReminders: true,
    paymentReminders: true,
    theme: 'light'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', formData);
    // Here you would typically save to backend
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Lumina
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                Profile
              </Link>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account preferences and platform settings.</p>
        </div>

        {/* Settings Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'general', name: 'General', icon: SettingsIcon },
                { id: 'notifications', name: 'Notifications', icon: Bell },
                { id: 'privacy', name: 'Privacy & Security', icon: Shield },
                { id: 'appearance', name: 'Appearance', icon: Palette },
                { id: 'billing', name: 'Billing', icon: CreditCard },
                { id: 'data', name: 'Data & Export', icon: Download }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Language
                      </label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Timezone
                      </label>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">GMT</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Currency
                      </label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Profile Visibility
                      </label>
                      <select
                        name="profileVisibility"
                        value={formData.profileVisibility}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="expert-only">Experts Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { id: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications in your browser' },
                      { id: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional and marketing emails' },
                      { id: 'sessionReminders', label: 'Session Reminders', description: 'Get reminded about upcoming sessions' },
                      { id: 'paymentReminders', label: 'Payment Reminders', description: 'Get notified about payments and billing' }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{setting.label}</p>
                          <p className="text-sm text-slate-600">{setting.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name={setting.id}
                            checked={formData[setting.id as keyof typeof formData] as boolean}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Privacy & Security</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Change Password</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          Update Password
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Two-Factor Authentication</h4>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-slate-600 mb-4">Add an extra layer of security to your account.</p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          Enable 2FA
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Account Deletion</h4>
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-red-600 mb-4">This action cannot be undone. All your data will be permanently deleted.</p>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2">
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Appearance Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Theme
                      </label>
                      <select
                        name="theme"
                        value={formData.theme}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Billing & Payment</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-600 mb-4">Manage your billing information and payment methods.</p>
                    <Link href="/wallet" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Go to Wallet
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Data & Export</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-2">Export Your Data</h4>
                      <p className="text-slate-600 mb-4">Download a copy of your personal data including profile, sessions, and messages.</p>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Export Data</span>
                      </button>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-2">Delete Your Data</h4>
                      <p className="text-slate-600 mb-4">Permanently delete all your personal data from our servers.</p>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2">
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 