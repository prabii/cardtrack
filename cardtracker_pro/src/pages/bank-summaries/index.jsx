import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [cardholders, setCardholders] = useState([]);
  const [selectedBank, setSelectedBank] = useState(bankId || 'all');
  const [selectedCardholder, setSelectedCardholder] = useState(cardholderId || 'all');
  const [viewMode, setViewMode] = useState(bankId ? 'bank' : cardholderId ? 'cardholder' : 'overall');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [overallCurrency, setOverallCurrency] = useState('INR'); // Default to INR for overall summary

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (viewMode === 'bank') {
        if (selectedBank && selectedBank !== 'all') {
          // Specific bank selected
          const response = await getBankSummary(selectedBank, filters);
          console.log('Bank summary response:', response);
          if (response.success) {
            setSummaryData(response.data);
          } else {
            console.error('Bank summary failed:', response.message);
            setSummaryData(null);
            setError(response.message || 'Failed to load bank summary');
          }
        } else {
          // "All" selected - show overall summary
          console.log('Loading overall summary (All banks) with filters:', filters);
          const response = await getOverallSummary(filters);
          console.log('Overall summary response:', response);
          if (response.success) {
            setSummaryData(response.data);
          } else {
            console.error('Overall summary failed:', response.message);
            setSummaryData(null);
            setError(response.message || 'Failed to load overall summary');
          }
        }
      } else if (viewMode === 'cardholder') {
        if (selectedCardholder && selectedCardholder !== 'all') {
          // Specific cardholder selected
          try {
            const response = await getCardholderBankSummaries(selectedCardholder, filters);
            console.log('Cardholder bank summaries response:', response);
            if (response.success) {
              setSummaryData(response.data);
            } else {
              console.error('Cardholder bank summaries failed:', response.message);
              setSummaryData(null);
              setError(response.message || 'Failed to load cardholder summaries');
            }
          } catch (cardholderError) {
            console.error('Cardholder summaries error:', cardholderError);
            setSummaryData(null);
            setError(cardholderError.response?.data?.message || cardholderError.message || 'Failed to load cardholder summaries');
          }
        } else {
          // "All" selected - show overall summary
          console.log('Loading overall summary (All cardholders) with filters:', filters);
          const response = await getOverallSummary(filters);
          console.log('Overall summary response:', response);
          if (response.success) {
            setSummaryData(response.data);
          } else {
            console.error('Overall summary failed:', response.message);
            setSummaryData(null);
            setError(response.message || 'Failed to load overall summary');
          }
        }
      } else if (viewMode === 'overall') {
        console.log('Loading overall summary with filters:', filters);
        const response = await getOverallSummary(filters);
        console.log('Overall summary response:', response);
        if (response.success) {
          setSummaryData(response.data);
        } else {
          console.error('Overall summary failed:', response.message);
          setSummaryData(null);
          setError(response.message || 'Failed to load overall summary');
        }
      } else {
        // No selection made, set to null
        setSummaryData(null);
      }

      // Load banks and cardholders for dropdowns
      try {
        const [banksRes, cardholdersRes] = await Promise.all([
          getBanks({ limit: 100 }),
          getCardholders({ limit: 100 })
        ]);

        if (banksRes.success) {
          setBanks(banksRes.data || []);
        }

        if (cardholdersRes.success) {
          setCardholders(cardholdersRes.data || []);
        }
      } catch (dropdownError) {
        console.error('Error loading dropdowns:', dropdownError);
        // Don't set error here, just log it
      }

    } catch (error) {
      console.error('Error loading bank summaries:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSummaryData(null);
      setError(error.response?.data?.message || error.message || 'Failed to load bank summaries');
    } finally {
      setLoading(false);
    }
  }, [selectedBank, selectedCardholder, viewMode, filters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadData();
      } catch (err) {
        console.error('Error in loadData useEffect:', err);
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };
    fetchData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedBank('all'); // Default to "All" when switching modes
    setSelectedCardholder('all'); // Default to "All" when switching modes
    setSummaryData(null);
  };

  const formatAmount = (amount, currency = 'USD') => {
    // Use appropriate locale based on currency
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD'
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

    const { summary, bank } = bankSummary || {};
    const { financials, verificationStats, categoryTotals, transactionStats } = summary || {};
    
    // Detect currency from bank or summary - prioritize bank currency
    const currency = bank?.currency || summary?.currency || 'USD';
    
    // Safety check - if summary is missing critical data, return a message
    if (!summary) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No summary data available for this bank.</p>
        </div>
      );
    }
    console.log('Bank summary render:', { 
      bankSummary, 
      summary, 
      bank, 
      currency,
      bankCurrency: bank?.currency,
      summaryCurrency: summary?.currency
    });

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
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary?.cardLimit || 0, currency)}</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary?.availableLimit || 0, currency)}</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary?.outstandingAmount || 0, currency)}</p>
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
                  {formatPercentage(financials?.creditUtilization || summary?.financials?.creditUtilization || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTotals && Object.keys(categoryTotals).length > 0 ? (
              Object.entries(categoryTotals).map(([category, data]) => {
                const Icon = getCategoryIcon(category);
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Icon className={`w-5 h-5 mr-2 ${getCategoryColor(category)}`} />
                        <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm text-gray-500">{data?.count || 0} transactions</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatAmount(data?.amount || 0, currency)}</div>
                    <div className="text-sm text-gray-500">
                      {data?.verified || 0} verified ({data?.count > 0 ? Math.round(((data?.verified || 0) / data.count) * 100) : 0}%)
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No transaction categories available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {verificationStats?.verifiedTransactions || summary?.verificationStats?.verifiedTransactions || 0}
              </div>
              <div className="text-sm text-gray-600">Verified Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {verificationStats?.unverifiedTransactions || summary?.verificationStats?.unverifiedTransactions || 0}
              </div>
              <div className="text-sm text-gray-600">Unverified Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {formatPercentage(verificationStats?.verificationRate || summary?.verificationStats?.verificationRate || 0)}
              </div>
              <div className="text-sm text-gray-600">Verification Rate</div>
            </div>
          </div>
        </div>

        {/* Transactions Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">How to Create Transactions</h4>
              <p className="text-sm text-blue-800">
                Transactions are automatically created when you upload and process a statement PDF. 
                To create transactions:
              </p>
              <ol className="text-sm text-blue-800 mt-2 ml-4 list-decimal space-y-1">
                <li>Go to Statements page and upload a PDF statement</li>
                <li>Click "Process Statement" button to extract transactions</li>
                <li>Transactions will be automatically created and categorized</li>
              </ol>
              <p className="text-xs text-blue-700 mt-2">
                Total Transactions: {transactionStats?.totalTransactions || summary?.transactionStats?.totalTransactions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCardholderSummary = (cardholderData) => {
    if (!cardholderData) return null;

    const { cardholder, bankSummaries, overallSummary } = cardholderData;

    return (
      <div className="space-y-6">
        {/* Cardholder Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{cardholder?.name || 'Cardholder'}</h2>
          <p className="text-gray-600">{cardholder?.email}</p>
          {cardholder?.phone && <p className="text-gray-600">{cardholder.phone}</p>}
        </div>

        {/* Overall Summary for Cardholder */}
        {overallSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Card Limit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(overallSummary.totalCardLimit, cardholderData?.currency || 'INR')}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(overallSummary.totalAvailableLimit, cardholderData?.currency || 'INR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(overallSummary.totalOutstandingAmount, cardholderData?.currency || 'INR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{overallSummary.totalTransactions || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Summaries */}
        {bankSummaries && bankSummaries.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Summaries ({bankSummaries.length})</h3>
            <div className="space-y-4">
              {bankSummaries.map((bankSummary, index) => {
                const summary = bankSummary.summary || {};
                const bank = bankSummary.bank || {};
                // Detect currency from bank or summary
                const currency = bank.currency || summary.currency || 'USD';
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{bank.bankName || bankSummary.bankName || 'Unknown Bank'}</h4>
                      <span className="text-sm text-gray-500">{bank.cardNumber || bankSummary.cardNumber || ''}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Card Limit:</span>
                        <span className="ml-2 font-medium">{formatAmount(summary.cardLimit || 0, currency)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="ml-2 font-medium">{formatAmount(summary.outstandingAmount || 0, currency)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Available:</span>
                        <span className="ml-2 font-medium">{formatAmount(summary.availableLimit || 0, currency)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Transactions:</span>
                        <span className="ml-2 font-medium">{bankSummary.transactions || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No banks found for this cardholder.</p>
              <p className="text-sm text-gray-400 mt-2">Add a bank account to see summaries.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverallSummary = (overallData) => {
    if (!overallData) return null;

    const { overallSummary, bankSummaries } = overallData || {};
    
    // Safety check - if overallSummary is missing, return null
    if (!overallSummary) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No summary data available.</p>
        </div>
      );
    }

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
                <p className="text-2xl font-bold text-gray-900">{overallSummary?.totalBanks || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Card Limit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(overallSummary?.totalCardLimit || 0, overallCurrency)}
                  </p>
                </div>
              </div>
              <select
                value={overallCurrency}
                onChange={(e) => setOverallCurrency(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Select currency for overall summary"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(overallSummary?.totalOutstandingAmount || 0, overallCurrency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across {overallSummary?.totalBanks || 0} banks
                </p>
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
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(overallSummary?.overallCreditUtilization || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Summaries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Summaries</h3>
          <div className="space-y-4">
            {bankSummaries && Array.isArray(bankSummaries) && bankSummaries.length > 0 ? (
              bankSummaries.map((bankSummary, index) => {
                const bank = bankSummary.bank || {};
                const summary = bankSummary.summary || {};
                // Detect currency from bank or summary
                const currency = bank.currency || summary.currency || 'USD';
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{bank.bankName || 'Unknown Bank'}</h4>
                      <span className="text-sm text-gray-500">{bank.cardholder?.name || ''}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Card Limit:</span>
                        <span className="ml-2 font-medium">{formatAmount(summary.cardLimit || 0, currency)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="ml-2 font-medium">{formatAmount(summary.outstandingAmount || 0, currency)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Transactions:</span>
                        <span className="ml-2 font-medium">{bankSummary.transactions || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Verified:</span>
                        <span className="ml-2 font-medium">{summary.verificationStats?.verifiedTransactions || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No bank summaries available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                    <option value="all">All Banks</option>
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
                    <option value="all">All Cardholders</option>
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-2">Error loading data</p>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : summaryData ? (
            viewMode === 'overall' ? (
              renderOverallSummary(summaryData)
            ) : viewMode === 'cardholder' ? (
              renderCardholderSummary(summaryData)
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
    </div>
  );
};

export default BankSummaries;
