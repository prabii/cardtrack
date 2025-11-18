import axios from 'axios';
import { getAccessToken, clearTokens } from './auth';

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
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Bill Payment API functions
export const getBillPayments = async (params = {}) => {
  try {
    const response = await api.get('/bill-payments', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    throw error;
  }
};

export const getBillPayment = async (billPaymentId) => {
  try {
    const response = await api.get(`/bill-payments/${billPaymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bill payment:', error);
    throw error;
  }
};

export const createBillPayment = async (billPaymentData) => {
  try {
    const response = await api.post('/bill-payments', billPaymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating bill payment:', error);
    throw error;
  }
};

export const updateBillPayment = async (billPaymentId, billPaymentData) => {
  try {
    const response = await api.put(`/bill-payments/${billPaymentId}`, billPaymentData);
    return response.data;
  } catch (error) {
    console.error('Error updating bill payment:', error);
    throw error;
  }
};

export const deleteBillPayment = async (billPaymentId) => {
  try {
    const response = await api.delete(`/bill-payments/${billPaymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting bill payment:', error);
    throw error;
  }
};

export const assignBillPayment = async (billPaymentId, notes = '') => {
  try {
    const response = await api.put(`/bill-payments/${billPaymentId}/assign`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error assigning bill payment:', error);
    throw error;
  }
};

export const startProcessingBillPayment = async (billPaymentId, notes = '') => {
  try {
    const response = await api.put(`/bill-payments/${billPaymentId}/start-processing`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error starting bill payment processing:', error);
    throw error;
  }
};

export const completeBillPayment = async (billPaymentId, paymentResult, notes = '') => {
  try {
    const response = await api.put(`/bill-payments/${billPaymentId}/complete`, {
      paymentResult,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error completing bill payment:', error);
    throw error;
  }
};

export const failBillPayment = async (billPaymentId, failureReason, notes = '') => {
  try {
    const response = await api.put(`/bill-payments/${billPaymentId}/fail`, {
      failureReason,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error failing bill payment:', error);
    throw error;
  }
};

export const markBillPaymentAsPaid = async (billPaymentId, gatewayId, transactionReference = '', notes = '') => {
  try {
    const response = await api.put(`/bill-payments/${billPaymentId}/mark-paid`, {
      gateway: gatewayId,
      transactionReference,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error marking bill payment as paid:', error);
    throw error;
  }
};

export const verifyBillPayment = async (billPaymentId, notes = '') => {
  try {
    const response = await api.put(`/bill-payments/${billPaymentId}/verify`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error verifying bill payment:', error);
    throw error;
  }
};

export const uploadBillPaymentAttachment = async (billPaymentId, file) => {
  try {
    const formData = new FormData();
    formData.append('attachment', file);

    const response = await api.post(`/bill-payments/${billPaymentId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

export const getOverdueBillPayments = async () => {
  try {
    const response = await api.get('/bill-payments/stats/overdue');
    return response.data;
  } catch (error) {
    console.error('Error fetching overdue bill payments:', error);
    throw error;
  }
};

export const getOperatorStats = async (operatorId, params = {}) => {
  try {
    const response = await api.get(`/bill-payments/stats/operator/${operatorId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    throw error;
  }
};

// Utility functions
export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'assigned': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-purple-100 text-purple-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    case 'disputed': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getBillerCategoryColor = (category) => {
  switch (category) {
    case 'utilities': return 'bg-blue-100 text-blue-800';
    case 'telecom': return 'bg-purple-100 text-purple-800';
    case 'insurance': return 'bg-green-100 text-green-800';
    case 'credit_card': return 'bg-red-100 text-red-800';
    case 'loan': return 'bg-orange-100 text-orange-800';
    case 'other': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getRequestTypeColor = (type) => {
  switch (type) {
    case 'bill_payment': return 'bg-blue-100 text-blue-800';
    case 'withdrawal': return 'bg-green-100 text-green-800';
    case 'transfer': return 'bg-purple-100 text-purple-800';
    case 'purchase': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
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

export const getDaysUntilDue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isOverdue = (dueDate, status) => {
  const daysUntilDue = getDaysUntilDue(dueDate);
  return daysUntilDue < 0 && ['pending', 'assigned', 'in_progress'].includes(status);
};

// Validation functions
export const validateBillPaymentData = (formData) => {
  const errors = {};
  
  if (!formData.cardholder) {
    errors.cardholder = 'Cardholder is required';
  }
  
  if (!formData.bank) {
    errors.bank = 'Bank is required';
  }
  
  if (!formData.requestType) {
    errors.requestType = 'Request type is required';
  }
  
  if (!formData.billDetails?.billerName?.trim()) {
    errors.billerName = 'Biller name is required';
  }
  
  if (!formData.billDetails?.billerAccount?.trim()) {
    errors.billerAccount = 'Biller account is required';
  }
  
  if (!formData.billDetails?.billerCategory) {
    errors.billerCategory = 'Biller category is required';
  }
  
  if (!formData.paymentDetails?.amount || formData.paymentDetails.amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!formData.paymentDetails?.paymentMethod) {
    errors.paymentMethod = 'Payment method is required';
  }
  
  if (!formData.paymentDetails?.dueDate) {
    errors.dueDate = 'Due date is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Biller categories for dropdown
export const billerCategories = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' }
];

// Request types for dropdown
export const requestTypes = [
  { value: 'bill_payment', label: 'Bill Payment' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'purchase', label: 'Purchase' }
];

// Payment methods for dropdown
export const paymentMethods = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' }
];

// Priority levels for dropdown
export const priorityLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export default api;
