import axios from 'axios';
import { getAccessToken, clearTokens } from './auth';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cardtrack.onrender.com/api';

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
    console.log('Cardholder API - Token found:', !!token);
    console.log('Cardholder API - Token value:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Cardholder API - Authorization header set');
    } else {
      console.log('Cardholder API - No token available, request will fail');
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
      // Clear tokens using the proper function
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Get all cardholders with optional search and filter
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term
 * @param {string} params.status - Filter by status
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} - Cardholders data with pagination
 */
export const getCardholders = async (params = {}) => {
  try {
    const response = await api.get('/cardholders', { params });
    return response.data;
  } catch (error) {
    console.error('Get cardholders error:', error);
    throw error;
  }
};

/**
 * Get single cardholder by ID
 * @param {string} id - Cardholder ID
 * @returns {Promise<Object>} - Cardholder data with related information
 */
export const getCardholder = async (id) => {
  try {
    const response = await api.get(`/cardholders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get cardholder error:', error);
    throw error;
  }
};

/**
 * Create new cardholder
 * @param {Object} cardholderData - Cardholder data
 * @param {string} cardholderData.name - Full name
 * @param {string} cardholderData.email - Email address
 * @param {string} cardholderData.phone - Phone number
 * @param {string} cardholderData.address - Address
 * @param {string} cardholderData.dob - Date of birth
 * @param {string} cardholderData.fatherName - Father's name
 * @param {string} cardholderData.motherName - Mother's name
 * @param {Object} cardholderData.emergencyContact - Emergency contact info
 * @param {string} cardholderData.notes - Additional notes
 * @returns {Promise<Object>} - Created cardholder data
 */
export const createCardholder = async (cardholderData) => {
  try {
    const response = await api.post('/cardholders', cardholderData);
    return response.data;
  } catch (error) {
    console.error('Create cardholder error:', error);
    throw error;
  }
};

/**
 * Update cardholder
 * @param {string} id - Cardholder ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated cardholder data
 */
export const updateCardholder = async (id, updateData) => {
  try {
    const response = await api.put(`/cardholders/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Update cardholder error:', error);
    throw error;
  }
};

/**
 * Delete cardholder (soft delete)
 * @param {string} id - Cardholder ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteCardholder = async (id) => {
  try {
    const response = await api.delete(`/cardholders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete cardholder error:', error);
    throw error;
  }
};

/**
 * Update cardholder status
 * @param {string} id - Cardholder ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated cardholder data
 */
export const updateCardholderStatus = async (id, status) => {
  try {
    const response = await api.put(`/cardholders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update cardholder status error:', error);
    throw error;
  }
};

/**
 * Get cardholder statistics
 * @param {string} id - Cardholder ID
 * @returns {Promise<Object>} - Statistics data
 */
export const getCardholderStatistics = async (id) => {
  try {
    const response = await api.get(`/cardholders/${id}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Get cardholder statistics error:', error);
    throw error;
  }
};

/**
 * Search cardholders
 * @param {string} searchTerm - Search term
 * @returns {Promise<Object>} - Search results
 */
export const searchCardholders = async (searchTerm) => {
  try {
    const response = await api.get('/cardholders', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    console.error('Search cardholders error:', error);
    throw error;
  }
};

/**
 * Get cardholders by status
 * @param {string} status - Status filter
 * @returns {Promise<Object>} - Filtered cardholders
 */
export const getCardholdersByStatus = async (status) => {
  try {
    const response = await api.get('/cardholders', {
      params: { status }
    });
    return response.data;
  } catch (error) {
    console.error('Get cardholders by status error:', error);
    throw error;
  }
};

/**
 * Get cardholder dashboard data
 * @param {string} id - Cardholder ID
 * @returns {Promise<Object>} - Dashboard data
 */
export const getCardholderDashboard = async (id) => {
  try {
    const [cardholder, statistics] = await Promise.all([
      getCardholder(id),
      getCardholderStatistics(id)
    ]);
    
    return {
      success: true,
      data: {
        ...cardholder.data,
        statistics: statistics.data
      }
    };
  } catch (error) {
    console.error('Get cardholder dashboard error:', error);
    throw error;
  }
};

/**
 * Validate cardholder form data
 * @param {Object} data - Form data to validate
 * @returns {Object} - Validation result
 */
export const validateCardholderData = (data) => {
  const errors = {};

  // Required fields validation
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!data.address?.trim()) {
    errors.address = 'Address is required';
  }

  if (!data.dob) {
    errors.dob = 'Date of Birth is required';
  } else {
    const dobDate = new Date(data.dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    if (age < 18) {
      errors.dob = 'Cardholder must be at least 18 years old';
    }
  }

  if (!data.fatherName?.trim()) {
    errors.fatherName = 'Father\'s name is required';
  }

  if (!data.motherName?.trim()) {
    errors.motherName = 'Mother\'s name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Format cardholder data for API
 * @param {Object} formData - Form data
 * @returns {Object} - Formatted data for API
 */
export const formatCardholderData = (formData) => {
  const emergencyContact = {};
  
  // Only include emergency contact name if it's not empty
  if (formData.emergencyContact?.trim()) {
    emergencyContact.name = formData.emergencyContact.trim();
  }
  
  // Only include emergency contact phone if it's not empty
  if (formData.emergencyPhone?.trim()) {
    emergencyContact.phone = formData.emergencyPhone.trim();
  }

  return {
    name: formData.name?.trim(),
    email: formData.email?.trim().toLowerCase(),
    phone: formData.phone?.trim(),
    address: formData.address?.trim(),
    dob: formData.dob,
    fatherName: formData.fatherName?.trim(),
    motherName: formData.motherName?.trim(),
    ...(Object.keys(emergencyContact).length > 0 && { emergencyContact }),
    notes: formData.notes?.trim() || ''
  };
};

/**
 * Get cardholder status options
 * @returns {Array} - Status options
 */
export const getStatusOptions = () => [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'suspended', label: 'Suspended', color: 'red' }
];

/**
 * Get status color class
 * @param {string} status - Status value
 * @returns {string} - CSS color class
 */
export const getStatusColor = (status) => {
  const statusMap = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

export default {
  getCardholders,
  getCardholder,
  createCardholder,
  updateCardholder,
  deleteCardholder,
  updateCardholderStatus,
  getCardholderStatistics,
  searchCardholders,
  getCardholdersByStatus,
  getCardholderDashboard,
  validateCardholderData,
  formatCardholderData,
  getStatusOptions,
  getStatusColor
};
