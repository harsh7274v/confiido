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
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-10px);
          }
        }

        .sidebar-container {
          animation: slideIn 0.4s ease-out;
        }

        .sidebar-label-enter {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .sidebar-label-exit {
          animation: fadeOut 0.2s ease-out forwards;
        }

        .collapse-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
             {/* Desktop Sidebar */}
       <div className="hidden lg:block">
                                                                           <div className={`sidebar-container bg-gray-200 h-full min-h-screen collapse-transition ${
              isCollapsed ? 'w-20' : 'w-64'
            } flex flex-col shadow-lg`}>
                     {/* Header with user name and collapse button */}
           <div className={`border-b border-gray-200 collapse-transition ${isCollapsed ? 'p-3' : 'p-4'}`}>
             <div className="flex items-center justify-between">
               {!isCollapsed && (
                 <h2 className="text-lg font-bold text-gray-800 sidebar-label-enter">{userName}.</h2>
               )}
               <button
                 onClick={toggleCollapse}
                 className={`p-2 rounded-full border collapse-transition hover:scale-110 active:scale-95 ${
                   isCollapsed ? 'mx-auto' : ''
                 }`}
                 style={{ borderColor: '#5E936C' }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = '#5E936C20';
                   e.currentTarget.style.transform = 'scale(1.1) rotate(360deg)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = 'transparent';
                   e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                 }}
               >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 collapse-transition" style={{ color: '#5E936C' }} />
                ) : (
                  <ChevronLeft className="w-4 h-4 collapse-transition" style={{ color: '#5E936C' }} />
                )}
              </button>
            </div>
          </div>

                     {/* Navigation items */}
           <nav className={`flex-1 space-y-2 collapse-transition ${isCollapsed ? 'p-2' : 'p-4'}`}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                                                  <button
                   key={item.id}
                   onClick={() => handleItemClick(item.id)}
                   className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg collapse-transition hover:scale-105 active:scale-95 ${
                     isActive
                       ? 'text-white shadow-lg'
                       : 'text-gray-700 hover:bg-gray-200'
                   } ${isCollapsed ? 'justify-center px-2' : ''}`}
                   style={isActive ? { backgroundColor: '#5E936C' } : {}}
                 >
                   <Icon className={`w-6 h-6 collapse-transition ${
                     isActive ? 'text-white' : 'text-current'
                   }`} />
                   {!isCollapsed && (
                     <span className="font-medium sidebar-label-enter">{item.label}</span>
                   )}
                 </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50" style={{ animation: 'slideIn 0.4s ease-out' }}>
        <div className="flex justify-around items-center py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
                             <button
                 key={item.id}
                 onClick={() => handleItemClick(item.id)}
                 className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg collapse-transition hover:scale-110 active:scale-95 min-w-[60px] ${
                   isActive
                     ? 'text-white'
                     : 'text-gray-700 hover:bg-gray-100'
                 }`}
                 style={isActive ? { backgroundColor: '#5E936C' } : {}}
               >
                 <Icon className={`w-5 h-5 mb-1 collapse-transition ${
                   isActive ? 'text-white' : 'text-current'
                 }`} />
                 <span className={`text-xs font-medium collapse-transition ${
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
