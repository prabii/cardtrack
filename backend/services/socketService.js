const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          const allowedOrigins = [
            // Development origins
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3003',
            // Production origins
            process.env.FRONTEND_URL,
            'https://cardtrack-ke78.vercel.app',
            'https://cardtracker-pro.vercel.app',
            'https://cardtracker-pro.netlify.app',
            'https://cardtracker-pro.onrender.com',
          ].filter(Boolean);
          
          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          // Check regex patterns for Vercel, Netlify, Render
          if (/^https:\/\/.*\.vercel\.app$/.test(origin) ||
              /^https:\/\/.*\.netlify\.app$/.test(origin) ||
              /^https:\/\/.*\.onrender\.com$/.test(origin)) {
            return callback(null, true);
          }
          
          // Log blocked origin for debugging
          console.log('Socket.IO CORS: Blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userInfo
    this.roomUsers = new Map(); // roomId -> Set of userIds

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // User connected
      
      // Check if user already has a connection and disconnect the old one
      if (this.connectedUsers.has(socket.userId)) {
        const oldSocketId = this.connectedUsers.get(socket.userId);
        const oldSocket = this.io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          // Disconnecting old socket
          oldSocket.disconnect();
        }
        // Clean up the old connection
        this.userSockets.delete(oldSocketId);
      }

      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, {
        userId: socket.userId,
        user: socket.user,
        connectedAt: new Date()
      });

      // Update user online status
      this.updateUserOnlineStatus(socket.userId, true);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Join user to role-based rooms
      this.joinRoleBasedRooms(socket);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to real-time updates',
        userId: socket.userId,
        user: socket.user
      });

      // Notify others about user coming online
      socket.broadcast.emit('user_online', {
        userId: socket.userId,
        user: {
          id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        }
      });

      // Join alerts module room for real-time alerts
      socket.join('module_alerts');

      // Handle joining specific rooms
      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        this.addUserToRoom(roomId, socket.userId);
        console.log(`User ${socket.userId} joined room: ${roomId}`);
        socket.emit('joined_room', { roomId });
      });

      // Handle leaving rooms
      socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        this.removeUserFromRoom(roomId, socket.userId);
        socket.emit('left_room', { roomId });
      });

      // Handle activity updates
      socket.on('activity_update', (data) => {
        // Received activity update
        this.broadcastActivity(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.broadcastTyping(socket, data, true);
      });

      socket.on('typing_stop', (data) => {
        this.broadcastTyping(socket, data, false);
      });

      // Handle viewing indicators
      socket.on('viewing', (data) => {
        this.broadcastViewing(socket, data);
      });

      // Handle editing indicators
      socket.on('editing_start', (data) => {
        this.broadcastEditing(socket, data, true);
      });

      socket.on('editing_stop', (data) => {
        this.broadcastEditing(socket, data, false);
      });

      // Handle getting online users
      socket.on('get_online_users', () => {
        // Get unique users (deduplicate by userId)
        const userMap = new Map();
        Array.from(this.userSockets.values()).forEach(userSocket => {
          if (!userMap.has(userSocket.userId)) {
            userMap.set(userSocket.userId, {
              userId: userSocket.userId,
              user: userSocket.user,
              connectedAt: userSocket.connectedAt
            });
          }
        });
        
        const onlineUsers = Array.from(userMap.values());
        // Sending online users
        socket.emit('online_users', onlineUsers);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        // User disconnected
        this.handleDisconnect(socket);
      });
    });
  }

  joinRoleBasedRooms(socket) {
    const user = socket.user;
    
    // Join role-based rooms
    socket.join(`role_${user.role}`);
    
    // Join module-based rooms based on permissions
    const accessibleModules = user.getAccessibleModules();
    accessibleModules.forEach(module => {
      socket.join(`module_${module}`);
    });

    // Join admin room if admin
    if (user.role === 'admin') {
      socket.join('admin_room');
    }
  }

  addUserToRoom(roomId, userId) {
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId).add(userId);
  }

  removeUserFromRoom(roomId, userId) {
    if (this.roomUsers.has(roomId)) {
      this.roomUsers.get(roomId).delete(userId);
      if (this.roomUsers.get(roomId).size === 0) {
        this.roomUsers.delete(roomId);
      }
    }
  }

  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastActivity: new Date()
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  broadcastActivity(socket, data) {
    const { resource, action, resourceId, details } = data;
    
    // Broadcasting activity
    
    // Broadcast to relevant rooms
    const rooms = [
      `role_${socket.user.role}`,
      `module_${resource}`,
      `user_${socket.userId}`
    ];

    // Add global broadcast for admins to see all activities
    if (socket.user.role === 'admin') {
      rooms.push('admin_room');
    }

    // Broadcasting to rooms

    const activityData = {
      userId: socket.userId,
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      resource,
      action,
      resourceId,
      details,
      timestamp: new Date()
    };

    rooms.forEach(room => {
      // Sending to room
      socket.to(room).emit('user_activity', activityData);
    });

    // Also broadcast to all connected users for admin visibility
    if (socket.user.role !== 'admin') {
      // If it's not an admin, also broadcast to admin room so admins can see it
      socket.to('admin_room').emit('user_activity', activityData);
    }

    // Send notification only for significant activities (not viewing)
    if (action && (action.includes('add') || action.includes('edit') || action.includes('delete')) && !action.includes('viewed')) {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'activity',
        title: `${socket.user.name} ${action} ${resource}`,
        message: `${action} ${resource} ${resourceId}`,
        details: `Role: ${socket.user.role}`,
        timestamp: new Date()
      };

      rooms.forEach(room => {
        socket.to(room).emit('notification', notification);
      });

      // Also send to admin room for admin visibility
      if (socket.user.role !== 'admin') {
        socket.to('admin_room').emit('notification', notification);
      }
    }
  }

  broadcastTyping(socket, data, isTyping) {
    const { resource, resourceId } = data;
    
    socket.to(`module_${resource}`).emit('typing_indicator', {
      userId: socket.userId,
      user: {
        id: socket.user._id,
        name: socket.user.name
      },
      resource,
      resourceId,
      isTyping,
      timestamp: new Date()
    });
  }

  broadcastViewing(socket, data) {
    const { resource, resourceId, action } = data;
    
    // Broadcast to module room and also to the specific resource room
    const moduleRoom = `module_${resource}`;
    const resourceRoom = `${resource}_${resourceId}`;
    
    // Emit to module room (all users viewing any cardholder)
    socket.to(moduleRoom).emit('viewing_indicator', {
      userId: socket.userId,
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      resource,
      resourceId,
      action,
      timestamp: new Date()
    });
    
    // Also emit to specific resource room
    socket.to(resourceRoom).emit('viewing_indicator', {
      userId: socket.userId,
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      resource,
      resourceId,
      action,
      timestamp: new Date()
    });

    console.log(`📡 Broadcasting viewing indicator: ${socket.user.name} viewing ${resource} ${resourceId}`);
  }

  broadcastEditing(socket, data, isEditing) {
    const { resource, resourceId } = data;
    
    const moduleRoom = `module_${resource}`;
    const resourceRoom = `${resource}_${resourceId}`;
    
    // Broadcast to module room (all users viewing any cardholder)
    socket.to(moduleRoom).emit('editing_indicator', {
      userId: socket.userId,
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      resource,
      resourceId,
      isEditing,
      timestamp: new Date()
    });
    
    // Also emit to specific resource room
    socket.to(resourceRoom).emit('editing_indicator', {
      userId: socket.userId,
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      resource,
      resourceId,
      isEditing,
      timestamp: new Date()
    });
    
    console.log(`📡 Broadcasting editing indicator: ${socket.user.name} ${isEditing ? 'started' : 'stopped'} editing ${resource} ${resourceId}`);
  }

  handleDisconnect(socket) {
    const userId = socket.userId;
    
    // Remove from connected users
    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);

    // Update user online status
    this.updateUserOnlineStatus(userId, false);

    // Notify others about user going offline
    socket.broadcast.emit('user_offline', {
      userId,
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      }
    });

    // Remove from all rooms
    this.roomUsers.forEach((userSet, roomId) => {
      userSet.delete(userId);
      if (userSet.size === 0) {
        this.roomUsers.delete(roomId);
      }
    });
  }

  // Public methods for broadcasting from other parts of the app
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  broadcastToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  broadcastToRole(role, event, data) {
    this.io.to(`role_${role}`).emit(event, data);
  }

  broadcastToModule(module, event, data) {
    this.io.to(`module_${module}`).emit(event, data);
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  getConnectedUsers() {
    return Array.from(this.userSockets.values());
  }

  getUsersInRoom(roomId) {
    const userIds = this.roomUsers.get(roomId) || new Set();
    return Array.from(userIds).map(userId => {
      const socketId = this.connectedUsers.get(userId);
      return this.userSockets.get(socketId);
    }).filter(Boolean);
  }

  // Broadcast alert to relevant users
  broadcastAlert(alertData) {
    const { type, priority, roles = ['admin', 'manager', 'operator'] } = alertData;
    
    // Broadcast to roles that should see this alert
    roles.forEach(role => {
      this.io.to(`role_${role}`).emit('alert', {
        ...alertData,
        timestamp: new Date()
      });
    });

    // Also broadcast to alerts module room
    this.io.to('module_alerts').emit('alert', {
      ...alertData,
      timestamp: new Date()
    });

    // Send notification for high priority alerts
    if (priority === 'high') {
      this.io.to('admin_room').emit('notification', {
        id: Date.now() + Math.random(),
        type: 'alert',
        title: alertData.title || 'New Alert',
        message: alertData.message || '',
        priority: alertData.priority,
        timestamp: new Date()
      });
    }
  }

  // Get socket service instance for use in routes
  static getInstance() {
    return this.instance;
  }
}

module.exports = SocketService;
