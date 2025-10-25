import React, { useState, useEffect } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { 
  BellIcon, 
  XMarkIcon, 
  EyeIcon, 
  PencilIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const RealtimeNotification = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'viewing':
        return <EyeIcon className="w-5 h-5 text-blue-500" />;
      case 'editing':
        return <PencilIcon className="w-5 h-5 text-orange-500" />;
      case 'activity':
        return <UserGroupIcon className="w-5 h-5 text-green-500" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'viewing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'editing':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'activity':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${getNotificationColor(notification.type)} transform transition-all duration-300 ease-in-out`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {notification.title}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {notification.message}
            </p>
            {notification.details && (
              <p className="mt-1 text-xs opacity-75">
                {notification.details}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss(notification.id), 300);
              }}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RealtimeNotificationContainer = () => {
  const { notifications, clearNotifications } = useRealtime();
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

  const handleDismiss = (notificationId) => {
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
  };

  const visibleNotifications = notifications.filter(
    notification => !dismissedNotifications.has(notification.id)
  );

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification) => (
        <RealtimeNotification
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};

export default RealtimeNotificationContainer;
