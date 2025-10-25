import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { 
  getBankSummary, 
  getOverallSummary, 
  getCardholderBankSummaries 
} from '../../utils/bankSummaryApi';
import { getBanks } from '../../utils/bankApi';
import { getCardholders } from '../../utils/cardholderApi';
import { 
  Building, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  Receipt
} from 'lucide-react';

const BankSummaries = () => {
  const navigate = useNavigate();
  const { bankId, cardholderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [cardholders, setCardholders] = useState([]);
  const [selectedBank, setSelectedBank] = useState(bankId || '');
  const [selectedCardholder, setSelectedCardholder] = useState(cardholderId || '');
  const [viewMode, setViewMode] = useState(bankId ? 'bank' : cardholderId ? 'cardholder' : 'overall');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedBank, selectedCardholder, viewMode, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (viewMode === 'bank' && selectedBank) {
        const response = await getBankSummary(selectedBank, filters);
        if (response.success) {
          setSummaryData(response.data);
        }
      } else if (viewMode === 'cardholder' && selectedCardholder) {
        const response = await getCardholderBankSummaries(selectedCardholder, filters);
        if (response.success) {
          setSummaryData(response.data);
        }
      } else if (viewMode === 'overall') {
        const response = await getOverallSummary(filters);
        if (response.success) {
          setSummaryData(response.data);
        }
      }

      // Load banks and cardholders for dropdowns
      const [banksRes, cardholdersRes] = await Promise.all([
        getBanks({ limit: 100 }),
        getCardholders({ limit: 100 })
      ]);

      if (banksRes.success) {
        setBanks(banksRes.data);
      }

      if (cardholdersRes.success) {
        setCardholders(cardholdersRes.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedBank('');
    setSelectedCardholder('');
    setSummaryData(null);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      bills: 'text-blue-600',
      withdrawals: 'text-red-600',
      orders: 'text-green-600',
      fees: 'text-yellow-600',
      personal_use: 'text-purple-600',
      unclassified: 'text-gray-600'
    };
    return colors[category] || colors.unclassified;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      bills: Building,
      withdrawals: CreditCard,
      orders: Receipt,
      fees: AlertCircle,
      personal_use: Users,
      unclassified: BarChart3
    };
    return icons[category] || BarChart3;
  };

  const renderBankSummary = (bankSummary) => {
    if (!bankSummary) return null;

    const { summary } = bankSummary;
    const { financials, verificationStats, categoryTotals } = summary;

    return (
      <div className="space-y-6">
        {/* Bank Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Card Limit</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.cardLimit)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Limit</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.availableLimit)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.outstandingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(financials?.creditUtilization)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryTotals || {}).map(([category, data]) => {
              const Icon = getCategoryIcon(category);
              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 mr-2 ${getCategoryColor(category)}`} />
                      <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm text-gray-500">{data.count} transactions</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatAmount(data.amount)}</div>
                  <div className="text-sm text-gray-500">
                    {data.verified} verified ({data.count > 0 ? Math.round((data.verified / data.count) * 100) : 0}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{verificationStats?.verifiedTransactions || 0}</div>
              <div className="text-sm text-gray-600">Verified Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{verificationStats?.unverifiedTransactions || 0}</div>
              <div className="text-sm text-gray-600">Unverified Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{formatPercentage(verificationStats?.verificationRate)}</div>
              <div className="text-sm text-gray-600">Verification Rate</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverallSummary = (overallData) => {
    if (!overallData) return null;

    const { overallSummary, bankSummaries } = overallData;

    return (
      <div className="space-y-6">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Banks</p>
                <p className="text-2xl font-bold text-gray-900">{overallSummary.totalBanks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Card Limit</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(overallSummary.totalCardLimit)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(overallSummary.totalOutstandingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(overallSummary.overallCreditUtilization)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Summaries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Summaries</h3>
          <div className="space-y-4">
            {bankSummaries.map((bankSummary, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{bankSummary.bank.bankName}</h4>
                  <span className="text-sm text-gray-500">{bankSummary.bank.cardholder?.name}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Card Limit:</span>
                    <span className="ml-2 font-medium">{formatAmount(bankSummary.summary.cardLimit)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Outstanding:</span>
                    <span className="ml-2 font-medium">{formatAmount(bankSummary.summary.outstandingAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Transactions:</span>
                    <span className="ml-2 font-medium">{bankSummary.transactions}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Verified:</span>
                    <span className="ml-2 font-medium">{bankSummary.summary.verificationStats?.verifiedTransactions || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Bank Summaries</h1>
                <p className="text-lg text-gray-600">Comprehensive bank and transaction analysis</p>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ startDate: '', endDate: '' })}
                >
                  <RefreshCw size={20} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => handleViewModeChange('overall')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'overall' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overall Summary
              </button>
              <button
                onClick={() => handleViewModeChange('bank')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'bank' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bank Summary
              </button>
              <button
                onClick={() => handleViewModeChange('cardholder')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'cardholder' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cardholder Summary
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {viewMode === 'bank' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a bank</option>
                    {banks.map(bank => (
                      <option key={bank._id} value={bank._id}>
                        {bank.bankName} - {bank.cardholder?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {viewMode === 'cardholder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Cardholder</label>
                  <select
                    value={selectedCardholder}
                    onChange={(e) => setSelectedCardholder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a cardholder</option>
                    {cardholders.map(cardholder => (
                      <option key={cardholder._id} value={cardholder._id}>
                        {cardholder.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : summaryData ? (
            viewMode === 'overall' ? (
              renderOverallSummary(summaryData)
            ) : (
              renderBankSummary(summaryData)
            )
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No data available. Please select a bank or cardholder.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BankSummaries;
