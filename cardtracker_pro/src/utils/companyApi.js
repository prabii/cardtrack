import axios from 'axios';
import { getAccessToken, clearTokens } from './auth';

// Create axios instance for company API
const api = axios.create({
  baseURL: 'http://localhost:3003/api/company',
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

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard
export const getCompanyDashboard = async (params = {}) => {
  try {
    const response = await api.get('/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Get company dashboard error:', error);
    throw error;
  }
};

// Company Profits
export const getCompanyProfits = async (params = {}) => {
  try {
    const response = await api.get('/profits', { params });
    return response.data;
  } catch (error) {
    console.error('Get company profits error:', error);
    throw error;
  }
};

export const createCompanyProfit = async (data) => {
  try {
    const response = await api.post('/profits', data);
    return response.data;
  } catch (error) {
    console.error('Create company profit error:', error);
    throw error;
  }
};

export const updateCompanyProfit = async (id, data) => {
  try {
    const response = await api.put(`/profits/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update company profit error:', error);
    throw error;
  }
};

export const deleteCompanyProfit = async (id) => {
  try {
    const response = await api.delete(`/profits/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete company profit error:', error);
    throw error;
  }
};

// FD Cards
export const getFDCards = async (params = {}) => {
  try {
    const response = await api.get('/fd-cards', { params });
    return response.data;
  } catch (error) {
    console.error('Get FD cards error:', error);
    throw error;
  }
};

export const createFDCard = async (data) => {
  try {
    const response = await api.post('/fd-cards', data);
    return response.data;
  } catch (error) {
    console.error('Create FD card error:', error);
    throw error;
  }
};

export const updateFDCard = async (id, data) => {
  try {
    const response = await api.put(`/fd-cards/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update FD card error:', error);
    throw error;
  }
};

export const deleteFDCard = async (id) => {
  try {
    const response = await api.delete(`/fd-cards/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete FD card error:', error);
    throw error;
  }
};

// Expenses
export const getExpenses = async (params = {}) => {
  try {
    const response = await api.get('/expenses', { params });
    return response.data;
  } catch (error) {
    console.error('Get expenses error:', error);
    throw error;
  }
};

export const createExpense = async (data) => {
  try {
    const response = await api.post('/expenses', data);
    return response.data;
  } catch (error) {
    console.error('Create expense error:', error);
    throw error;
  }
};

export const updateExpense = async (id, data) => {
  try {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update expense error:', error);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete expense error:', error);
    throw error;
  }
};

export const approveExpense = async (id) => {
  try {
    const response = await api.put(`/expenses/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error('Approve expense error:', error);
    throw error;
  }
};

// Projects
export const getProjects = async (params = {}) => {
  try {
    const response = await api.get('/projects', { params });
    return response.data;
  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
};

export const createProject = async (data) => {
  try {
    const response = await api.post('/projects', data);
    return response.data;
  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
};

export const updateProject = async (id, data) => {
  try {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update project error:', error);
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete project error:', error);
    throw error;
  }
};

export const addProjectMilestone = async (projectId, milestone) => {
  try {
    const response = await api.post(`/projects/${projectId}/milestones`, milestone);
    return response.data;
  } catch (error) {
    console.error('Add project milestone error:', error);
    throw error;
  }
};

export const updateProjectMilestone = async (projectId, milestoneId, data) => {
  try {
    const response = await api.put(`/projects/${projectId}/milestones/${milestoneId}`, data);
    return response.data;
  } catch (error) {
    console.error('Update project milestone error:', error);
    throw error;
  }
};

export const addProjectTeamMember = async (projectId, teamMember) => {
  try {
    const response = await api.post(`/projects/${projectId}/team-members`, teamMember);
    return response.data;
  } catch (error) {
    console.error('Add project team member error:', error);
    throw error;
  }
};

export const removeProjectTeamMember = async (projectId, userId) => {
  try {
    const response = await api.delete(`/projects/${projectId}/team-members/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Remove project team member error:', error);
    throw error;
  }
};

// Constants
export const EXPENSE_CATEGORIES = {
  OFFICE_RENT: 'office_rent',
  UTILITIES: 'utilities',
  SALARIES: 'salaries',
  EQUIPMENT: 'equipment',
  SOFTWARE: 'software',
  MARKETING: 'marketing',
  TRAVEL: 'travel',
  MEALS: 'meals',
  INSURANCE: 'insurance',
  LEGAL: 'legal',
  ACCOUNTING: 'accounting',
  MAINTENANCE: 'maintenance',
  OTHER: 'other'
};

export const EXPENSE_TYPES = {
  FIXED: 'fixed',
  VARIABLE: 'variable'
};

export const EXPENSE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid'
};

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PROJECT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const FD_CARD_STATUS = {
  ACTIVE: 'active',
  MATURED: 'matured',
  CLOSED: 'closed',
  SUSPENDED: 'suspended'
};

export const PROFIT_PERIODS = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
};

export default api;
