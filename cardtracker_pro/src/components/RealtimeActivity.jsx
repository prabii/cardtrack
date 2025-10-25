import React, { useState, useEffect } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  EyeIcon, 
  PencilIcon, 
  UserGroupIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';

const RealtimeActivity = ({ resource, resourceId, showViewing = true, showTyping = true }) => {
  const { user } = useAuth();
  const { 
    connected, 
    getViewingUsers, 
    getTypingUsers, 
    trackViewing, 
    startTyping, 
    stopTyping 
  } = useRealtime();
  
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const viewingUsers = getViewingUsers(resource, resourceId);
  const typingUsers = getTypingUsers(resource, resourceId);

  useEffect(() => {
    // Track viewing when component mounts
    if (resource && resourceId) {
      trackViewing(resource, resourceId, 'viewing');
    }

    // Cleanup on unmount
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [resource, resourceId]);

  const handleTyping = (e) => {
    if (!connected || !resource || !resourceId) return;

    // Start typing
    if (!isTyping) {
      setIsTyping(true);
      startTyping(resource, resourceId);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      stopTyping(resource, resourceId);
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleBlur = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(resource, resourceId);
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <SignalSlashIcon className="h-4 w-4" />
        <span>Offline</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <WifiIcon className="h-4 w-4" />
        <span>Live</span>
      </div>

      {/* Viewing Users - Only show for admin */}
      {showViewing && viewingUsers.length > 0 && user?.role === 'admin' && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <EyeIcon className="h-4 w-4" />
          <div className="flex items-center gap-1">
            {viewingUsers.slice(0, 3).map((viewingUser, index) => (
              <span key={viewingUser.userId} className="font-medium">
                {viewingUser.user.name}
                {index < viewingUsers.length - 1 && index < 2 && ', '}
              </span>
            ))}
            {viewingUsers.length > 3 && (
              <span>and {viewingUsers.length - 3} others</span>
            )}
            <span>are viewing</span>
          </div>
        </div>
      )}

      {/* Typing Users - Only show for admin */}
      {showTyping && typingUsers.length > 0 && user?.role === 'admin' && (
        <div className="flex items-center gap-2 text-orange-600 text-sm">
          <PencilIcon className="h-4 w-4" />
          <div className="flex items-center gap-1">
            {typingUsers.slice(0, 2).map((typingUser, index) => (
              <span key={typingUser.userId} className="font-medium">
                {typingUser.user.name}
                {index < typingUsers.length - 1 && index < 1 && ', '}
              </span>
            ))}
            {typingUsers.length > 2 && (
              <span>and {typingUsers.length - 2} others</span>
            )}
            <span>are typing...</span>
          </div>
        </div>
      )}

      {/* Typing Handler for Input Fields */}
      {showTyping && (
        <input
          type="hidden"
          onInput={handleTyping}
          onBlur={handleBlur}
          style={{ position: 'absolute', left: '-9999px' }}
        />
      )}
    </div>
  );
};

export default RealtimeActivity;
