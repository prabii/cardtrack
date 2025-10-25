import { useAuth } from '../contexts/AuthContext';

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @param {Object} user - User object (optional, will use current user if not provided)
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (permission, user = null) => {
  // If no user provided, we can't check permissions
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has the specific permission
  return user.permissions && user.permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @param {Object} user - User object (optional, will use current user if not provided)
 * @returns {boolean} - True if user has any of the permissions
 */
export const hasAnyPermission = (permissions, user = null) => {
  if (!user || !Array.isArray(permissions)) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has any of the specified permissions
  return permissions.some(permission => hasPermission(permission, user));
};

/**
 * Check if user has all of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @param {Object} user - User object (optional, will use current user if not provided)
 * @returns {boolean} - True if user has all permissions
 */
export const hasAllPermissions = (permissions, user = null) => {
  if (!user || !Array.isArray(permissions)) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has all of the specified permissions
  return permissions.every(permission => hasPermission(permission, user));
};

/**
 * Check if user has a specific role
 * @param {string|string[]} roles - Role(s) to check
 * @param {Object} user - User object (optional, will use current user if not provided)
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (roles, user = null) => {
  if (!user) return false;
  
  const userRole = user.role;
  if (!userRole) return false;
  
  // If roles is an array, check if user role is in the array
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  // If roles is a string, check if user role matches
  return userRole === roles;
};

/**
 * Get user's accessible modules based on role
 * @param {Object} user - User object (optional, will use current user if not provided)
 * @returns {string[]} - Array of accessible module names
 */
export const getAccessibleModules = (user = null) => {
  if (!user) return [];
  
  const moduleAccess = {
    admin: [
      'cardholders', 'bill_payments', 'gateways', 'reports', 
      'company', 'users', 'settings', 'statements', 'bank_data'
    ],
    manager: [
      'cardholders', 'bill_payments', 'reports', 'statements', 'bank_data'
    ],
    member: [
      'cardholders', 'bill_payments', 'statements', 'bank_data'
    ],
    gateway_manager: [
      'gateways', 'bill_payments', 'reports', 'bank_data'
    ]
  };
  
  return moduleAccess[user.role] || [];
};

/**
 * Check if user can access a specific module
 * @param {string} module - Module name to check
 * @param {Object} user - User object (optional, will use current user if not provided)
 * @returns {boolean} - True if user can access the module
 */
export const canAccessModule = (module, user = null) => {
  const accessibleModules = getAccessibleModules(user);
  return accessibleModules.includes(module);
};

// Permission constants for easy reference
export const PERMISSIONS = {
  // Cardholder permissions
  VIEW_CARDHOLDERS: 'view_cardholders',
  CREATE_CARDHOLDERS: 'create_cardholders',
  EDIT_CARDHOLDERS: 'edit_cardholders',
  DELETE_CARDHOLDERS: 'delete_cardholders',
  
  // Bill payment permissions
  VIEW_BILL_PAYMENTS: 'view_bill_payments',
  CREATE_BILL_PAYMENTS: 'create_bill_payments',
  PROCESS_BILL_PAYMENTS: 'process_bill_payments',
  
  // Gateway permissions
  VIEW_GATEWAYS: 'view_gateways',
  MANAGE_GATEWAYS: 'manage_gateways',
  
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  
  // Company permissions
  MANAGE_COMPANY: 'manage_company',
  
  // User permissions
  MANAGE_USERS: 'manage_users',
  
  // General permissions
  VIEW_ALL_DATA: 'view_all_data'
};

// Role constants for easy reference
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  GATEWAY_MANAGER: 'gateway_manager'
};

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  getAccessibleModules,
  canAccessModule,
  PERMISSIONS,
  ROLES
};
