import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getTransactions, 
  verifyTransaction, 
  unverifyTransaction, 
  updateTransactionCategory,
  bulkVerifyTransactions,
  bulkCategorizeTransactions,
  getTransactionStatistics
} from '../../utils/transactionApi';
import { getCardholders } from '../../utils/cardholderApi';
import { getStatements } from '../../utils/statementApi';
import { 
  CreditCard, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Edit3,
  Eye,
  MoreHorizontal,
  Search,
  Calendar,
  User,
  Building,
  DollarSign,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';

const Transactions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [cardholders, setCardholders] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    cardholder: '',
    statement: '',
    category: '',
    verified: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  });
  const [statistics, setStatistics] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    loadData();
  }, [filters, pagination.current]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load transactions
      const transactionParams = {
        ...filters,
        page: pagination.current,
        limit: pagination.limit
      };
      
      // Remove empty filters
      Object.keys(transactionParams).forEach(key => {
        if (transactionParams[key] === '') {
          delete transactionParams[key];
        }
      });

      const [transactionsRes, cardholdersRes, statementsRes, statsRes] = await Promise.all([
        getTransactions(transactionParams),
        getCardholders({ limit: 100 }),
        getStatements({ limit: 100 }),
        getTransactionStatistics()
      ]);

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data);
        setPagination(transactionsRes.pagination);
        setStatistics(transactionsRes.statistics);
      }

      if (cardholdersRes.success) {
        setCardholders(cardholdersRes.data);
      }

      if (statementsRes.success) {
        setStatements(statementsRes.data);
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
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleTransactionSelect = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t._id));
    }
  };

  const handleVerifyTransaction = async (transactionId) => {
    try {
      const response = await verifyTransaction(transactionId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
    }
  };

  const handleUnverifyTransaction = async (transactionId) => {
    try {
      const response = await unverifyTransaction(transactionId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error unverifying transaction:', error);
    }
  };

  const handleUpdateCategory = async (transactionId, category) => {
    try {
      const response = await updateTransactionCategory(transactionId, category);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleBulkAction = async () => {
    if (selectedTransactions.length === 0) return;

    try {
      if (bulkAction === 'verify') {
        await bulkVerifyTransactions(selectedTransactions);
      } else if (bulkAction === 'categorize') {
        const category = prompt('Enter category (bills, withdrawals, orders, fees, personal_use, unclassified):');
        if (category) {
          await bulkCategorizeTransactions(selectedTransactions, category);
        }
      }
      
      setSelectedTransactions([]);
      setBulkAction('');
      loadData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const getCategoryColor = (category) => {
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

  const getCategoryLabel = (category) => {
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

  const formatAmount = (amount, currency = 'USD') => {
    // Use appropriate locale based on currency
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                <h1 className="text-4xl font-bold text-gray-900">Transactions</h1>
                <p className="text-lg text-gray-600">Manage and verify credit card transactions</p>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={20} className="mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/statements')}
                >
                  <CreditCard size={20} className="mr-2" />
                  View Statements
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalTransactions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatAmount(statistics.totalAmount)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalVerified}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unverified</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalTransactions - statistics.totalVerified}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search transactions..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder</label>
                    <select
                      value={filters.cardholder}
                      onChange={(e) => handleFilterChange('cardholder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Cardholders</option>
                      {cardholders.map(ch => (
                        <option key={ch._id} value={ch._id}>{ch.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statement</label>
                    <select
                      value={filters.statement}
                      onChange={(e) => handleFilterChange('statement', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statements</option>
                      {statements.map(stmt => (
                        <option key={stmt._id} value={stmt._id}>
                          {stmt.month} {stmt.year} - {stmt.bankName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="bills">Bills</option>
                      <option value="withdrawals">Withdrawals</option>
                      <option value="orders">Orders</option>
                      <option value="fees">Fees</option>
                      <option value="personal_use">Personal Use</option>
                      <option value="unclassified">Unclassified</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                    <select
                      value={filters.verified}
                      onChange={(e) => handleFilterChange('verified', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="true">Verified</option>
                      <option value="false">Unverified</option>
                    </select>
                  </div>

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

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        search: '',
                        cardholder: '',
                        statement: '',
                        category: '',
                        verified: '',
                        startDate: '',
                        endDate: ''
                      });
                      setPagination(prev => ({ ...prev, current: 1 }));
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button type="submit">
                    Apply Filters
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedTransactions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTransactions.length} transaction(s) selected
                  </span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-3 py-1 border border-blue-300 rounded text-sm"
                  >
                    <option value="">Select Action</option>
                    {['operator', 'manager', 'admin'].includes(user?.role) && (
                      <option value="verify">Verify Selected</option>
                    )}
                    {user?.role !== 'operator' && (
                      <option value="categorize">Categorize Selected</option>
                    )}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                  >
                    Apply
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransactions([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cardholder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(transaction._id)}
                            onChange={() => handleTransactionSelect(transaction._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatAmount(transaction.amount, transaction.currency || 'USD')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user?.role === 'operator' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                              {getCategoryLabel(transaction.category)}
                            </span>
                          ) : (
                            <select
                              value={transaction.category}
                              onChange={(e) => handleUpdateCategory(transaction._id, e.target.value)}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}
                            >
                              <option value="bills">Bills</option>
                              <option value="withdrawals">Withdrawals</option>
                              <option value="orders">Orders</option>
                              <option value="fees">Fees</option>
                              <option value="personal_use">Personal Use</option>
                              <option value="unclassified">Unclassified</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {transaction.verified ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="ml-2 text-sm text-gray-900">
                              {transaction.verified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.cardholder?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* Verify/Unverify button - visible to operators, managers, admins */}
                            {['operator', 'manager', 'admin'].includes(user?.role) && (
                              transaction.verified ? (
                                <button
                                  onClick={() => handleUnverifyTransaction(transaction._id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Unverify"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyTransaction(transaction._id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Verify"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )
                            )}
                            <button
                              onClick={() => {
                                if (!transaction || !transaction._id) {
                                  alert('Invalid transaction data');
                                  return;
                                }
                                // Navigate to statement detail page instead since there's no transaction detail page
                                if (transaction.statement?._id || transaction.statement) {
                                  navigate(`/statements/${transaction.statement._id || transaction.statement}`);
                                } else {
                                  alert('Transaction statement not found');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Statement"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: Math.max(1, prev.current - 1) }))}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: Math.min(prev.pages, prev.current + 1) }))}
                    disabled={pagination.current === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.current * pagination.limit, pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.current
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
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

export default Transactions;
