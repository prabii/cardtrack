import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BanknotesIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { createFDCard } from '../../utils/companyApi';
import { getCompanies } from '../../utils/companyApi';
import { useRealtime } from '../../contexts/RealtimeContext';

const AddFDCard = () => {
  const navigate = useNavigate();
  const { trackActivity } = useRealtime();
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    company: '',
    cardNumber: '',
    bankName: '',
    accountHolder: '',
    principalAmount: '',
    interestRate: '',
    startDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    autoRenewal: false,
    notes: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await getCompanies({ limit: 100 });
      if (response.success) {
        setCompanies(response.data.companies || []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company) {
      newErrors.company = 'Company is required';
    }
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    }
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    if (!formData.accountHolder.trim()) {
      newErrors.accountHolder = 'Account holder name is required';
    }
    if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
      newErrors.principalAmount = 'Valid principal amount is required';
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0 || parseFloat(formData.interestRate) > 100) {
      newErrors.interestRate = 'Valid interest rate (0-100%) is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.maturityDate) {
      newErrors.maturityDate = 'Maturity date is required';
    }
    if (formData.maturityDate && formData.startDate && new Date(formData.maturityDate) <= new Date(formData.startDate)) {
      newErrors.maturityDate = 'Maturity date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors before submitting' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const cleanedData = {
        company: formData.company,
        cardNumber: formData.cardNumber.trim(),
        bankName: formData.bankName.trim(),
        accountHolder: formData.accountHolder.trim(),
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        maturityDate: formData.maturityDate,
        autoRenewal: formData.autoRenewal,
        status: formData.status,
        notes: formData.notes?.trim() || ''
      };

      if (!cleanedData.notes) delete cleanedData.notes;

      const response = await createFDCard(cleanedData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'FD Card created successfully!' });
        trackActivity('company', 'created', 'fd_card', { fdCardId: response.data._id });
        
        setTimeout(() => {
          navigate('/company');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create FD card' });
      }
    } catch (error) {
      console.error('Create FD card error:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = {};
        error.response.data.errors.forEach((err) => {
          const field = err.param || err.path;
          if (field) {
            validationErrors[field] = err.msg || err.message;
          }
        });
        setErrors(validationErrors);
        setMessage({ 
          type: 'error', 
          text: `Validation failed: ${error.response.data.errors.map(e => e.msg).join('; ')}` 
        });
      } else {
        const errorMessage = error.response?.data?.message || 
                            'Failed to create FD card. Please try again.';
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/company')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Company Management
        </button>
        <div className="flex items-center gap-3">
          <BanknotesIcon className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New FD Card</h1>
            <p className="text-gray-600 mt-2">Register a new Fixed Deposit card</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <XCircleIcon className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.company ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map(company => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="FD Card Number"
                    required
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.bankName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Bank Name"
                    required
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountHolder"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountHolder ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Account Holder Name"
                  required
                />
                {errors.accountHolder && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountHolder}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="principalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Principal Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="principalAmount"
                  name="principalAmount"
                  value={formData.principalAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.principalAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {errors.principalAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.principalAmount}</p>
                )}
              </div>

              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.interestRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {errors.interestRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="maturityDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Maturity Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="maturityDate"
                  name="maturityDate"
                  value={formData.maturityDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.maturityDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.maturityDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.maturityDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="matured">Matured</option>
                  <option value="closed">Closed</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRenewal"
                  name="autoRenewal"
                  checked={formData.autoRenewal}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoRenewal" className="ml-2 text-sm text-gray-700">
                  Auto Renewal
                </label>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this FD card"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/company')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create FD Card'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddFDCard;

