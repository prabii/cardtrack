import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';

// Get role-appropriate dashboard path
const getRoleDashboard = (role) => {
  const roleDashboards = {
    admin: '/dashboard',
    manager: '/dashboard',
    gateway_manager: '/dashboard',
    operator: '/dashboard',
    member: '/dashboard'
  };
  return roleDashboards[role] || '/dashboard';
};

const RoleBasedRoute = ({ children, allowedRoles = [], fallbackPath = null, showAccessDenied = false }) => {
  const { user } = useAuth();

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no roles are specified, allow all authenticated users
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is in the allowed roles
  if (allowedRoles.includes(user.role)) {
    return children;
  }

  // If user doesn't have permission
  if (showAccessDenied) {
    return <AccessDenied message={`Access denied. This page is only available to: ${allowedRoles.join(', ')}.`} />;
  }

  // Redirect to their role-appropriate dashboard
  const redirectPath = fallbackPath || getRoleDashboard(user.role);
  return <Navigate to={redirectPath} replace />;
};

export default RoleBasedRoute;
