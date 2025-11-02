import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showCenter, setShowCenter] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 5 minutes (reduced from 2 minutes)
    const interval = setInterval(fetchUnreadCount, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    // Prevent multiple simultaneous requests
    if (loading) return;
    
    try {
      setLoading(true);
      const response = await api.get('/notifications/stats');
      setUnreadCount(response.data.unread_count || 0);
    } catch (error: any) {
      console.error('Error fetching notification count:', error);
      // Gracefully handle error by setting count to 0
      setUnreadCount(0);
      // Don't show toast error for notification polling to avoid spam
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowCenter(!showCenter);
  };

  const handleCenterClose = () => {
    setShowCenter(false);
    // Refresh after a delay to avoid immediate API call
    setTimeout(() => {
      if (!loading) {
        fetchUnreadCount();
      }
    }, 1000);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={handleBellClick}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          {unreadCount > 0 ? (
            <BellIconSolid className="h-6 w-6 text-blue-600" />
          ) : (
            <BellIcon className="h-6 w-6" />
          )}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] h-5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {loading && (
            <div className="absolute -top-1 -right-1">
              <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
            </div>
          )}
        </button>
      </div>

      <NotificationCenter
        isOpen={showCenter}
        onClose={handleCenterClose}
      />
    </>
  );
};
