import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '../../contexts/RealtimeContext';
import { getCompanyDashboard } from '../../utils/companyApi';
import { 
  BuildingOfficeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FolderIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { trackActivity } = useRealtime();
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await getCompanyDashboard();
      console.log('Company dashboard response:', response);
      
      // Handle response structure - backend returns { success: true, data: {...} }
      // axios already extracts response.data, so we get { success: true, data: {...} }
      let responseData = {};
      
      if (response && response.success && response.data) {
        // Backend response structure: { success: true, data: {...} }
        responseData = response.data;
      } else if (response && response.data) {
        // If response.data exists but no success field, use it directly
        responseData = response.data;
      } else if (response) {
        // If response is the data itself
        responseData = response;
      }
      
      console.log('Company dashboard data:', responseData);
      console.log('Data structure:', {
        summary: responseData.summary,
        expenses: responseData.expenses,
        fdCards: responseData.fdCards,
        projects: responseData.projects,
        recentActivities: responseData.recentActivities
      });
      
      if (responseData && Object.keys(responseData).length > 0) {
        setData(responseData);
      } else {
        console.warn('No data received from company dashboard API');
        setData({});
      }
      
      // Track activity
      trackActivity('company', 'viewed', 'dashboard', { module: 'company_dashboard' });
    } catch (err) {
      console.error('Load company dashboard error:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Failed to load company dashboard');
      setData({}); // Set empty data on error
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      completed: 'text-blue-600 bg-blue-100',
      pending: 'text-yellow-600 bg-yellow-100',
      on_hold: 'text-orange-600 bg-orange-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboard}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary = {}, expenses = {}, fdCards = {}, projects = {}, recentActivities = {} } = data;
  
  // Log data structure for debugging
  console.log('Rendering company dashboard with data:', {
    summary,
    expenses,
    fdCards,
    projects,
    recentActivities,
    fullData: data
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
              <p className="text-gray-600 mt-2">Comprehensive company financial and project management</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/company/add')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5" />
            Add Company
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Companies</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(summary?.totalCompanies)}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(summary?.activeProjects)}</p>
            </div>
            <FolderIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">FD Cards</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(summary?.totalFDCards)}</p>
            </div>
            <BanknotesIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(expenses?.totalAmount)}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">FD Value</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(fdCards?.totalValue)}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expenses Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-red-600" />
              Expenses Overview
            </h3>
            <button
              onClick={() => navigate('/company/add-expense')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add Expense
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Expenses</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(expenses?.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average per Expense</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(expenses?.averageAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Count</span>
              <span className="text-lg font-semibold text-gray-900">{formatNumber(expenses?.count)}</span>
            </div>
          </div>
        </div>

        {/* FD Cards Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BanknotesIcon className="h-5 w-5 mr-2 text-yellow-600" />
              FD Cards Overview
            </h3>
            <button
              onClick={() => navigate('/company/add-fd-card')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add FD Card
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Value</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(fdCards?.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Principal Amount</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(fdCards?.totalPrincipal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Interest Earned</span>
              <span className="text-lg font-semibold text-green-600">{formatCurrency(fdCards?.totalInterest)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FolderIcon className="h-5 w-5 mr-2 text-green-600" />
            Projects Overview
          </h3>
          <button
            onClick={() => navigate('/company/add-project')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add Project
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(projects?.totalBudget)}</p>
            <p className="text-sm text-gray-600">Total Budget</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(projects?.totalActualCost)}</p>
            <p className="text-sm text-gray-600">Actual Cost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(projects?.averageProgress)}</p>
            <p className="text-sm text-gray-600">Average Progress</p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FolderIcon className="h-5 w-5 mr-2 text-green-600" />
            Recent Projects
          </h3>
          <div className="space-y-4">
            {recentActivities?.projects?.length > 0 ? (
              recentActivities.projects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-600">{project.company?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(project.priority)}`}>
                      {project.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent projects</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-red-600" />
            Recent Expenses
          </h3>
          <div className="space-y-4">
            {recentActivities?.expenses?.length > 0 ? (
              recentActivities.expenses.map((expense, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{expense.title}</p>
                    <p className="text-sm text-gray-600">{expense.company?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                    <p className="text-xs text-gray-500">{expense.category?.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent expenses</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
