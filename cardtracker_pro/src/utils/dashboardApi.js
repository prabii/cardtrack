import axios from 'axios';
import { getAccessToken } from './auth';

// Import centralized API configuration
import { API_BASE_URL } from './apiConfig';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth header
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Get dashboard data with real-time stats
 */
export const getDashboardData = async () => {
  try {
    const response = await api.get('/reports/dashboard');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

/**
 * Get real-time activity feed
 */
export const getActivityFeed = async (limit = 50) => {
  try {
    const response = await api.get(`/reports/activity?limit=${limit}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    throw error;
  }
};

/**
 * Get online users
 */
export const getOnlineUsers = async () => {
  try {
    const response = await api.get('/users/online');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching online users:', error);
    throw error;
  }
};

/**
 * Get system alerts
 */
export const getSystemAlerts = async () => {
  try {
    const response = await api.get('/reports/alerts');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

export default api;
