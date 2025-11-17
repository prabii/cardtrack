import axios from 'axios';
import { api } from './authApi';

/**
 * Get all statements with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.cardholder - Cardholder ID filter
 * @param {string} params.status - Status filter
 * @param {string} params.month - Month filter
 * @param {number} params.year - Year filter
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} - Statements data with pagination
 */
export const getStatements = async (params = {}) => {
  try {
    const response = await api.get('/statements', { params });
    return response.data;
  } catch (error) {
    console.error('Get statements error:', error);
    throw error;
  }
};

/**
 * Get single statement by ID
 * @param {string} id - Statement ID
 * @returns {Promise<Object>} - Statement data
 */
export const getStatement = async (id) => {
  try {
    const response = await api.get(`/statements/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get statement error:', error);
    throw error;
  }
};

/**
 * Upload new statement
 * @param {FormData} formData - Form data with file and metadata
 * @returns {Promise<Object>} - Upload response
 */
export const uploadStatement = async (formData) => {
  try {
    const response = await api.post('/statements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload statement error:', error);
    throw error;
  }
};

/**
 * Update statement status
 * @param {string} id - Statement ID
 * @param {string} status - New status
 * @param {string} processingError - Optional error message
 * @returns {Promise<Object>} - Update response
 */
export const updateStatementStatus = async (id, status, processingError = null) => {
  try {
    const response = await api.put(`/statements/${id}/status`, {
      status,
      processingError
    });
    return response.data;
  } catch (error) {
    console.error('Update statement status error:', error);
    throw error;
  }
};

/**
 * Update extracted data from statement processing
 * @param {string} id - Statement ID
 * @param {Object} extractedData - Extracted data
 * @returns {Promise<Object>} - Update response
 */
export const updateExtractedData = async (id, extractedData) => {
  try {
    const response = await api.put(`/statements/${id}/extracted-data`, {
      extractedData
    });
    return response.data;
  } catch (error) {
    console.error('Update extracted data error:', error);
    throw error;
  }
};

/**
 * Delete statement (soft delete)
 * @param {string} id - Statement ID
 * @returns {Promise<Object>} - Delete response
 */
export const deleteStatement = async (id) => {
  try {
    const response = await api.delete(`/statements/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete statement error:', error);
    throw error;
  }
};

/**
 * Download statement file
 * @param {string} id - Statement ID
 * @returns {Promise<Blob>} - File blob
 */
export const downloadStatement = async (id) => {
  try {
    const response = await api.get(`/statements/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Download statement error:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

/**
 * Download file from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export const downloadFileFromBlob = (blob, filename) => {
  try {
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'statement.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Clean up the URL after a delay
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error creating download link:', error);
    throw error;
  }
};

/**
 * Get overdue statements
 * @returns {Promise<Object>} - Overdue statements
 */
export const getOverdueStatements = async () => {
  try {
    const response = await api.get('/statements/overdue');
    return response.data;
  } catch (error) {
    console.error('Get overdue statements error:', error);
    throw error;
  }
};

/**
 * Process statement (extract data from PDF)
 * @param {string} id - Statement ID
 * @returns {Promise<Object>} - Processing result
 */
export const processStatement = async (id) => {
  try {
    const response = await api.post(`/statements/${id}/process`);
    return response.data;
  } catch (error) {
    console.error('Process statement error:', error);
    throw error;
  }
};

/**
 * Reprocess statement
 * @param {string} id - Statement ID
 * @returns {Promise<Object>} - Reprocessing result
 */
export const reprocessStatement = async (id) => {
  try {
    const response = await api.post(`/statements/${id}/reprocess`);
    return response.data;
  } catch (error) {
    console.error('Reprocess statement error:', error);
    throw error;
  }
};

/**
 * Get statements for specific cardholder
 * @param {string} cardholderId - Cardholder ID
 * @returns {Promise<Object>} - Cardholder statements
 */
export const getCardholderStatements = async (cardholderId) => {
  try {
    const response = await api.get(`/statements/cardholder/${cardholderId}`);
    return response.data;
  } catch (error) {
    console.error('Get cardholder statements error:', error);
    throw error;
  }
};

/**
 * Create form data for statement upload
 * @param {Object} data - Upload data
 * @param {File} data.file - PDF file
 * @param {string} data.cardholder - Cardholder ID
 * @param {string} data.month - Month
 * @param {number} data.year - Year
 * @param {Object} data.timePeriod - Time period
 * @param {string} data.cardDigits - Card last 4 digits
 * @param {string} data.bankName - Bank name
 * @param {string} data.cardNumber - Card number
 * @param {string} data.deadline - Deadline date
 * @returns {FormData} - Form data for upload
 */
export const createStatementFormData = (data) => {
  const formData = new FormData();
  
  formData.append('statement', data.file);
  formData.append('cardholder', data.cardholder);
  formData.append('month', data.month);
  formData.append('year', data.year.toString());
  formData.append('timePeriod[startDate]', data.timePeriod.startDate);
  formData.append('timePeriod[endDate]', data.timePeriod.endDate);
  formData.append('cardDigits', data.cardDigits);
  formData.append('bankName', data.bankName);
  formData.append('cardNumber', data.cardNumber);
  formData.append('deadline', data.deadline);
  
  return formData;
};

/**
 * Validate statement upload data
 * @param {Object} data - Upload data to validate
 * @returns {Object} - Validation result
 */
export const validateStatementData = (data) => {
  const errors = {};

  // Required fields validation
  if (!data.file) {
    errors.file = 'PDF file is required';
  } else if (data.file.type !== 'application/pdf') {
    errors.file = 'Only PDF files are allowed';
  } else if (data.file.size > 10 * 1024 * 1024) {
    errors.file = 'File size must be less than 10MB';
  }

  if (!data.cardholder) {
    errors.cardholder = 'Cardholder is required';
  }

  if (!data.month?.trim()) {
    errors.month = 'Month is required';
  }

  if (!data.year) {
    errors.year = 'Year is required';
  } else if (data.year < 2020 || data.year > 2030) {
    errors.year = 'Year must be between 2020 and 2030';
  }

  if (!data.timePeriod?.startDate) {
    errors.startDate = 'Start date is required';
  }

  if (!data.timePeriod?.endDate) {
    errors.endDate = 'End date is required';
  }

  if (!data.cardDigits?.trim()) {
    errors.cardDigits = 'Card digits are required';
  } else if (!/^\d{4}$/.test(data.cardDigits)) {
    errors.cardDigits = 'Card digits must be exactly 4 digits';
  }

  if (!data.bankName?.trim()) {
    errors.bankName = 'Bank name is required';
  }

  if (!data.cardNumber?.trim()) {
    errors.cardNumber = 'Card number is required';
  }

  if (!data.deadline) {
    errors.deadline = 'Deadline is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get status options for statements
 * @returns {Array} - Status options
 */
export const getStatusOptions = () => [
  { value: 'uploaded', label: 'Uploaded', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'yellow' },
  { value: 'processed', label: 'Processed', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'pending', label: 'Pending', color: 'gray' }
];

/**
 * Get status color class
 * @param {string} status - Status value
 * @returns {string} - CSS color class
 */
export const getStatusColor = (status) => {
  const statusMap = {
    uploaded: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    processed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get month options
 * @returns {Array} - Month options
 */
export const getMonthOptions = () => [
  { value: 'January', label: 'January' },
  { value: 'February', label: 'February' },
  { value: 'March', label: 'March' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'June', label: 'June' },
  { value: 'July', label: 'July' },
  { value: 'August', label: 'August' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'October' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' }
];

/**
 * Get year options (current year ± 5 years)
 * @returns {Array} - Year options
 */
export const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push({ value: i, label: i.toString() });
  }
  return years;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export default {
  getStatements,
  getStatement,
  uploadStatement,
  updateStatementStatus,
  updateExtractedData,
  deleteStatement,
  downloadStatement,
  getOverdueStatements,
  getCardholderStatements,
  createStatementFormData,
  validateStatementData,
  getStatusOptions,
  getStatusColor,
  getMonthOptions,
  getYearOptions,
  formatFileSize,
  downloadFileFromBlob
};
