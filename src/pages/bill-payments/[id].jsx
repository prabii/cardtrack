import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../contexts/AuthContext';
import { getBillPayment, updateBillPayment, deleteBillPayment, getStatusColor, getPriorityColor, formatCurrency, formatDate, formatDateTime } from '../../utils/billPaymentApi';
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Download,
  Upload,
  Eye,
  Loader2,
  RefreshCw
} from 'lucide-react';

const BillPaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billPayment, setBillPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadBillPayment();
  }, [id]);

  const loadBillPayment = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getBillPayment(id);
      
      if (response.success) {
        setBillPayment(response.data);
      } else {
        setError(response.message || 'Failed to load bill payment details');
      }
    } catch (err) {
      console.error('Error loading bill payment:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view this bill payment.');
      } else if (err.response?.status === 404) {
        setError('Bill payment not found.');
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load bill payment details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this bill payment request? This action cannot be undone.')) {
      try {
        setIsUpdating(true);
        const response = await deleteBillPayment(id);
        
        if (response.success) {
          navigate('/bill-payments');
        } else {
          alert(response.message || 'Failed to delete bill payment');
        }
      } catch (err) {
        console.error('Error deleting bill payment:', err);
        alert('Failed to delete bill payment');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/bill-payments/${id}/edit`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              <p className="ml-3 text-lg text-gray-700">Loading bill payment details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="flex-1">{error}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadBillPayment}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate('/bill-payments')}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Back to Bill Payments
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!billPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bill payment not found</h3>
              <p className="text-gray-600 mb-4">The bill payment you're looking for doesn't exist or has been deleted.</p>
              <button
                onClick={() => navigate('/bill-payments')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Bill Payments
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/bill-payments')}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Bill Payments</span>
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Bill Payment Details</h1>
                  <p className="text-lg text-gray-600 mt-1">
                    {billPayment.requestType.replace('_', ' ').toUpperCase()} Request
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 size={16} />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(billPayment.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(billPayment.status)}`}>
                  {billPayment.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(billPayment.requestDetails.priority)}`}>
                  {billPayment.requestDetails.priority.toUpperCase()} PRIORITY
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bill Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 mr-2 text-blue-600" />
                  Bill Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biller Name</label>
                    <p className="text-lg text-gray-900">{billPayment.billDetails.billerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <p className="text-lg text-gray-900">{billPayment.billDetails.billerAccount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <p className="text-lg text-gray-900 capitalize">{billPayment.billDetails.billerCategory}</p>
                  </div>
                  {billPayment.billDetails.billerSubcategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                      <p className="text-lg text-gray-900">{billPayment.billDetails.billerSubcategory}</p>
                    </div>
                  )}
                  {billPayment.billDetails.billerPhone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <p className="text-lg text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {billPayment.billDetails.billerPhone}
                      </p>
                    </div>
                  )}
                  {billPayment.billDetails.billerEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <p className="text-lg text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {billPayment.billDetails.billerEmail}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                  Payment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(billPayment.paymentDetails.amount, billPayment.paymentDetails.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <p className="text-lg text-gray-900 capitalize">
                      {billPayment.paymentDetails.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <p className="text-lg text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(billPayment.paymentDetails.dueDate)}
                    </p>
                  </div>
                  {billPayment.paymentDetails.paymentReference && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                      <p className="text-lg text-gray-900">{billPayment.paymentDetails.paymentReference}</p>
                    </div>
                  )}
                  {billPayment.paymentDetails.isRecurring && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Payment</label>
                      <p className="text-lg text-gray-900">
                        {billPayment.paymentDetails.recurringFrequency} payments
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-purple-600" />
                  Request Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requested By</label>
                    <p className="text-lg text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {billPayment.requestDetails.requestedBy?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requested At</label>
                    <p className="text-lg text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDateTime(billPayment.requestDetails.requestedAt)}
                    </p>
                  </div>
                  {billPayment.requestDetails.requestNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <p className="text-lg text-gray-900">{billPayment.requestDetails.requestNotes}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Processing Time</label>
                    <p className="text-lg text-gray-900">{billPayment.requestDetails.estimatedProcessingTime} hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Cardholder & Processing Info */}
            <div className="space-y-8">
              {/* Cardholder Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Cardholder
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-lg text-gray-900">{billPayment.cardholder?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-lg text-gray-900">{billPayment.cardholder?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-lg text-gray-900">{billPayment.cardholder?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                  Bank Account
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                    <p className="text-lg text-gray-900">{billPayment.bank?.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Card Number</label>
                    <p className="text-lg text-gray-900">{billPayment.bank?.cardNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Card Type</label>
                    <p className="text-lg text-gray-900 capitalize">{billPayment.bank?.cardType || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Processing Information */}
              {billPayment.processingDetails.assignedTo && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    Processing
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                      <p className="text-lg text-gray-900">{billPayment.processingDetails.assignedTo?.name || 'N/A'}</p>
                    </div>
                    {billPayment.processingDetails.assignedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned At</label>
                        <p className="text-lg text-gray-900">{formatDateTime(billPayment.processingDetails.assignedAt)}</p>
                      </div>
                    )}
                    {billPayment.processingDetails.processingStartedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Started At</label>
                        <p className="text-lg text-gray-900">{formatDateTime(billPayment.processingDetails.processingStartedAt)}</p>
                      </div>
                    )}
                    {billPayment.processingDetails.processingCompletedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Completed At</label>
                        <p className="text-lg text-gray-900">{formatDateTime(billPayment.processingDetails.processingCompletedAt)}</p>
                      </div>
                    )}
                    {billPayment.processingDetails.actualProcessingTime && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processing Time</label>
                        <p className="text-lg text-gray-900">{billPayment.processingDetails.actualProcessingTime} hours</p>
                      </div>
                    )}
                    {billPayment.processingDetails.processingNotes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processing Notes</label>
                        <p className="text-lg text-gray-900">{billPayment.processingDetails.processingNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Result */}
              {billPayment.paymentResult && Object.keys(billPayment.paymentResult).length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Payment Result
                  </h3>
                  <div className="space-y-3">
                    {billPayment.paymentResult.transactionId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                        <p className="text-lg text-gray-900">{billPayment.paymentResult.transactionId}</p>
                      </div>
                    )}
                    {billPayment.paymentResult.paymentStatus && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                        <p className="text-lg text-gray-900 capitalize">{billPayment.paymentResult.paymentStatus}</p>
                      </div>
                    )}
                    {billPayment.paymentResult.receiptNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Receipt Number</label>
                        <p className="text-lg text-gray-900">{billPayment.paymentResult.receiptNumber}</p>
                      </div>
                    )}
                    {billPayment.paymentResult.failureReason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Failure Reason</label>
                        <p className="text-lg text-red-600">{billPayment.paymentResult.failureReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BillPaymentDetail;
