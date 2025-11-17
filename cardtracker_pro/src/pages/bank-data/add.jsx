import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { getCardholders } from '../../utils/cardholderApi';
import { createBank, validateBankData } from '../../utils/bankApi';
import {
  CreditCard,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  User,
  Building,
  DollarSign,
  Loader2
} from 'lucide-react';

const AddBank = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cardholder: '',
    bankName: '',
    cardNumber: '',
    cardType: '',
    cardLimit: '',
    availableLimit: '',
    outstandingAmount: '0'
  });
  const [cardholders, setCardholders] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCardholders();
    // Check if cardholder is passed via query params
    const urlParams = new URLSearchParams(window.location.search);
    const cardholderId = urlParams.get('cardholder');
    if (cardholderId) {
      setFormData(prev => ({ ...prev, cardholder: cardholderId }));
    }
  }, []);

  const loadCardholders = async () => {
    try {
      const response = await getCardholders({ limit: 100 });
      if (response.success) {
        setCardholders(response.data);
      }
    } catch (err) {
      console.error('Error loading cardholders:', err);
      setMessage({ type: 'error', text: 'Failed to load cardholders for selection.' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-calculate available limit when card limit or outstanding amount changes
    if (name === 'cardLimit' || name === 'outstandingAmount') {
      const cardLimit = name === 'cardLimit' ? parseFloat(value) || 0 : parseFloat(formData.cardLimit) || 0;
      const outstandingAmount = name === 'outstandingAmount' ? parseFloat(value) || 0 : parseFloat(formData.outstandingAmount) || 0;
      const availableLimit = cardLimit - outstandingAmount;
      
      setFormData(prev => ({
        ...prev,
        availableLimit: availableLimit.toString()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation = validateBankData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setMessage({ type: 'error', text: 'Please correct the errors in the form.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for API
      const bankData = {
        ...formData,
        cardLimit: parseFloat(formData.cardLimit),
        availableLimit: parseFloat(formData.availableLimit),
        outstandingAmount: parseFloat(formData.outstandingAmount)
      };

      const response = await createBank(bankData);

      if (response.success) {
        setMessage({ type: 'success', text: 'Bank added successfully!' });
        setTimeout(() => navigate('/bank-data'), 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to add bank.' });
      }
    } catch (err) {
      console.error('Error adding bank:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to add bank. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/bank-data');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleCancel}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-4xl font-bold text-gray-900">Add New Bank</h1>
              </div>
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
              {/* Bank Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-6 h-6 mr-2 text-blue-600" /> Bank Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cardholder" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Cardholder <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="cardholder"
                        name="cardholder"
                        value={formData.cardholder}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardholder ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select a cardholder</option>
                        {cardholders.map(ch => (
                          <option key={ch._id} value={ch._id}>{ch.name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.cardholder && <p className="mt-1 text-sm text-red-600">{errors.cardholder}</p>}
                  </div>

                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter bank name"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
                  </div>

                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter card number"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                  </div>

                  <div>
                    <label htmlFor="cardType" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="cardType"
                        name="cardType"
                        value={formData.cardType}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select card type</option>
                        <option value="Credit">Credit</option>
                        <option value="Debit">Debit</option>
                        <option value="Prepaid">Prepaid</option>
                      </select>
                    </div>
                    {errors.cardType && <p className="mt-1 text-sm text-red-600">{errors.cardType}</p>}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" /> Financial Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="cardLimit" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Limit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        id="cardLimit"
                        name="cardLimit"
                        value={formData.cardLimit}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardLimit ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.cardLimit && <p className="mt-1 text-sm text-red-600">{errors.cardLimit}</p>}
                  </div>

                  <div>
                    <label htmlFor="outstandingAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Outstanding Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        id="outstandingAmount"
                        name="outstandingAmount"
                        value={formData.outstandingAmount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="availableLimit" className="block text-sm font-medium text-gray-700 mb-2">
                      Available Limit (Auto-calculated)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        id="availableLimit"
                        name="availableLimit"
                        value={formData.availableLimit}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={20} />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <Save size={20} />
                  )}
                  <span>Add Bank</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddBank;
