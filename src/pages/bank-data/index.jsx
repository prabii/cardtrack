import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { getBanks, getStatusColor, formatCurrency } from '../../utils/bankApi';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

const BankData = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCardType, setFilterCardType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadBanks();
  }, [searchTerm, filterStatus, filterCardType]);

  const loadBanks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getBanks({
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        cardType: filterCardType !== 'all' ? filterCardType : undefined,
        page: 1,
        limit: 50
      });

      if (response.success) {
        setBanks(response.data);
        setStats(response.stats);
      } else {
        setError(response.message || 'Failed to load banks.');
      }
    } catch (err) {
      console.error('Error loading banks:', err);
      setError('Failed to load banks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBank = () => {
    navigate('/bank-data/add');
  };

  const handleViewBank = (bank) => {
    navigate(`/bank-data/${bank._id}`);
  };

  const handleEditBank = (bank) => {
    navigate(`/bank-data/${bank._id}/edit`);
  };

  const handleDeleteBank = async (bank) => {
    if (window.confirm(`Are you sure you want to delete ${bank.bankName}?`)) {
      try {
        // Implement delete API call
        console.log('Deleting bank:', bank._id);
        // await deleteBank(bank._id);
        loadBanks();
      } catch (err) {
        console.error('Error deleting bank:', err);
        alert('Failed to delete bank.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-gray-900">Individual Bank Data</h1>
              <button
                onClick={handleAddBank}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>Add New Bank</span>
              </button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Banks</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBanks || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Limit</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalLimit || 0)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Outstanding</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalOutstanding || 0)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Limit</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalAvailable || 0)}</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by bank name, cardholder, or card number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterCardType}
              onChange={(e) => setFilterCardType(e.target.value)}
              className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Card Types</option>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
              <option value="Prepaid">Prepaid</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              <p className="ml-3 text-lg text-gray-700">Loading banks...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-10 text-red-600">
              <AlertTriangle className="w-8 h-8 mr-3" />
              <p className="text-lg">{error}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank & Cardholder</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Summary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {banks.length > 0 ? (
                      banks.map((bank) => (
                        <tr key={bank._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{bank.bankName}</div>
                                <div className="text-sm text-gray-500">{bank.cardholder?.name || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{bank.maskedCardNumber || '****' + bank.cardNumber.slice(-4)}</div>
                            <div className="text-sm text-gray-500">{bank.cardType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Limit: {formatCurrency(bank.cardLimit)}</div>
                            <div className="text-sm text-green-600">Available: {formatCurrency(bank.availableLimit)}</div>
                            <div className="text-sm text-red-600">Outstanding: {formatCurrency(bank.outstandingAmount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Orders:</span>
                                <span className="font-medium">{formatCurrency(bank.transactionsSummary?.orders || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bills:</span>
                                <span className="font-medium">{formatCurrency(bank.transactionsSummary?.bills || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Withdrawals:</span>
                                <span className="font-medium">{formatCurrency(bank.transactionsSummary?.withdrawals || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Fees:</span>
                                <span className="font-medium">{formatCurrency(bank.transactionsSummary?.fees || 0)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bank.status)}`}>
                              {bank.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleViewBank(bank)} 
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditBank(bank)} 
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                                title="Edit Bank"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBank(bank)} 
                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                title="Delete Bank"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          No banks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BankData;
