const User = require('../models/User');

// Middleware to check if user has required role
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if user has required role
      if (!user.hasAnyRole(Array.isArray(roles) ? roles : [roles])) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required role: ${roles}` 
        });
      }

      // Update user activity
      await user.updateActivity();
      
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  };
};

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if user has required permission
      if (!user.hasPermission(permission)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required permission: ${permission}` 
        });
      }

      // Update user activity
      await user.updateActivity();
      
      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  };
};

// Middleware to check if user can access module
const requireModuleAccess = (module) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if user can access module
      const accessibleModules = user.getAccessibleModules();
      if (!accessibleModules.includes(module)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Module '${module}' not accessible` 
        });
      }

      // Update user activity
      await user.updateActivity();
      
      next();
    } catch (error) {
      console.error('Module access middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  };
};

// Admin only middleware
const requireAdmin = requireRole('admin');

// Manager or Admin middleware
const requireManager = requireRole(['admin', 'manager']);

// Any authenticated user middleware
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};

module.exports = {
  requireRole,
  requirePermission,
  requireModuleAccess,
  requireAdmin,
  requireManager,
  requireAuth
};
