"use client";

import React, { useState } from 'react';
import { 
  Home, 
  Target, 
  Gift, 
  User, 
  CreditCard, 
  Mail,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wallet
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userName = "Aakash",
  onProfileClick,
  onSessionsClick,
  onHomeClick,
  onTransactionsClick,
  onContactClick,
  onRewardsClick,
  onPaymentsClick
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('profile');

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
    { id: 'sessions', label: 'Sessions', icon: Calendar, path: '/sessions' },
    { id: 'payments', label: 'Payments', icon: Wallet, path: '/payments' },
    { id: 'rewards', label: 'Rewards', icon: Gift, path: '/rewards' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, path: '/transactions' },
    { id: 'contact', label: 'Contact', icon: Mail, path: '/contact' },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

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

  return (
    <>
             {/* Desktop Sidebar */}
       <div className="hidden lg:block">
                                                                           <div className={`bg-gray-200 h-full min-h-screen transition-all duration-300 ${
              isCollapsed ? 'w-20' : 'w-64'
            } flex flex-col shadow-lg`}>
                     {/* Header with user name and collapse button */}
           <div className={`border-b border-gray-200 ${isCollapsed ? 'p-3' : 'p-4'}`}>
             <div className="flex items-center justify-between">
               {!isCollapsed && (
                 <h2 className="text-lg font-bold text-gray-800">{userName}.</h2>
               )}
               <button
                 onClick={toggleCollapse}
                 className={`p-2 rounded-full border transition-colors ${
                   isCollapsed ? 'mx-auto' : ''
                 }`}
                 style={{ borderColor: '#5E936C' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5E936C20'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
               >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" style={{ color: '#5E936C' }} />
                ) : (
                  <ChevronLeft className="w-4 h-4" style={{ color: '#5E936C' }} />
                )}
              </button>
            </div>
          </div>

                     {/* Navigation items */}
           <nav className={`flex-1 space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                                                  <button
                   key={item.id}
                   onClick={() => handleItemClick(item.id)}
                   className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                     isActive
                       ? 'text-white shadow-lg'
                       : 'text-gray-700 hover:bg-gray-200'
                   } ${isCollapsed ? 'justify-center px-2' : ''}`}
                   style={isActive ? { backgroundColor: '#5E936C' } : {}}
                 >
                   <Icon className={`w-6 h-6 ${
                     isActive ? 'text-white' : 'text-current'
                   }`} />
                   {!isCollapsed && (
                     <span className="font-medium">{item.label}</span>
                   )}
                 </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
                             <button
                 key={item.id}
                 onClick={() => handleItemClick(item.id)}
                 className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                   isActive
                     ? 'text-white'
                     : 'text-gray-700 hover:bg-gray-100'
                 }`}
                 style={isActive ? { backgroundColor: '#5E936C' } : {}}
               >
                 <Icon className={`w-5 h-5 mb-1 ${
                   isActive ? 'text-white' : 'text-current'
                 }`} />
                 <span className={`text-xs font-medium ${
                   isActive ? 'text-white' : 'text-current'
                 }`}>
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
