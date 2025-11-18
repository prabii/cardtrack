import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CurrencyDollarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { createExpense, EXPENSE_CATEGORIES, EXPENSE_TYPES, EXPENSE_STATUS } from '../../utils/companyApi';
import { getCompanies } from '../../utils/companyApi';
import { useRealtime } from '../../contexts/RealtimeContext';

const AddExpense = () => {
  const navigate = useNavigate();
  const { trackActivity } = useRealtime();
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    company: '',
    title: '',
    description: '',
    amount: '',
    category: 'other',
    type: 'variable',
    frequency: 'one_time',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'card',
    vendor: '',
    receiptNumber: '',
    isRecurring: false,
    recurringEndDate: '',
    status: 'pending'
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
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.type) {
      newErrors.type = 'Expense type is required';
    }
    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
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
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        frequency: formData.frequency,
        expenseDate: formData.expenseDate,
        paymentMethod: formData.paymentMethod,
        vendor: formData.vendor?.trim() || '',
        receiptNumber: formData.receiptNumber?.trim() || '',
        isRecurring: formData.isRecurring,
        status: formData.status
      };

      if (formData.recurringEndDate) {
        cleanedData.recurringEndDate = formData.recurringEndDate;
      }

      // Remove empty optional fields
      if (!cleanedData.description) delete cleanedData.description;
      if (!cleanedData.vendor) delete cleanedData.vendor;
      if (!cleanedData.receiptNumber) delete cleanedData.receiptNumber;
      if (!cleanedData.recurringEndDate) delete cleanedData.recurringEndDate;

      const response = await createExpense(cleanedData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Expense created successfully!' });
        trackActivity('company', 'created', 'expense', { expenseId: response.data._id });
        
        setTimeout(() => {
          navigate('/company');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create expense' });
      }
    } catch (error) {
      console.error('Create expense error:', error);
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
                            'Failed to create expense. Please try again.';
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'office_rent', label: 'Office Rent' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'salaries', label: 'Salaries' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'software', label: 'Software' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'travel', label: 'Travel' },
    { value: 'meals', label: 'Meals' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'legal', label: 'Legal' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ];

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
          <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Expense</h1>
            <p className="text-gray-600 mt-2">Record a new company expense</p>
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

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Office Rent - January"
                  required
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional details about this expense"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="one_time">One Time</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="expenseDate"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expenseDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.expenseDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expenseDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vendor name"
                />
              </div>

              <div>
                <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  id="receiptNumber"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Receipt number"
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                  This is a recurring expense
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label htmlFor="recurringEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Recurring End Date
                  </label>
                  <input
                    type="date"
                    id="recurringEndDate"
                    name="recurringEndDate"
                    value={formData.recurringEndDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                </select>
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
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;

