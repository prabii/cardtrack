import React, { useState, useEffect } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { 
  BellIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const RealtimeNotifications = () => {
  const { notifications, clearNotifications, addNotification } = useRealtime();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  const getNotificationIcon = (type) => {
    const icons = {
      success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      error: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
      warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
      info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
      default: <BellIcon className="h-5 w-5 text-gray-500" />
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: 'bg-green-50 border-green-200',
      error: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200',
      default: 'bg-gray-50 border-gray-200'
    };
    return colors[type] || colors.default;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const handleClearAll = () => {
    clearNotifications();
    setIsOpen(false);
  };

  const handleNotificationClick = (notification) => {
    // Handle notification click (e.g., navigate to relevant page)
    console.log('Notification clicked:', notification);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <CheckIcon className="h-4 w-4" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={index}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title || 'Notification'}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.details && (
                        <div className="mt-2 text-xs text-gray-500">
                          {notification.details.resource && (
                            <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                              {notification.details.resource}
                            </span>
                          )}
                          {notification.details.action && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {notification.details.action}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClearAll}
                className="w-full text-sm text-gray-600 hover:text-gray-800 text-center"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeNotifications;
