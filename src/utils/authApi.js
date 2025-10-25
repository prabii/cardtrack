import axios from 'axios';
import { generateTokens, storeTokens, clearTokens, addAuthHeader, handleTokenExpiration } from './auth';

// API base URL (in production, this should be your backend URL)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cardtrack.onrender.com/api';
console.log('[AuthAPI] Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth header
api.interceptors.request.use(addAuthHeader, (error) => Promise.reject(error));

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  handleTokenExpiration
);

/**
 * Mock user database (in production, this would be your backend)
 */
const mockUsers = [
  {
    id: 1,
    email: 'demo@example.com',
    password: 'password123',
    name: 'Demo User',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    createdAt: new Date().toISOString(),
  }
];

/**
 * Simulate API delay
 * @param {number} ms - Delay in milliseconds
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} - User data and tokens
 */
export const loginUser = async (credentials) => {
  try {
    console.log('[AuthAPI] Login request:', { email: credentials?.email });
    const response = await api.post('/auth/login', credentials);
    console.log('[AuthAPI] Login response:', response.status, response.data);
    
    if (response.data.success) {
      // Store tokens
      storeTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      
      return {
        success: true,
        user: response.data.user,
        tokens: response.data.tokens
      };
    }
    
    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    if (error?.response) {
      console.error('[AuthAPI] Login error response:', error.response.status, error.response.data);
    } else {
      console.error('[AuthAPI] Login error:', error?.message || error);
    }
    throw error;
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} - User data and tokens
 */
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    if (response.data.success) {
      // Store tokens
      storeTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      
      return {
        success: true,
        user: response.data.user,
        tokens: response.data.tokens
      };
    }
    
    throw new Error(response.data.message || 'Registration failed');
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout user
 * @returns {Promise<Object>} - Success response
 */
export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
    clearTokens();
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    // Clear tokens even if API call fails
    clearTokens();
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} - User profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    // Simulate API delay
    await delay(500);
    
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserProfile = async (profileData) => {
  try {
    // Simulate API delay
    await delay(1000);
    
    const response = await api.put('/user/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} - Success response
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/user/password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

/**
 * Forgot password request with OTP
 * @param {string} email - User email
 * @returns {Promise<Object>} - Success response with OTP
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Verify OTP for password reset
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} - Success response
 */
export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

/**
 * Reset password with OTP
 * @param {Object} resetData - Password reset data
 * @param {string} resetData.email - User email
 * @param {string} resetData.otp - Verified OTP
 * @param {string} resetData.newPassword - New password
 * @returns {Promise<Object>} - Success response
 */
export const resetPassword = async (resetData) => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

/**
 * Refresh user permissions (for logged-in users)
 * @returns {Promise<Object>} - Updated user data with permissions
 */
export const refreshPermissions = async () => {
  try {
    const response = await api.post('/auth/refresh-permissions');
    return response.data;
  } catch (error) {
    console.error('Refresh permissions error:', error);
    throw error;
  }
};

// Export the configured axios instance for other API calls
export { api };
