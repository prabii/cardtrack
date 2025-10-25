import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TransactionClassification from '../../components/TransactionClassification';
import BankSummary from '../../components/BankSummary';
import { 
  getBank, 
  getBankTransactions, 
  getVerificationStatusColor, 
  getCategoryColor, 
  formatCurrency, 
  formatDate,
  formatDateTime 
} from '../../utils/bankApi';
import {
  CreditCard,
  ArrowLeft,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  Eye,
  FileText,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react';

const BankDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bank, setBank] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionFilters, setTransactionFilters] = useState({
    category: 'all',
    status: 'all',
    verified: 'all',
    classified: 'all',
    page: 1,
    limit: 20
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    loadBankData();
  }, [id]);

  useEffect(() => {
    if (bank) {
      loadTransactions();
    }
  }, [bank, transactionFilters]);

  const loadBankData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getBank(id);
      if (response.success) {
        setBank(response.data.bank);
      } else {
        setError(response.message || 'Failed to load bank data.');
      }
    } catch (err) {
      console.error('Error loading bank data:', err);
      setError('Failed to load bank data.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await getBankTransactions(id, transactionFilters);
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setTransactionFilters(prev => ({
      ...prev,
      [filterType]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handleVerifyTransaction = async (transactionId) => {
    try {
      setIsVerifying(true);
      // TODO: Implement API call to verify transaction
      console.log('Verifying transaction:', transactionId);
      
      // Update local state
      setTransactions(prev => prev.map(transaction => 
        transaction._id === transactionId 
          ? { 
              ...transaction, 
              verified: true, 
              verifiedAt: new Date().toISOString(),
              verifiedBy: { name: 'Current User' } // TODO: Get from auth context
            }
          : transaction
      ));
    } catch (error) {
      console.error('Error verifying transaction:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClassifyTransaction = async (transactionId, classificationData) => {
    try {
      setIsClassifying(true);
      // TODO: Implement API call to classify transaction
      console.log('Classifying transaction:', transactionId, classificationData);
      
      // Update local state
      setTransactions(prev => prev.map(transaction => 
        transaction._id === transactionId 
          ? { 
              ...transaction, 
              ...classificationData,
              classified: true,
              classifiedAt: new Date().toISOString()
            }
          : transaction
      ));
    } catch (error) {
      console.error('Error classifying transaction:', error);
    } finally {
      setIsClassifying(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'verification', label: 'Verification', icon: CheckCircle },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
        <p className="ml-3 text-lg text-gray-700">Loading bank data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-red-600" />
        <p className="ml-3 text-lg text-red-700">{error}</p>
        <button 
          onClick={() => navigate('/bank-data')} 
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-red-600" />
        <p className="ml-3 text-lg text-red-700">Bank not found.</p>
        <button 
          onClick={() => navigate('/bank-data')} 
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/bank-data')} 
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {bank.bankName} - {bank.maskedCardNumber}
                </h1>
                <p className="text-lg text-gray-600">{bank.cardholder?.name}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate(`/bank-data/${bank._id}/edit`)} 
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Edit3 size={20} />
                <span>Edit Bank</span>
              </button>
              <button 
                onClick={() => loadBankData()} 
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={20} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Bank Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Card Limit</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(bank.cardLimit)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Limit</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(bank.availableLimit)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(bank.outstandingAmount)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Utilization</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {((bank.outstandingAmount / bank.cardLimit) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg p-2 mb-8 flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <BankSummary 
                bank={bank} 
                transactions={transactions} 
                onRefresh={loadBankData}
              />
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">Transaction Classification & Verification</h2>
                  <div className="flex space-x-4">
                    <select
                      value={transactionFilters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="orders">Orders</option>
                      <option value="bills">Bills</option>
                      <option value="withdrawals">Withdrawals</option>
                      <option value="fees">Fees</option>
                      <option value="personal">Personal</option>
                    </select>
                    <select
                      value={transactionFilters.verified}
                      onChange={(e) => handleFilterChange('verified', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Verification Status</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="unverified">Unverified</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {transactions.length > 0 ? (
                    transactions
                      .filter(transaction => {
                        if (transactionFilters.category !== 'all' && transaction.category !== transactionFilters.category) {
                          return false;
                        }
                        if (transactionFilters.verified === 'verified' && !transaction.verified) {
                          return false;
                        }
                        if (transactionFilters.verified === 'pending' && !transaction.pendingVerification) {
                          return false;
                        }
                        if (transactionFilters.verified === 'unverified' && (transaction.verified || transaction.pendingVerification)) {
                          return false;
                        }
                        return true;
                      })
                      .map((transaction) => (
                        <TransactionClassification
                          key={transaction._id}
                          transaction={transaction}
                          onVerify={handleVerifyTransaction}
                          onClassify={handleClassifyTransaction}
                          isVerifying={isVerifying}
                          isClassifying={isClassifying}
                        />
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-gray-500">No transactions match your current filters.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Transaction Verification</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600">Verified Transactions</p>
                        <p className="text-2xl font-semibold text-green-800">
                          {transactions.filter(t => t.verification?.isVerified).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-8 h-8 text-yellow-600" />
                      <div>
                        <p className="text-sm text-yellow-600">Pending Verification</p>
                        <p className="text-2xl font-semibold text-yellow-800">
                          {transactions.filter(t => !t.verification?.isVerified && t.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <div>
                        <p className="text-sm text-red-600">Rejected/Disputed</p>
                        <p className="text-2xl font-semibold text-red-800">
                          {transactions.filter(t => t.status === 'rejected' || t.status === 'disputed').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">Verification details and bulk actions will be implemented here.</p>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Analytics & Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
                    <div className="space-y-3">
                      {Object.entries(bank.transactionsSummary || {}).map(([category, amount]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">{category}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(amount / bank.cardLimit) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Utilization</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Used</span>
                          <span>{formatCurrency(bank.outstandingAmount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-600 h-3 rounded-full" 
                            style={{ width: `${(bank.outstandingAmount / bank.cardLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Available</span>
                          <span>{formatCurrency(bank.availableLimit)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-600 h-3 rounded-full" 
                            style={{ width: `${(bank.availableLimit / bank.cardLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BankDashboard;
