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
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Gateway API functions
export const getGateways = async () => {
  try {
    const response = await api.get('/gateways');
    return response.data;
  } catch (error) {
    console.error('Error fetching gateways:', error);
    throw error;
  }
};

export const getGateway = async (gatewayId) => {
  try {
    const response = await api.get(`/gateways/${gatewayId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching gateway:', error);
    throw error;
  }
};

export const getGatewayDashboard = async (gatewayId, filters = {}) => {
  try {
    const response = await api.get(`/gateways/${gatewayId}/dashboard`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching gateway dashboard:', error);
    throw error;
  }
};

export const getGatewayTransactions = async (gatewayId, filters = {}) => {
  try {
    const response = await api.get(`/gateways/${gatewayId}/transactions`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching gateway transactions:', error);
    throw error;
  }
};

export const createGatewayTransaction = async (gatewayId, transactionData) => {
  try {
    const response = await api.post(`/gateways/${gatewayId}/transactions`, transactionData);
    return response.data;
  } catch (error) {
    console.error('Error creating gateway transaction:', error);
    throw error;
  }
};

// Utility functions
export const formatCurrency = (amount, currency = 'USD') => {
  // Use appropriate locale based on currency
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount || 0);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTransactionTypeColor = (type) => {
  switch (type) {
    case 'withdrawal': return 'bg-green-100 text-green-800';
    case 'bill': return 'bg-red-100 text-red-800';
    case 'transfer': return 'bg-blue-100 text-blue-800';
    case 'deposit': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default api;

