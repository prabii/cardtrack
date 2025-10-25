import axios from 'axios';
import { getAccessToken, clearTokens } from './auth';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

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
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Bank API functions
export const getBanks = async (params = {}) => {
  try {
    const response = await api.get('/banks', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw error;
  }
};

export const getBank = async (bankId) => {
  try {
    const response = await api.get(`/banks/${bankId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bank:', error);
    throw error;
  }
};

export const createBank = async (bankData) => {
  try {
    const response = await api.post('/banks', bankData);
    return response.data;
  } catch (error) {
    console.error('Error creating bank:', error);
    throw error;
  }
};

export const updateBank = async (bankId, bankData) => {
  try {
    const response = await api.put(`/banks/${bankId}`, bankData);
    return response.data;
  } catch (error) {
    console.error('Error updating bank:', error);
    throw error;
  }
};

export const deleteBank = async (bankId) => {
  try {
    const response = await api.delete(`/banks/${bankId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting bank:', error);
    throw error;
  }
};

export const getBankTransactions = async (bankId, params = {}) => {
  try {
    const response = await api.get(`/banks/${bankId}/transactions`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    throw error;
  }
};

export const updateBankSummary = async (bankId) => {
  try {
    const response = await api.put(`/banks/${bankId}/update-summary`);
    return response.data;
  } catch (error) {
    console.error('Error updating bank summary:', error);
    throw error;
  }
};

// Transaction API functions
export const getTransactions = async (params = {}) => {
  try {
    const response = await api.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransaction = async (transactionId) => {
  try {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};

export const verifyTransaction = async (transactionId, notes = '') => {
  try {
    const response = await api.put(`/transactions/${transactionId}/verify`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    throw error;
  }
};

export const rejectTransaction = async (transactionId, notes = '') => {
  try {
    const response = await api.put(`/transactions/${transactionId}/reject`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    throw error;
  }
};

export const classifyTransaction = async (transactionId, category, confidence = 0, notes = '') => {
  try {
    const response = await api.put(`/transactions/${transactionId}/classify`, {
      category,
      confidence,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error classifying transaction:', error);
    throw error;
  }
};

export const disputeTransaction = async (transactionId, notes = '') => {
  try {
    const response = await api.put(`/transactions/${transactionId}/dispute`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error disputing transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const response = await api.put(`/transactions/${transactionId}`, transactionData);
    return response.data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    const response = await api.delete(`/transactions/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const bulkVerifyTransactions = async (transactionIds, notes = '') => {
  try {
    const response = await api.post('/transactions/bulk-verify', {
      transactionIds,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk verifying transactions:', error);
    throw error;
  }
};

export const bulkClassifyTransactions = async (transactionIds, category, confidence = 0, notes = '') => {
  try {
    const response = await api.post('/transactions/bulk-classify', {
      transactionIds,
      category,
      confidence,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk classifying transactions:', error);
    throw error;
  }
};

export const getVerificationStats = async (params = {}) => {
  try {
    const response = await api.get('/transactions/stats/verification', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    throw error;
  }
};

// Utility functions
export const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'suspended': return 'bg-yellow-100 text-yellow-800';
    case 'closed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getVerificationStatusColor = (isVerified, status) => {
  if (isVerified) return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  if (status === 'disputed') return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

export const getCategoryColor = (category) => {
  switch (category) {
    case 'orders': return 'bg-blue-100 text-blue-800';
    case 'bills': return 'bg-green-100 text-green-800';
    case 'withdrawals': return 'bg-purple-100 text-purple-800';
    case 'fees': return 'bg-red-100 text-red-800';
    case 'personal': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
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

// Validation functions
export const validateBankData = (formData) => {
  const errors = {};
  
  if (!formData.cardholder) {
    errors.cardholder = 'Cardholder is required';
  }
  
  if (!formData.bankName?.trim()) {
    errors.bankName = 'Bank name is required';
  }
  
  if (!formData.cardNumber?.trim()) {
    errors.cardNumber = 'Card number is required';
  } else if (formData.cardNumber.length < 4) {
    errors.cardNumber = 'Card number must be at least 4 digits';
  }
  
  if (!formData.cardType) {
    errors.cardType = 'Card type is required';
  }
  
  if (!formData.cardLimit || formData.cardLimit <= 0) {
    errors.cardLimit = 'Card limit must be greater than 0';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

export const validateTransactionData = (formData) => {
  const errors = {};
  
  if (!formData.bank) {
    errors.bank = 'Bank is required';
  }
  
  if (!formData.description?.trim()) {
    errors.description = 'Description is required';
  }
  
  if (!formData.amount || formData.amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!formData.category) {
    errors.category = 'Category is required';
  }
  
  if (!formData.transactionDate) {
    errors.transactionDate = 'Transaction date is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

export default api;
