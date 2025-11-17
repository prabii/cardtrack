import axios from 'axios';
import { api } from './authApi';

/**
 * Get all transactions with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.statement - Statement ID filter
 * @param {string} params.cardholder - Cardholder ID filter
 * @param {string} params.category - Category filter
 * @param {boolean} params.verified - Verification status filter
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} - Transactions data with pagination
 */
export const getTransactions = async (params = {}) => {
  try {
    const response = await api.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('Get transactions error:', error);
    throw error;
  }
};

/**
 * Get single transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Promise<Object>} - Transaction data
 */
export const getTransaction = async (id) => {
  try {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get transaction error:', error);
    throw error;
  }
};

/**
 * Verify transaction
 * @param {string} id - Transaction ID
 * @returns {Promise<Object>} - Verification response
 */
export const verifyTransaction = async (id) => {
  try {
    const response = await api.put(`/transactions/${id}/verify`);
    return response.data;
  } catch (error) {
    console.error('Verify transaction error:', error);
    throw error;
  }
};

/**
 * Unverify transaction
 * @param {string} id - Transaction ID
 * @returns {Promise<Object>} - Unverification response
 */
export const unverifyTransaction = async (id) => {
  try {
    const response = await api.put(`/transactions/${id}/unverify`);
    return response.data;
  } catch (error) {
    console.error('Unverify transaction error:', error);
    throw error;
  }
};

/**
 * Classify transaction (update category, orderSubcategory, payout info)
 * @param {string} id - Transaction ID
 * @param {Object} data - Classification data
 * @param {string} data.category - Category
 * @param {string} data.orderSubcategory - Order subcategory (if category is orders)
 * @param {boolean} data.payoutReceived - Payout received status
 * @param {number} data.payoutAmount - Payout amount
 * @param {string} data.notes - Notes
 * @returns {Promise<Object>} - Classification response
 */
export const classifyTransaction = async (id, data) => {
  try {
    const response = await api.put(`/transactions/${id}/classify`, data);
    return response.data;
  } catch (error) {
    console.error('Classify transaction error:', error);
    throw error;
  }
};

/**
 * Update transaction category
 * @param {string} id - Transaction ID
 * @param {string} category - New category
 * @returns {Promise<Object>} - Update response
 */
export const updateTransactionCategory = async (id, category) => {
  try {
    const response = await api.put(`/transactions/${id}`, { category });
    return response.data;
  } catch (error) {
    console.error('Update transaction category error:', error);
    throw error;
  }
};

/**
 * Update transaction notes
 * @param {string} id - Transaction ID
 * @param {string} notes - New notes
 * @returns {Promise<Object>} - Update response
 */
export const updateTransactionNotes = async (id, notes) => {
  try {
    const response = await api.put(`/transactions/${id}/notes`, { notes });
    return response.data;
  } catch (error) {
    console.error('Update transaction notes error:', error);
    throw error;
  }
};

/**
 * Bulk verify transactions
 * @param {Array} transactionIds - Array of transaction IDs
 * @returns {Promise<Object>} - Bulk verification response
 */
export const bulkVerifyTransactions = async (transactionIds) => {
  try {
    const response = await api.post('/transactions/bulk-verify', { transactionIds });
    return response.data;
  } catch (error) {
    console.error('Bulk verify transactions error:', error);
    throw error;
  }
};

/**
 * Bulk categorize transactions
 * @param {Array} transactionIds - Array of transaction IDs
 * @param {string} category - Category to assign
 * @returns {Promise<Object>} - Bulk categorization response
 */
export const bulkCategorizeTransactions = async (transactionIds, category) => {
  try {
    const response = await api.post('/transactions/bulk-categorize', { 
      transactionIds, 
      category 
    });
    return response.data;
  } catch (error) {
    console.error('Bulk categorize transactions error:', error);
    throw error;
  }
};

/**
 * Delete transaction (soft delete)
 * @param {string} id - Transaction ID
 * @returns {Promise<Object>} - Delete response
 */
export const deleteTransaction = async (id) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete transaction error:', error);
    throw error;
  }
};

/**
 * Get transaction statistics
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Statistics data
 */
export const getTransactionStatistics = async (params = {}) => {
  try {
    const response = await api.get('/transactions/statistics/summary', { params });
    return response.data;
  } catch (error) {
    console.error('Get transaction statistics error:', error);
    throw error;
  }
};

/**
 * Get transactions by cardholder
 * @param {string} cardholderId - Cardholder ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} - Cardholder transactions
 */
export const getCardholderTransactions = async (cardholderId, filters = {}) => {
  try {
    const params = { cardholder: cardholderId, ...filters };
    const response = await api.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('Get cardholder transactions error:', error);
    throw error;
  }
};

/**
 * Get transactions by statement
 * @param {string} statementId - Statement ID
 * @returns {Promise<Object>} - Statement transactions
 */
export const getStatementTransactions = async (statementId) => {
  try {
    const response = await api.get(`/statements/${statementId}/transactions`);
    return response.data;
  } catch (error) {
    console.error('Get statement transactions error:', error);
    throw error;
  }
};

/**
 * Get category options for transactions
 * @returns {Array} - Category options
 */
export const getCategoryOptions = () => [
  { value: 'bills', label: 'Bills', color: 'blue' },
  { value: 'withdrawals', label: 'Withdrawals', color: 'red' },
  { value: 'orders', label: 'Orders', color: 'green' },
  { value: 'fees', label: 'Fees', color: 'yellow' },
  { value: 'personal_use', label: 'Personal Use', color: 'purple' },
  { value: 'unclassified', label: 'Unclassified', color: 'gray' }
];

/**
 * Get order subcategory options
 * @returns {Array} - Order subcategory options
 */
export const getOrderSubcategoryOptions = () => [
  { value: 'cb_won', label: 'CB Won' },
  { value: 'ref', label: 'REF' },
  { value: 'loss', label: 'Loss' },
  { value: 'running', label: 'Running' }
];

/**
 * Get order subcategory label
 * @param {string} value - Subcategory value
 * @returns {string} - Subcategory label
 */
export const getOrderSubcategoryLabel = (value) => {
  const options = getOrderSubcategoryOptions();
  const option = options.find(o => o.value === value);
  return option ? option.label : value;
};

/**
 * Get category color class
 * @param {string} category - Category value
 * @returns {string} - CSS color class
 */
export const getCategoryColor = (category) => {
  const colors = {
    bills: 'bg-blue-100 text-blue-800',
    withdrawals: 'bg-red-100 text-red-800',
    orders: 'bg-green-100 text-green-800',
    fees: 'bg-yellow-100 text-yellow-800',
    personal_use: 'bg-purple-100 text-purple-800',
    unclassified: 'bg-gray-100 text-gray-800'
  };
  return colors[category] || colors.unclassified;
};

/**
 * Get category label
 * @param {string} category - Category value
 * @returns {string} - Category label
 */
export const getCategoryLabel = (category) => {
  const labels = {
    bills: 'Bills',
    withdrawals: 'Withdrawals',
    orders: 'Orders',
    fees: 'Fees',
    personal_use: 'Personal Use',
    unclassified: 'Unclassified'
  };
  return labels[category] || 'Unknown';
};

/**
 * Format amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted amount
 */
export const formatAmount = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format date and time for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date and time
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate transaction totals by category
 * @param {Array} transactions - Array of transactions
 * @returns {Object} - Totals by category
 */
export const calculateCategoryTotals = (transactions) => {
  const totals = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'unclassified';
    if (!totals[category]) {
      totals[category] = {
        count: 0,
        amount: 0,
        verified: 0
      };
    }
    
    totals[category].count++;
    totals[category].amount += transaction.amount || 0;
    if (transaction.verified) {
      totals[category].verified++;
    }
  });
  
  return totals;
};

/**
 * Calculate overall transaction statistics
 * @param {Array} transactions - Array of transactions
 * @returns {Object} - Overall statistics
 */
export const calculateOverallStats = (transactions) => {
  const stats = {
    totalTransactions: transactions.length,
    totalAmount: 0,
    verifiedTransactions: 0,
    unverifiedTransactions: 0,
    averageAmount: 0,
    categoryTotals: {}
  };
  
  transactions.forEach(transaction => {
    stats.totalAmount += transaction.amount || 0;
    
    if (transaction.verified) {
      stats.verifiedTransactions++;
    } else {
      stats.unverifiedTransactions++;
    }
  });
  
  stats.averageAmount = stats.totalTransactions > 0 ? stats.totalAmount / stats.totalTransactions : 0;
  stats.categoryTotals = calculateCategoryTotals(transactions);
  
  return stats;
};

export default {
  getTransactions,
  getTransaction,
  verifyTransaction,
  unverifyTransaction,
  classifyTransaction,
  updateTransactionCategory,
  updateTransactionNotes,
  bulkVerifyTransactions,
  bulkCategorizeTransactions,
  deleteTransaction,
  getTransactionStatistics,
  getCardholderTransactions,
  getStatementTransactions,
  getCategoryOptions,
  getOrderSubcategoryOptions,
  getOrderSubcategoryLabel,
  getCategoryColor,
  getCategoryLabel,
  formatAmount,
  formatDate,
  formatDateTime,
  calculateCategoryTotals,
  calculateOverallStats
};
