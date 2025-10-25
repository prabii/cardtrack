import React, { useState } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { 
  UserGroupIcon, 
  WifiIcon, 
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const OnlineUsers = () => {
  const { onlineUsers, connected } = useRealtime();
  const [isExpanded, setIsExpanded] = useState(false);

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-green-100 text-green-800 border-green-200',
      gateway_manager: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!connected) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-500">
          <WifiIcon className="h-4 w-4" />
          <span className="text-sm">Offline</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">
            Online Users ({onlineUsers.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Online Users List */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-2 max-h-64 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No users online
            </div>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {user.user.name}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleColor(user.user.role)}`}>
                      {user.user.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.user.email}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
