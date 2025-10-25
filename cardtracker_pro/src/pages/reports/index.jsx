import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
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
  const { trackActivity } = useRealtime();
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Load data when component mounts or filters change
  useEffect(() => {
    loadData();
  }, [activeTab, dateRange, customDates, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get date range
      const dateParams = dateRange === DATE_RANGES.CUSTOM 
        ? { startDate: customDates.startDate, endDate: customDates.endDate }
        : getDateRange(dateRange);

      const params = { ...dateParams, ...filters };

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

      setData(response.data || response);
    } catch (err) {
      console.error('Load reports error:', err);
      setError(err.message || 'Failed to load reports');
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
    if (!data.summary) return null;

    const { summary, financial, categoryBreakdown, monthlyTrends, topCardholders } = data;

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
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(financial.totalAmount)}</p>
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

  const renderTable = () => {
    const items = data.data || data;
    const pagination = data.pagination;

    if (!items || items.length === 0) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No data available for the selected filters</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(items[0]).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(item).map((value, valueIndex) => (
                      <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof value === 'object' && value !== null 
                          ? JSON.stringify(value) 
                          : String(value || '')
                        }
                      </td>
                    ))}
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
              Showing page {pagination.current} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: pagination.current - 1 })}
                disabled={pagination.current === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: pagination.current + 1 })}
                disabled={pagination.current === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
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
                onClick={() => setActiveTab(tab.id)}
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
