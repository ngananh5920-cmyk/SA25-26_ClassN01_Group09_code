import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Bell, X, Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  type: 'leave_pending' | 'leave_approved' | 'leave_rejected' | 'salary_paid' | 'attendance_reminder';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    enabled: isOpen,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await api.put(`/notifications/${notification._id}/read`);
      refetch();
    }

    // Navigate if has link
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const markAllAsRead = async () => {
    await api.put('/notifications/read-all');
    refetch();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_pending':
      case 'leave_approved':
      case 'leave_rejected':
        return <Calendar className="text-blue-600" size={20} />;
      case 'salary_paid':
        return <DollarSign className="text-green-600" size={20} />;
      case 'attendance_reminder':
        return <Clock className="text-yellow-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-16 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification: Notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;

