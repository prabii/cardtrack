import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDashboardReports,
  getCardholderReports,
  getTransactionReports,
  getBillPaymentReports,
  getStatementReports,
  exportReports,
  downloadCSV,
  REPORT_TYPES,
  EXPORT_FORMATS,
  DATE_RANGES,
  getDateRange
} from '../../utils/reportsApi';
import { 
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CreditCardIcon,
  DocumentTextIcon,
  BanknotesIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { trackActivity } = useRealtime();
  const { user } = useAuth();
  
  // Determine active tab from URL path
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/cardholders')) return 'cardholders';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/bill-payments')) return 'bill-payments';
    if (path.includes('/statements')) return 'statements';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({});
  const [data, setData] = useState({});
  const [exportLoading, setExportLoading] = useState(false);

  // Update active tab when URL changes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);

  // Load data when component mounts or filters change
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange, customDates, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get date range
      const dateParams = dateRange === DATE_RANGES.CUSTOM 
        ? { startDate: customDates.startDate, endDate: customDates.endDate }
        : getDateRange(dateRange);

      // Create params object, ensuring page and limit are numbers
      const params = { 
        ...dateParams, 
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit) || 10,
        // Include other filters (excluding page and limit to avoid duplication)
        ...Object.fromEntries(
          Object.entries(filters).filter(([key]) => key !== 'page' && key !== 'limit')
        )
      };

      // Track activity
      trackActivity('reports', 'viewed', activeTab, { reportType: activeTab });

      let response;
      switch (activeTab) {
        case 'dashboard':
          response = await getDashboardReports(params);
          break;
        case 'cardholders':
          response = await getCardholderReports(params);
          break;
        case 'transactions':
          response = await getTransactionReports(params);
          break;
        case 'bill-payments':
          response = await getBillPaymentReports(params);
          break;
        case 'statements':
          response = await getStatementReports(params);
          break;
        default:
          throw new Error('Invalid report type');
      }

      const responseData = response.data || response;
      setData(responseData);
      
      // Log for debugging
      console.log(`${activeTab} report data:`, responseData);
      if (activeTab === 'transactions') {
        console.log('Transactions array:', responseData.transactions || responseData.data);
        console.log('Transactions count:', (responseData.transactions || responseData.data || []).length);
        console.log('Pagination:', responseData.pagination);
      }
      if (activeTab === 'dashboard') {
        console.log('Summary:', responseData.summary);
        console.log('Financial:', responseData.financial);
      }
    } catch (err) {
      console.error('Load reports error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load reports';
      if (err.response?.status === 403) {
        setError(`Access denied: ${errorMessage}. Please check your permissions.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format = EXPORT_FORMATS.CSV) => {
    try {
      setExportLoading(true);
      
      const dateParams = dateRange === DATE_RANGES.CUSTOM 
        ? { startDate: customDates.startDate, endDate: customDates.endDate }
        : getDateRange(dateRange);

      const params = { ...dateParams, ...filters, format };
      
      const response = await exportReports(activeTab, params);
      
      if (format === EXPORT_FORMATS.CSV) {
        downloadCSV(response, `${activeTab}_report_${new Date().toISOString().split('T')[0]}`);
      }
      
      // Track export activity
      trackActivity('reports', 'exported', activeTab, { 
        reportType: activeTab, 
        format,
        dateRange 
      });
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export report');
    } finally {
      setExportLoading(false);
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

  const getTrendIcon = (current, previous) => {
    if (current > previous) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (current, previous) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const renderDashboard = () => {
    if (!data || !data.summary) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No dashboard data available</p>
        </div>
      );
    }

    const { summary, financial, categoryBreakdown, monthlyTrends, topCardholders } = data;
    
    // Ensure we have valid data
    if (!summary || typeof summary !== 'object') {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Invalid summary data received</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cardholders</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(summary.totalCardholders)}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(summary.totalTransactions)}</p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(financial?.totalAmount || 0)}</p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(summary.activeUsers)}</p>
              </div>
              <BuildingLibraryIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Categories</h3>
            <div className="space-y-3">
              {categoryBreakdown?.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'][index % 5]
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{category._id || 'Unknown'}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(category.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{formatNumber(category.count)} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cardholders */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cardholders</h3>
            <div className="space-y-3">
              {topCardholders?.slice(0, 5).map((cardholder, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {cardholder.cardholderName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cardholder.cardholderName}</p>
                      <p className="text-xs text-gray-500">{cardholder.cardholderEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatNumber(cardholder.transactionCount)}</p>
                    <p className="text-xs text-gray-500">transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {monthlyTrends?.slice(-4).map((trend, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-600">
                  {new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(trend.count)}</p>
                <p className="text-sm text-gray-500">{formatCurrency(trend.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Handle dates
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      try {
        return new Date(value).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } catch {
        return String(value);
      }
    }
    
    // Handle objects (populated references)
    if (typeof value === 'object' && value !== null) {
      if (value._id) {
        // Populated reference - show name/email or ID
        return value.name || value.email || value.bankName || value._id.toString().slice(-8);
      }
      // Array
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} items` : 'None';
      }
      // Other objects - try to extract meaningful info
      if (value.toString && value.toString() !== '[object Object]') {
        return value.toString();
      }
      // Skip displaying complex objects
      return '-';
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle numbers (format currency for amount fields)
    if (typeof value === 'number') {
      if (key && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance') || key.toLowerCase().includes('limit'))) {
        return formatCurrency(value);
      }
      return formatNumber(value);
    }
    
    return String(value);
  };

  const renderTable = () => {
    try {
      // Handle different data structures
      let items = [];
      let pagination = null;

      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
        pagination = data.pagination;
      } else if (data && data.transactions && Array.isArray(data.transactions)) {
        items = data.transactions;
        pagination = data.pagination;
      } else if (data && data.statements && Array.isArray(data.statements)) {
        items = data.statements;
        pagination = data.pagination;
      } else if (data && data.billPayments && Array.isArray(data.billPayments)) {
        items = data.billPayments;
        pagination = data.pagination;
      } else if (data && typeof data === 'object') {
        // Try to find any array in the data object
        const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayKeys.length > 0) {
          items = data[arrayKeys[0]];
          pagination = data.pagination;
        }
      }

      if (!items || items.length === 0) {
        return (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No data available for the selected filters</p>
            <p className="text-sm text-gray-400 mt-2">
              {activeTab === 'transactions' && 'Upload and process statements to create transactions'}
            </p>
          </div>
        );
      }

      // Get column keys from first item, but filter out complex objects
      const firstItem = items[0];
      if (!firstItem || typeof firstItem !== 'object') {
        return (
          <div className="text-center py-12">
            <p className="text-red-600">Invalid data format received</p>
          </div>
        );
      }

      // Filter columns to show only meaningful ones
      const columns = Object.keys(firstItem).filter(key => {
        const value = firstItem[key];
        // Skip complex nested objects that aren't populated references
        if (typeof value === 'object' && value !== null && !value._id && !Array.isArray(value) && !(value instanceof Date)) {
          return false;
        }
        // Skip internal MongoDB fields unless they're meaningful
        if (key === '__v') return false;
        return true;
      });

      return (
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item._id || index} className="hover:bg-gray-50">
                      {columns.map((key, valueIndex) => {
                        const value = item[key];
                        const displayValue = formatValue(value, key);
                        
                        return (
                          <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.current || filters.page || 1} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newPage = (pagination.current || filters.page || 1) - 1;
                  setFilters({ ...filters, page: newPage });
                }}
                disabled={(pagination.current || filters.page || 1) === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const newPage = (pagination.current || filters.page || 1) + 1;
                  setFilters({ ...filters, page: newPage });
                }}
                disabled={(pagination.current || filters.page || 1) >= pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
    } catch (err) {
      console.error('Error rendering table:', err);
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error rendering data: {err.message}</p>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive reports and data analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport(EXPORT_FORMATS.CSV)}
              disabled={exportLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(DATE_RANGES).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === DATE_RANGES.CUSTOM && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customDates.startDate}
                  onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customDates.endDate}
                  onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
              { id: 'cardholders', label: 'Cardholders', icon: UsersIcon },
              { id: 'transactions', label: 'Transactions', icon: CreditCardIcon },
              { id: 'bill-payments', label: 'Bill Payments', icon: BanknotesIcon },
              { id: 'statements', label: 'Statements', icon: DocumentTextIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Update URL without full page reload
                  const path = tab.id === 'dashboard' ? '/reports' : `/reports/${tab.id}`;
                  navigate(path, { replace: true });
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading reports...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' ? renderDashboard() : renderTable()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

