import React, { useState } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import OnlineUsers from './OnlineUsers';
import RealtimeNotifications from './RealtimeNotifications';
import { 
  ChartBarIcon, 
  UsersIcon, 
  BellIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';

const RealtimeDashboard = () => {
  const { 
    connected, 
    onlineUsers, 
    userActivity, 
    notifications 
  } = useRealtime();
  
  const [activeTab, setActiveTab] = useState('activity');

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

  const getActivityIcon = (action) => {
    const icons = {
      viewed: '👁️',
      created: '➕',
      updated: '✏️',
      deleted: '🗑️',
      edited: '📝',
      processed: '⚡',
      completed: '✅',
      failed: '❌'
    };
    return icons[action] || '📊';
  };

  const getActivityColor = (action) => {
    const colors = {
      viewed: 'text-blue-600',
      created: 'text-green-600',
      updated: 'text-yellow-600',
      deleted: 'text-red-600',
      edited: 'text-purple-600',
      processed: 'text-orange-600',
      completed: 'text-green-600',
      failed: 'text-red-600'
    };
    return colors[action] || 'text-gray-600';
  };

  if (!connected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center text-gray-500">
          <SignalSlashIcon className="h-8 w-8 mr-2" />
          <span>Real-time features offline</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiIcon className="h-5 w-5 text-green-500" />
            <span className="font-medium text-gray-900">Real-time Connected</span>
          </div>
          <div className="text-sm text-gray-500">
            {onlineUsers.length} users online
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'activity', label: 'Activity', icon: ChartBarIcon },
              { id: 'users', label: 'Online Users', icon: UsersIcon },
              { id: 'notifications', label: 'Notifications', icon: BellIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'notifications' && notifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              {userActivity.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-2xl">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {activity.user.name}
                          </span>
                          <span className={`text-sm font-medium ${getActivityColor(activity.action)}`}>
                            {activity.action}
                          </span>
                          <span className="text-sm text-gray-500">
                            {activity.resource}
                          </span>
                        </div>
                        {activity.details && (
                          <div className="text-sm text-gray-600 mt-1">
                            {Object.entries(activity.details).map(([key, value]) => (
                              <span key={key} className="mr-4">
                                <span className="font-medium">{key}:</span> {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {formatTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Online Users
              </h3>
              <OnlineUsers />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notifications
              </h3>
              <RealtimeNotifications />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeDashboard;
