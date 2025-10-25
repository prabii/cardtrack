import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../utils/auth';

const RealtimeContext = createContext();

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [viewingUsers, setViewingUsers] = useState(new Map());
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const lastActivityTime = useRef(0);
  const lastOnlineUsersUpdate = useRef(0);
  const lastUserActivityUpdate = useRef(0);
  const onlineUsersThrottleMs = 2000; // 2 seconds
  const userActivityThrottleMs = 1000; // 1 second

  useEffect(() => {
    const authToken = getAccessToken();
    if (user && authToken && !socket) {
      initializeSocket();
    } else if (!user || !authToken) {
      disconnectSocket();
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const initializeSocket = () => {
    if (socket) {
      socket.disconnect();
    }

    const authToken = getAccessToken();
    const newSocket = io('https://cardtrack.onrender.com', {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setSocket(newSocket);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        attemptReconnect();
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err?.message || err);
    });

    newSocket.on('connected', (data) => {
      // Request initial list of online users
      newSocket.emit('get_online_users');
    });

    newSocket.on('user_online', (data) => {
      const now = Date.now();
      if (now - lastOnlineUsersUpdate.current < onlineUsersThrottleMs) {
        return; // Skip if too recent
      }
      lastOnlineUsersUpdate.current = now;
      
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    newSocket.on('user_offline', (data) => {
      const now = Date.now();
      if (now - lastOnlineUsersUpdate.current < onlineUsersThrottleMs) {
        return; // Skip if too recent
      }
      lastOnlineUsersUpdate.current = now;
      
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    newSocket.on('online_users', (data) => {
      console.log('📡 Received online_users from socket:', data);
      setOnlineUsers(data);
    });

    newSocket.on('user_activity', (data) => {
      const now = Date.now();
      if (now - lastUserActivityUpdate.current < userActivityThrottleMs) {
        return; // Skip if too recent
      }
      lastUserActivityUpdate.current = now;
      
      setUserActivity(prev => {
        // Enhanced deduplication - check for exact same activity
        const exists = prev.some(activity => 
          activity.userId === data.userId && 
          activity.resource === data.resource && 
          activity.action === data.action &&
          activity.resourceId === data.resourceId &&
          Math.abs(new Date(activity.timestamp) - new Date(data.timestamp)) < 5000 // Within 5 seconds
        );
        
        if (exists) {
          return prev; // Don't add duplicate
        }
        
        return [data, ...prev.slice(0, 49)]; // Keep last 50 activities
      });
    });

    newSocket.on('typing_indicator', (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(`${data.resource}_${data.resourceId}_${data.userId}`, data);
        } else {
          newMap.delete(`${data.resource}_${data.resourceId}_${data.userId}`);
        }
        return newMap;
      });
    });

    newSocket.on('viewing_indicator', (data) => {
      setViewingUsers(prev => {
        const newMap = new Map(prev);
        const key = `${data.resource}_${data.resourceId}`;
        const current = newMap.get(key) || [];
        const exists = current.find(u => u.userId === data.userId);
        
        if (!exists) {
          newMap.set(key, [...current, data]);
        }
        
        return newMap;
      });
    });

    newSocket.on('notification', (data) => {
      console.log('🔔 New notification:', data);
      setNotifications(prev => [data, ...prev.slice(0, 99)]); // Keep last 100 notifications
    });

    newSocket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });

    setSocket(newSocket);
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('🔌 Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;

    console.log(`🔌 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      const authToken = getAccessToken();
      if (user && authToken) {
        initializeSocket();
      }
    }, delay);
  };

  const disconnectSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setConnected(false);
    setOnlineUsers([]);
    setUserActivity([]);
    setTypingUsers(new Map());
    setViewingUsers(new Map());
  };

  // Activity tracking functions - All users
  const trackActivity = (resource, action, resourceId, details = {}) => {
    if (socket && connected && user) {
      const now = Date.now();
      
      // Enhanced throttling - only allow one activity per 5 seconds
      if (now - lastActivityTime.current < 5000) {
        return; // Skip if too recent
      }
      
      lastActivityTime.current = now;
      
      socket.emit('activity_update', {
        resource,
        action,
        resourceId,
        details
      });
    }
  };

  const trackViewing = (resource, resourceId, action = 'viewing') => {
    if (socket && connected && user) {
      const now = Date.now();
      
      // Throttle viewing updates - only allow one per 10 seconds
      if (now - lastActivityTime.current < 10000) {
        return; // Skip if too recent
      }
      
      lastActivityTime.current = now;
      
      socket.emit('viewing', {
        resource,
        resourceId,
        action
      });
    }
  };

  const startTyping = (resource, resourceId) => {
    if (socket && connected && user) {
      const now = Date.now();
      
      // Throttle typing indicators - only allow one per 3 seconds
      if (now - lastActivityTime.current < 3000) {
        return; // Skip if too recent
      }
      
      lastActivityTime.current = now;
      
      socket.emit('typing_start', {
        resource,
        resourceId
      });
    }
  };

  const stopTyping = (resource, resourceId) => {
    if (socket && connected && user) {
      socket.emit('typing_stop', {
        resource,
        resourceId
      });
    }
  };

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave_room', roomId);
    }
  };

  const getTypingUsers = (resource, resourceId) => {
    const key = `${resource}_${resourceId}`;
    return Array.from(typingUsers.values()).filter(
      user => user.resource === resource && user.resourceId === resourceId
    );
  };

  const getViewingUsers = (resource, resourceId) => {
    const key = `${resource}_${resourceId}`;
    return viewingUsers.get(key) || [];
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 99)]);
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    userActivity,
    typingUsers,
    viewingUsers,
    notifications,
    trackActivity,
    trackViewing,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
    getTypingUsers,
    getViewingUsers,
    clearNotifications,
    addNotification
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
