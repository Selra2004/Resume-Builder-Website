import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  BriefcaseIcon,
  ExclamationCircleIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { NotificationDetailModal } from './NotificationDetailModal';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'interview_reminder' | 'application_status' | 'system';
  related_id?: number;
  is_read: boolean;
  created_at: string;
  expires_at: string;
}

interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  interview_reminders: number;
  application_updates: number;
  system_notifications: number;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose, 
  className = '' 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'interview_reminder' | 'application_status'>('all');
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchStats();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const unreadOnly = filter === 'unread';
      const response = await api.get(`/notifications?unread_only=${unreadOnly}&limit=50`);
      
      let filteredNotifications = response.data.notifications;
      
      // Apply type filter
      if (filter === 'interview_reminder' || filter === 'application_status') {
        filteredNotifications = filteredNotifications.filter(
          (notif: Notification) => notif.type === filter
        );
      }
      
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
      // Don't show toast errors for stats to avoid spam
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          unread_count: Math.max(0, stats.unread_count - 1)
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          unread_count: 0
        });
      }
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update stats
      if (stats && deletedNotification) {
        setStats({
          ...stats,
          total_notifications: stats.total_notifications - 1,
          unread_count: deletedNotification.is_read 
            ? stats.unread_count 
            : Math.max(0, stats.unread_count - 1)
        });
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notificationId: number) => {
    setSelectedNotificationId(notificationId);
    setShowDetailModal(true);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedNotificationId(null);
  };

  const handleNotificationUpdate = (notificationId: number, updates: any) => {
    // Update the notification in local state
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, ...updates }
          : notif
      )
    );
    
    // Update stats if notification was marked as read
    if (updates.is_read && stats) {
      setStats({
        ...stats,
        unread_count: Math.max(0, stats.unread_count - 1)
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_reminder':
        return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case 'application_status':
        return <BriefcaseIcon className="h-5 w-5 text-green-500" />;
      case 'system':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${className}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <BellIconSolid className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {stats && stats.unread_count > 0 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {stats.unread_count} unread
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Stats & Filters */}
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All {stats && `(${stats.total_notifications})`}
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'unread' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread {stats && `(${stats.unread_count})`}
              </button>
              <button
                onClick={() => setFilter('interview_reminder')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'interview_reminder' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Interviews {stats && `(${stats.interview_reminders})`}
              </button>
              <button
                onClick={() => setFilter('application_status')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'application_status' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Applications {stats && `(${stats.application_updates})`}
              </button>
            </div>
            
            {stats && stats.unread_count > 0 && (
              <button
                onClick={markAllAsRead}
                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <CheckIcon className="h-4 w-4 inline mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <BellIcon className="h-12 w-12 mb-2" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(notification.created_at)}
                              </p>
                              <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                <EyeIcon className="h-3 w-3" />
                                <span>View Details</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 rounded hover:bg-red-100 transition-colors"
                          title="Delete notification"
                        >
                          <TrashIcon className="h-4 w-4 text-gray-500 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notificationId={selectedNotificationId}
        isOpen={showDetailModal}
        onClose={handleDetailModalClose}
        onNotificationUpdate={handleNotificationUpdate}
      />
    </>
  );
};
