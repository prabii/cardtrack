import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getGateways, getGatewayDashboard, formatCurrency, formatDate, getTransactionTypeColor, getStatusColor } from '../../utils/gatewayApi';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Plus,
  Eye,
  Loader2,
  RefreshCw,
  Building,
  BarChart3
} from 'lucide-react';

const Gateways = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGateways();
  }, []);

  useEffect(() => {
    if (selectedGateway) {
      loadGatewayDashboard(selectedGateway);
    }
  }, [selectedGateway]);

  const loadGateways = async () => {
    try {
      setLoading(true);
      const response = await getGateways();
      if (response.success) {
        setGateways(response.data);
        if (response.data.length > 0) {
          setSelectedGateway(response.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error loading gateways:', err);
      setError('Failed to load gateways');
    } finally {
      setLoading(false);
    }
  };

  const loadGatewayDashboard = async (gatewayId) => {
    try {
      setLoading(true);
      const response = await getGatewayDashboard(gatewayId);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Error loading gateway dashboard:', err);
      setError('Failed to load gateway dashboard');
    } finally {
      setLoading(false);
    }
  };

  const currentGateway = gateways.find(g => g._id === selectedGateway);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            <p className="ml-3 text-lg text-gray-700">Loading gateways...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Gateway Dashboard</h1>
            <p className="text-lg text-gray-600 mt-1">View gateway transactions and summaries</p>
          </div>

          {/* Gateway Tabs */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex space-x-4 border-b border-gray-200">
              {gateways.map(gateway => (
                <button
                  key={gateway._id}
                  onClick={() => setSelectedGateway(gateway._id)}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    selectedGateway === gateway._id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {gateway.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {dashboardData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Withdrawals</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardData.summary?.totalWithdrawals || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <ArrowUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Bills</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardData.summary?.totalBills || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <ArrowDown className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Transfers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardData.summary?.totalTransfers || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Deposits</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardData.summary?.totalDeposits || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Available Funds</p>
                      <p className={`text-2xl font-bold ${
                        (dashboardData.summary?.availableFunds || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(dashboardData.summary?.availableFunds || 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        (Withdrawals + Deposits) - (Bills + Transfers)
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
                  <button
                    onClick={() => loadGatewayDashboard(selectedGateway)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                  </button>
                </div>

                {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.recentTransactions.map((txn) => (
                          <tr key={txn._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(txn.transactionDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(txn.transactionType)}`}>
                                {txn.transactionType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {txn.description || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(txn.amount, txn.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                                {txn.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {txn.reference || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions found for this gateway</p>
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedGateway && !loading && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Gateways Available</h3>
              <p className="text-gray-600">Please add a new gateway to view its dashboard.</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default Gateways;

