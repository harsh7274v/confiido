"use client";

import React, { useState } from 'react';
import { 
  Home, 
  Target, 
  Gift, 
  User, 
  CreditCard, 
  Mail,
  Calendar,
  Wallet,
  Star,
  Grid,
  FileText,
  MessageSquare,
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  userName?: string;
  onProfileClick?: () => void;
  onSessionsClick?: () => void;
  onHomeClick?: () => void;
  onTransactionsClick?: () => void;
  onContactClick?: () => void;
  onRewardsClick?: () => void;
  onPaymentsClick?: () => void;
  isProfileIncomplete?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userName = "Aakash",
  onProfileClick,
  onSessionsClick,
  onHomeClick,
  onTransactionsClick,
  onContactClick,
  onRewardsClick,
  onPaymentsClick,
  isProfileIncomplete = false
}) => {
  const [activeItem, setActiveItem] = useState('home');

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Grid },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    
    // Handle home click to scroll to top
    if (itemId === 'home' && onHomeClick) {
      onHomeClick();
    }
    
    // Handle profile click to open popup
    if (itemId === 'profile' && onProfileClick) {
      onProfileClick();
    }
    
    // Handle sessions click to scroll to sessions section
    if (itemId === 'sessions' && onSessionsClick) {
      onSessionsClick();
    }
    
    // Handle transactions click to show transactions view
    if (itemId === 'transactions' && onTransactionsClick) {
      onTransactionsClick();
    }
    
    // Handle contact click to navigate to contact page
    if (itemId === 'contact' && onContactClick) {
      onContactClick();
    }
    
    // Handle rewards click to show rewards view
    if (itemId === 'rewards' && onRewardsClick) {
      onRewardsClick();
    }
    
    // Handle payments click to show payments view
    if (itemId === 'payments' && onPaymentsClick) {
      onPaymentsClick();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="h-full min-h-screen w-64 flex flex-col shadow-xl" style={{ backgroundColor: '#E5E7EB', borderTopRightRadius: '3rem', borderBottomRightRadius: '3rem' }}>
          {/* Brand/Title */}
          <div className="px-6 pt-8 pb-4">
            <h1 className="text-2xl font-bold" style={{ color: '#5D5869', fontFamily: "'Rubik', sans-serif" }}>
              Confiido
            </h1>
          </div>

          {/* Profile Section */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-8 h-8 text-blue-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#5D5869', fontFamily: "'Rubik', sans-serif" }}>
                  {userName}
                </h2>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 pl-4 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-4 py-3 transition-all duration-200 relative group ${
                    isActive
                      ? 'rounded-l-[2rem] shadow-md pl-5 mr-4'
                      : 'rounded-xl hover:bg-white/30 px-5 mr-4'
                  }`}
                  style={isActive ? { backgroundColor: '#fff0f3' } : {}}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'shadow-sm' : ''
                  }`} style={{ backgroundColor: isActive ? '#5D5869' : 'transparent' }}>
                    <Icon className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-[#5D5869]'
                    }`} />
                  </div>
                  <span className={`text-base font-medium transition-colors duration-200 flex items-center gap-2 ${
                    isActive ? 'text-[#5D5869]' : 'text-[#7A7381]'
                  }`} style={{ fontFamily: "'Rubik', sans-serif" }}>
                    {item.label}
                    {item.id === 'profile' && isProfileIncomplete && (
                      <Star className="w-3 h-3 fill-red-500 text-red-500" />
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="pl-4 py-6 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 hover:bg-white/30 mr-4"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'transparent' }}>
                <LogOut className="w-5 h-5" style={{ color: '#5D5869' }} />
              </div>
              <span className="text-base font-medium" style={{ color: '#7A7381', fontFamily: "'Rubik', sans-serif" }}>
                Log out
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 shadow-lg z-50" style={{ backgroundColor: '#E5E7EB', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
        <div className="flex justify-around items-center py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="flex flex-col items-center justify-center px-3 py-2 transition-all duration-200 min-w-[60px]"
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-1 transition-colors duration-200" style={{ color: isActive ? '#5D5869' : '#9CA3AF' }} />
                  {item.id === 'profile' && isProfileIncomplete && (
                    <Star className="absolute -top-1 -right-1 w-3 h-3 fill-red-500 text-red-500" />
                  )}
                </div>
                <span className="text-xs font-medium transition-colors duration-200" style={{ color: isActive ? '#5D5869' : '#9CA3AF' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
