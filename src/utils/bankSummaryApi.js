import axios from 'axios';
import { api } from './authApi';

/**
 * Get summary for a specific bank
 * @param {string} bankId - Bank ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} - Bank summary data
 */
export const getBankSummary = async (bankId, filters = {}) => {
  try {
    const response = await api.get(`/bank-summaries/${bankId}`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get bank summary error:', error);
    throw error;
  }
};

/**
 * Get overall summary across all banks
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} - Overall summary data
 */
export const getOverallSummary = async (filters = {}) => {
  try {
    const response = await api.get('/bank-summaries/overall/summary', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get overall summary error:', error);
    throw error;
  }
};

/**
 * Get summaries for all banks of a specific cardholder
 * @param {string} cardholderId - Cardholder ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} - Cardholder bank summaries
 */
export const getCardholderBankSummaries = async (cardholderId, filters = {}) => {
  try {
    const response = await api.get(`/bank-summaries/cardholder/${cardholderId}`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get cardholder bank summaries error:', error);
    throw error;
  }
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
  }).format(amount || 0);
};

/**
 * Format percentage for display
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

/**
 * Get category color class
 * @param {string} category - Category value
 * @returns {string} - CSS color class
 */
export const getCategoryColor = (category) => {
  const colors = {
    bills: 'text-blue-600 bg-blue-100',
    withdrawals: 'text-red-600 bg-red-100',
    orders: 'text-green-600 bg-green-100',
    fees: 'text-yellow-600 bg-yellow-100',
    personal_use: 'text-purple-600 bg-purple-100',
    unclassified: 'text-gray-600 bg-gray-100'
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
 * Calculate credit utilization percentage
 * @param {number} outstandingAmount - Outstanding amount
 * @param {number} cardLimit - Card limit
 * @returns {number} - Utilization percentage
 */
export const calculateCreditUtilization = (outstandingAmount, cardLimit) => {
  if (!cardLimit || cardLimit === 0) return 0;
  return (outstandingAmount / cardLimit) * 100;
};

/**
 * Calculate verification rate percentage
 * @param {number} verifiedCount - Number of verified transactions
 * @param {number} totalCount - Total number of transactions
 * @returns {number} - Verification rate percentage
 */
export const calculateVerificationRate = (verifiedCount, totalCount) => {
  if (!totalCount || totalCount === 0) return 0;
  return (verifiedCount / totalCount) * 100;
};

/**
 * Calculate average transaction amount
 * @param {number} totalAmount - Total amount
 * @param {number} transactionCount - Number of transactions
 * @returns {number} - Average transaction amount
 */
export const calculateAverageTransaction = (totalAmount, transactionCount) => {
  if (!transactionCount || transactionCount === 0) return 0;
  return totalAmount / transactionCount;
};

/**
 * Get financial health status
 * @param {number} creditUtilization - Credit utilization percentage
 * @returns {Object} - Health status with color and label
 */
export const getFinancialHealthStatus = (creditUtilization) => {
  if (creditUtilization < 30) {
    return { status: 'excellent', color: 'green', label: 'Excellent' };
  } else if (creditUtilization < 50) {
    return { status: 'good', color: 'blue', label: 'Good' };
  } else if (creditUtilization < 70) {
    return { status: 'fair', color: 'yellow', label: 'Fair' };
  } else if (creditUtilization < 90) {
    return { status: 'poor', color: 'orange', label: 'Poor' };
  } else {
    return { status: 'critical', color: 'red', label: 'Critical' };
  }
};

/**
 * Get verification status
 * @param {number} verificationRate - Verification rate percentage
 * @returns {Object} - Verification status with color and label
 */
export const getVerificationStatus = (verificationRate) => {
  if (verificationRate >= 90) {
    return { status: 'excellent', color: 'green', label: 'Excellent' };
  } else if (verificationRate >= 75) {
    return { status: 'good', color: 'blue', label: 'Good' };
  } else if (verificationRate >= 50) {
    return { status: 'fair', color: 'yellow', label: 'Fair' };
  } else {
    return { status: 'poor', color: 'red', label: 'Poor' };
  }
};

/**
 * Calculate category distribution
 * @param {Object} categoryTotals - Category totals object
 * @returns {Array} - Array of category distribution data
 */
export const calculateCategoryDistribution = (categoryTotals) => {
  const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);
  
  return Object.entries(categoryTotals).map(([category, data]) => ({
    category,
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
    verified: data.verified,
    verifiedRate: data.count > 0 ? (data.verified / data.count) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);
};

/**
 * Calculate monthly trends
 * @param {Array} monthlyData - Monthly trend data
 * @returns {Object} - Trend analysis
 */
export const calculateMonthlyTrends = (monthlyData) => {
  if (!monthlyData || monthlyData.length < 2) {
    return { trend: 'stable', change: 0, direction: 'neutral' };
  }

  const latest = monthlyData[0];
  const previous = monthlyData[1];
  
  const change = latest.totalAmount - previous.totalAmount;
  const changePercentage = previous.totalAmount > 0 ? (change / previous.totalAmount) * 100 : 0;
  
  let trend = 'stable';
  let direction = 'neutral';
  
  if (Math.abs(changePercentage) > 10) {
    trend = changePercentage > 0 ? 'increasing' : 'decreasing';
    direction = changePercentage > 0 ? 'up' : 'down';
  }

  return {
    trend,
    change,
    changePercentage,
    direction,
    latest,
    previous
  };
};

/**
 * Generate summary insights
 * @param {Object} summary - Bank summary data
 * @returns {Array} - Array of insight objects
 */
export const generateSummaryInsights = (summary) => {
  const insights = [];
  
  if (!summary) return insights;

  const { financials, verificationStats, categoryTotals } = summary;

  // Credit utilization insight
  if (financials?.creditUtilization !== undefined) {
    const health = getFinancialHealthStatus(financials.creditUtilization);
    insights.push({
      type: 'credit_utilization',
      level: health.status,
      message: `Credit utilization is ${financials.creditUtilization.toFixed(1)}% (${health.label})`,
      color: health.color
    });
  }

  // Verification rate insight
  if (verificationStats?.verificationRate !== undefined) {
    const verification = getVerificationStatus(verificationStats.verificationRate);
    insights.push({
      type: 'verification_rate',
      level: verification.status,
      message: `Transaction verification rate is ${verificationStats.verificationRate.toFixed(1)}% (${verification.label})`,
      color: verification.color
    });
  }

  // Category distribution insight
  if (categoryTotals) {
    const distribution = calculateCategoryDistribution(categoryTotals);
    const topCategory = distribution[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push({
        type: 'category_dominance',
        level: 'info',
        message: `${getCategoryLabel(topCategory.category)} transactions dominate with ${topCategory.percentage.toFixed(1)}% of total spending`,
        color: 'blue'
      });
    }
  }

  // Outstanding amount insight
  if (summary.outstandingAmount > 0 && summary.cardLimit > 0) {
    const utilization = (summary.outstandingAmount / summary.cardLimit) * 100;
    if (utilization > 80) {
      insights.push({
        type: 'high_outstanding',
        level: 'warning',
        message: `High outstanding amount: ${formatAmount(summary.outstandingAmount)} (${utilization.toFixed(1)}% of limit)`,
        color: 'yellow'
      });
    }
  }

  return insights;
};

export default {
  getBankSummary,
  getOverallSummary,
  getCardholderBankSummaries,
  formatAmount,
  formatPercentage,
  getCategoryColor,
  getCategoryLabel,
  calculateCreditUtilization,
  calculateVerificationRate,
  calculateAverageTransaction,
  getFinancialHealthStatus,
  getVerificationStatus,
  calculateCategoryDistribution,
  calculateMonthlyTrends,
  generateSummaryInsights
};
