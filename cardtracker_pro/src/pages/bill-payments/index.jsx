import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import RealtimeActivity from '../../components/RealtimeActivity';
import { 
  getBillPayments, 
  getStatusColor, 
  getPriorityColor, 
  getBillerCategoryColor,
  getRequestTypeColor,
  formatCurrency, 
  formatDate,
  getDaysUntilDue,
  isOverdue
} from '../../utils/billPaymentApi';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const BillPayments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackActivity, trackViewing } = useRealtime();
  const [billPayments, setBillPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    requestType: 'all',
    billerCategory: 'all',
    priority: 'all',
    assignedTo: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadBillPayments();
  }, [searchTerm, filters]);

  // Track viewing activity
  useEffect(() => {
    if (user) {
      trackViewing('bill_payments', 'list', 'viewing');
      trackActivity('bill_payments', 'viewed', 'list', {
        userName: user.name,
        userRole: user.role
      });
    }
  }, [user, trackViewing, trackActivity]);

  const loadBillPayments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        search: searchTerm,
        page: 1,
        limit: 50
      };

      // Add filters if not 'all'
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all') {
          params[key] = value;
        }
      });

      const response = await getBillPayments(params);

      if (response.success) {
        setBillPayments(response.data);
        setStats(response.stats);
      } else {
        setError(response.message || 'Failed to load bill payments.');
      }
    } catch (err) {
      console.error('Error loading bill payments:', err);
      setError('Failed to load bill payments.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBillPayment = () => {
    navigate('/bill-payments/add');
  };

  const handleViewBillPayment = (billPayment) => {
    navigate(`/bill-payments/${billPayment._id}`);
  };

  const handleEditBillPayment = (billPayment) => {
    navigate(`/bill-payments/${billPayment._id}/edit`);
  };

  const handleDeleteBillPayment = async (billPayment) => {
    if (window.confirm(`Are you sure you want to delete this ${billPayment.requestType.replace('_', ' ')} request?`)) {
      try {
        // Implement delete API call
        console.log('Deleting bill payment:', billPayment._id);
        // await deleteBillPayment(billPayment._id);
        loadBillPayments();
      } catch (err) {
        console.error('Error deleting bill payment:', err);
        alert('Failed to delete bill payment.');
      }
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
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
                <h1 className="text-4xl font-bold text-gray-900">Bill Payments</h1>
                <div className="mt-2">
                  <RealtimeActivity 
                    resource="bill_payments" 
                    resourceId="list"
                    showViewing={true}
                    showTyping={false}
                  />
                </div>
              </div>
              <button
                onClick={handleAddBillPayment}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>New Payment Request</span>
              </button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRequests || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingRequests || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inProgressRequests || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedRequests || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount || 0)}</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by biller, cardholder, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filters.requestType}
                onChange={(e) => handleFilterChange('requestType', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="bill_payment">Bill Payment</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
                <option value="purchase">Purchase</option>
              </select>

              <select
                value={filters.billerCategory}
                onChange={(e) => handleFilterChange('billerCategory', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="utilities">Utilities</option>
                <option value="telecom">Telecom</option>
                <option value="insurance">Insurance</option>
                <option value="credit_card">Credit Card</option>
                <option value="loan">Loan</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              <p className="ml-3 text-lg text-gray-700">Loading bill payments...</p>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biller & Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cardholder & Bank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {billPayments.length > 0 ? (
                      billPayments.map((billPayment) => (
                        <tr key={billPayment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {billPayment.requestType.replace('_', ' ').toUpperCase()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(billPayment.requestDetails.requestedAt)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{billPayment.billDetails.billerName}</div>
                            <div className="text-sm text-gray-500">{billPayment.billDetails.billerAccount}</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(billPayment.paymentDetails.amount, billPayment.paymentDetails.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{billPayment.cardholder?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{billPayment.bank?.bankName || 'N/A'}</div>
                            <div className="text-xs text-gray-400">{billPayment.bank?.cardNumber || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(billPayment.paymentDetails.dueDate)}</div>
                            <div className={`text-xs ${isOverdue(billPayment.paymentDetails.dueDate, billPayment.status) ? 'text-red-600' : 'text-gray-500'}`}>
                              {getDaysUntilDue(billPayment.paymentDetails.dueDate) < 0 
                                ? `${Math.abs(getDaysUntilDue(billPayment.paymentDetails.dueDate))} days overdue`
                                : `${getDaysUntilDue(billPayment.paymentDetails.dueDate)} days left`
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(billPayment.status)}`}>
                                {billPayment.status.replace('_', ' ')}
                              </span>
                              <br />
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(billPayment.requestDetails.priority)}`}>
                                {billPayment.requestDetails.priority}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {billPayment.processingDetails.assignedTo?.name || 'Unassigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {billPayment.processingDetails.assignedAt 
                                ? formatDate(billPayment.processingDetails.assignedAt)
                                : 'Not assigned'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleViewBillPayment(billPayment)} 
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditBillPayment(billPayment)} 
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                                title="Edit Request"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBillPayment(billPayment)} 
                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                title="Delete Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No bill payments found.
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

export default BillPayments;
