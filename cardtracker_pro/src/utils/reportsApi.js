import axios from 'axios';
import { getAccessToken, clearTokens } from './auth';

// API base URL - dynamic based on environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isDevelopment 
  ? 'http://localhost:3003/api' 
  : 'https://cardtrack.onrender.com/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

// Create axios instance for reports API
const api = axios.create({
  baseURL: `${API_BASE_URL}/reports`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and access errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Log 403 errors for debugging but don't redirect
      console.error('Access denied (403):', error.response?.data?.message || 'You do not have permission to access this resource');
    }
    return Promise.reject(error);
  }
);

// Dashboard Reports
export const getDashboardReports = async (params = {}) => {
  try {
    const response = await api.get('/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Get dashboard reports error:', error);
    throw error;
  }
};

// Cardholder Reports
export const getCardholderReports = async (params = {}) => {
  try {
    const response = await api.get('/cardholders', { params });
    return response.data;
  } catch (error) {
    console.error('Get cardholder reports error:', error);
    throw error;
  }
};

// Transaction Reports
export const getTransactionReports = async (params = {}) => {
  try {
    const response = await api.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('Get transaction reports error:', error);
    throw error;
  }
};

// Bill Payment Reports
export const getBillPaymentReports = async (params = {}) => {
  try {
    const response = await api.get('/bill-payments', { params });
    return response.data;
  } catch (error) {
    console.error('Get bill payment reports error:', error);
    throw error;
  }
};

// Statement Reports
export const getStatementReports = async (params = {}) => {
  try {
    const response = await api.get('/statements', { params });
    return response.data;
  } catch (error) {
    console.error('Get statement reports error:', error);
    throw error;
  }
};

// Export Reports
export const exportReports = async (type, params = {}) => {
  try {
    const response = await api.get(`/export/${type}`, { 
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Export reports error:', error);
    throw error;
  }
};

// Download CSV file
export const downloadCSV = (data, filename) => {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Report Types
export const REPORT_TYPES = {
  DASHBOARD: 'dashboard',
  CARDHOLDERS: 'cardholders',
  TRANSACTIONS: 'transactions',
  BILL_PAYMENTS: 'bill-payments',
  STATEMENTS: 'statements'
};

// Export Formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf'
};

// Date Ranges
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
};

// Get date range for predefined ranges
export const getDateRange = (range) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case DATE_RANGES.TODAY:
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      };
    
    case DATE_RANGES.YESTERDAY:
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate: yesterday.toISOString(),
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      };
    
    case DATE_RANGES.THIS_WEEK:
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        startDate: startOfWeek.toISOString(),
        endDate: now.toISOString()
      };
    
    case DATE_RANGES.LAST_WEEK:
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return {
        startDate: lastWeekStart.toISOString(),
        endDate: new Date(lastWeekEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      };
    
    case DATE_RANGES.THIS_MONTH:
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: startOfMonth.toISOString(),
        endDate: now.toISOString()
      };
    
    case DATE_RANGES.LAST_MONTH:
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: lastMonthStart.toISOString(),
        endDate: new Date(lastMonthEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      };
    
    case DATE_RANGES.THIS_QUARTER:
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      return {
        startDate: startOfQuarter.toISOString(),
        endDate: now.toISOString()
      };
    
    case DATE_RANGES.LAST_QUARTER:
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const lastQuarterStart = new Date(now.getFullYear(), lastQuarter * 3, 1);
      const lastQuarterEnd = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0);
      return {
        startDate: lastQuarterStart.toISOString(),
        endDate: new Date(lastQuarterEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      };
    
    case DATE_RANGES.THIS_YEAR:
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: startOfYear.toISOString(),
        endDate: now.toISOString()
      };
    
    case DATE_RANGES.LAST_YEAR:
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return {
        startDate: lastYearStart.toISOString(),
        endDate: new Date(lastYearEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      };
    
    default:
      return null;
  }
};

export default api;
