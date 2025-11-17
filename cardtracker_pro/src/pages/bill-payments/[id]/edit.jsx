import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../components/ui/Header';
import { 
  getBillPayment,
  updateBillPayment, 
  validateBillPaymentData,
  billerCategories,
  requestTypes,
  paymentMethods,
  priorityLevels
} from '../../../utils/billPaymentApi';
import { getCardholders } from '../../../utils/cardholderApi';
import { getBanks } from '../../../utils/bankApi';
import {
  ArrowLeft,
  CreditCard,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  Banknote,
  Calendar,
  DollarSign,
  FileText,
  Phone,
  Mail
} from 'lucide-react';

const EditBillPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cardholder: '',
    bank: '',
    requestType: 'bill_payment',
    billDetails: {
      billerName: '',
      billerAccount: '',
      billerCategory: 'utilities',
      billerSubcategory: '',
      billerPhone: '',
      billerEmail: ''
    },
    paymentDetails: {
      amount: '',
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentReference: '',
      dueDate: '',
      isRecurring: false,
      recurringFrequency: undefined
    },
    requestNotes: '',
    priority: 'medium'
  });
  const [cardholders, setCardholders] = useState([]);
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBillPayment();
    loadCardholdersAndBanks();
  }, [id]);

  const loadBillPayment = async () => {
    try {
      setIsLoading(true);
      const response = await getBillPayment(id);
      
      if (response.success) {
        const bp = response.data;
        setFormData({
          cardholder: bp.cardholder?._id || bp.cardholder || '',
          bank: bp.bank?._id || bp.bank || '',
          requestType: bp.requestType || 'bill_payment',
          billDetails: {
            billerName: bp.billDetails?.billerName || '',
            billerAccount: bp.billDetails?.billerAccount || '',
            billerCategory: bp.billDetails?.billerCategory || 'utilities',
            billerSubcategory: bp.billDetails?.billerSubcategory || '',
            billerPhone: bp.billDetails?.billerPhone || '',
            billerEmail: bp.billDetails?.billerEmail || ''
          },
          paymentDetails: {
            amount: bp.paymentDetails?.amount || '',
            currency: bp.paymentDetails?.currency || 'USD',
            paymentMethod: bp.paymentDetails?.paymentMethod || 'credit_card',
            paymentReference: bp.paymentDetails?.paymentReference || '',
            dueDate: bp.paymentDetails?.dueDate ? new Date(bp.paymentDetails.dueDate).toISOString().split('T')[0] : '',
            isRecurring: bp.paymentDetails?.isRecurring || false,
            recurringFrequency: bp.paymentDetails?.recurringFrequency || undefined
          },
          requestNotes: bp.requestDetails?.requestNotes || '',
          priority: bp.requestDetails?.priority || 'medium'
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to load bill payment' });
      }
    } catch (err) {
      console.error('Error loading bill payment:', err);
      setMessage({ type: 'error', text: 'Failed to load bill payment details' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCardholdersAndBanks = async () => {
    try {
      const [cardholdersResponse, banksResponse] = await Promise.all([
        getCardholders({ limit: 100 }),
        getBanks({ limit: 100 })
      ]);

      if (cardholdersResponse.success) {
        setCardholders(cardholdersResponse.data);
      }
      if (banksResponse.success) {
        setBanks(banksResponse.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { errors: validationErrors, isValid } = validateBillPaymentData(formData);
    
    if (!isValid) {
      setErrors(validationErrors);
      setMessage({ type: 'error', text: 'Please correct the errors in the form.' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        billDetails: formData.billDetails,
        paymentDetails: {
          ...formData.paymentDetails,
          amount: parseFloat(formData.paymentDetails.amount),
          recurringFrequency: formData.paymentDetails.isRecurring ? formData.paymentDetails.recurringFrequency : undefined
        },
        requestNotes: formData.requestNotes,
        priority: formData.priority
      };

      const response = await updateBillPayment(id, updateData);

      if (response.success) {
        setMessage({ type: 'success', text: 'Bill payment updated successfully!' });
        setTimeout(() => navigate(`/bill-payments/${id}`), 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update bill payment' });
      }
    } catch (err) {
      console.error('Error updating bill payment:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update bill payment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              <p className="ml-3 text-lg text-gray-700">Loading bill payment...</p>
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
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-gray-900">Edit Payment Request</h1>
              <button
                onClick={() => navigate(`/bill-payments/${id}`)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
            </div>
          </div>

          {message.text && (
            <div
              className={`p-4 mb-6 rounded-lg flex items-center space-x-3 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Bill Details */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-green-600" /> Bill Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="billDetails.billerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Biller Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="billDetails.billerName"
                      name="billDetails.billerName"
                      value={formData.billDetails.billerName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.billerName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      disabled={isSubmitting}
                    />
                    {errors.billerName && <p className="mt-1 text-sm text-red-600">{errors.billerName}</p>}
                  </div>

                  <div>
                    <label htmlFor="billDetails.billerAccount" className="block text-sm font-medium text-gray-700 mb-2">
                      Biller Account <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="billDetails.billerAccount"
                      name="billDetails.billerAccount"
                      value={formData.billDetails.billerAccount}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.billerAccount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      disabled={isSubmitting}
                    />
                    {errors.billerAccount && <p className="mt-1 text-sm text-red-600">{errors.billerAccount}</p>}
                  </div>

                  <div>
                    <label htmlFor="billDetails.billerCategory" className="block text-sm font-medium text-gray-700 mb-2">
                      Biller Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="billDetails.billerCategory"
                      name="billDetails.billerCategory"
                      value={formData.billDetails.billerCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      {billerCategories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="billDetails.billerSubcategory" className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      id="billDetails.billerSubcategory"
                      name="billDetails.billerSubcategory"
                      value={formData.billDetails.billerSubcategory}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-purple-600" /> Payment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="paymentDetails.amount" className="block text-sm font-medium text-gray-700 mb-2">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        id="paymentDetails.amount"
                        name="paymentDetails.amount"
                        value={formData.paymentDetails.amount}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        step="0.01"
                        min="0.01"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                  </div>

                  <div>
                    <label htmlFor="paymentDetails.currency" className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      id="paymentDetails.currency"
                      name="paymentDetails.currency"
                      value={formData.paymentDetails.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="paymentDetails.paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="paymentDetails.paymentMethod"
                      name="paymentDetails.paymentMethod"
                      value={formData.paymentDetails.paymentMethod}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.paymentMethod ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      disabled={isSubmitting}
                    >
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="paymentDetails.dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" /> Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="paymentDetails.dueDate"
                      name="paymentDetails.dueDate"
                      value={formData.paymentDetails.dueDate}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.dueDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      disabled={isSubmitting}
                    />
                    {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
                  </div>
                </div>
              </div>

              {/* Request Settings */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-orange-600" /> Request Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      {priorityLevels.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="requestNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      Request Notes
                    </label>
                    <textarea
                      id="requestNotes"
                      name="requestNotes"
                      value={formData.requestNotes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(`/bill-payments/${id}`)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{isSubmitting ? 'Updating...' : 'Update Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditBillPayment;

