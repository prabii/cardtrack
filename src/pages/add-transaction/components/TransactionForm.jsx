import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TransactionForm = ({ onSubmit, onCancel, selectedCardId = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    date: new Date()?.toISOString()?.split('T')?.[0],
    merchant: '',
    amount: '',
    category: '',
    cardId: selectedCardId || '',
    notes: '',
    receipt: null
  });

  const [errors, setErrors] = useState({});
  const [merchantSuggestions, setMerchantSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock data for cards
  const availableCards = [
    { value: '1', label: 'Chase Sapphire Preferred (*4532)', description: 'Credit Limit: $15,000' },
    { value: '2', label: 'American Express Gold (*1009)', description: 'Credit Limit: $25,000' },
    { value: '3', label: 'Citi Double Cash (*7845)', description: 'Credit Limit: $8,500' },
    { value: '4', label: 'Capital One Venture (*2156)', description: 'Credit Limit: $12,000' }
  ];

  // Mock data for categories
  const categories = [
    { value: 'groceries', label: 'Groceries' },
    { value: 'gas', label: 'Gas & Fuel' },
    { value: 'dining', label: 'Dining & Restaurants' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'travel', label: 'Travel' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
  ];

  // Mock merchant suggestions based on previous entries
  const mockMerchantSuggestions = [
    'Amazon.com',
    'Walmart Supercenter',
    'Target',
    'Starbucks',
    'McDonald\'s',
    'Shell Gas Station',
    'Home Depot',
    'Best Buy',
    'Costco Wholesale',
    'CVS Pharmacy'
  ];

  useEffect(() => {
    if (formData?.merchant?.length > 1) {
      const filtered = mockMerchantSuggestions?.filter(merchant =>
        merchant?.toLowerCase()?.includes(formData?.merchant?.toLowerCase())
      );
      setMerchantSuggestions(filtered);
      setShowSuggestions(filtered?.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [formData?.merchant]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAmountChange = (e) => {
    const value = e?.target?.value;
    // Allow only numbers and decimal point
    const numericValue = value?.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue?.split('.');
    if (parts?.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts?.[1] && parts?.[1]?.length > 2) {
      return;
    }

    handleInputChange('amount', numericValue);
  };

  const handleMerchantSelect = (merchant) => {
    handleInputChange('merchant', merchant);
    setShowSuggestions(false);
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes?.includes(file?.type)) {
        setErrors(prev => ({
          ...prev,
          receipt: 'Please upload a valid image (JPEG, PNG) or PDF file'
        }));
        return;
      }

      if (file?.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          receipt: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        receipt: file
      }));
      
      setErrors(prev => ({
        ...prev,
        receipt: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.date) {
      newErrors.date = 'Transaction date is required';
    }

    if (!formData?.merchant?.trim()) {
      newErrors.merchant = 'Merchant name is required';
    }

    if (!formData?.amount) {
      newErrors.amount = 'Transaction amount is required';
    } else if (parseFloat(formData?.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData?.category) {
      newErrors.category = 'Category selection is required';
    }

    if (!formData?.cardId) {
      newErrors.cardId = 'Please select a credit card';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (validateForm()) {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData?.amount),
        timestamp: new Date()?.toISOString()
      };
      
      onSubmit(transactionData);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg mr-3">
          <Icon name="Plus" size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Add New Transaction</h2>
          <p className="text-sm text-muted-foreground">Record your spending activity</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Date */}
        <Input
          label="Transaction Date"
          type="date"
          value={formData?.date}
          onChange={(e) => handleInputChange('date', e?.target?.value)}
          error={errors?.date}
          required
          max={new Date()?.toISOString()?.split('T')?.[0]}
        />

        {/* Merchant Name with Suggestions */}
        <div className="relative">
          <Input
            label="Merchant Name"
            type="text"
            placeholder="Enter merchant or store name"
            value={formData?.merchant}
            onChange={(e) => handleInputChange('merchant', e?.target?.value)}
            error={errors?.merchant}
            required
          />
          
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {merchantSuggestions?.map((merchant, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => handleMerchantSelect(merchant)}
                >
                  <div className="flex items-center">
                    <Icon name="Store" size={16} className="mr-2 text-muted-foreground" />
                    <span className="text-foreground">{merchant}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <Input
          label="Transaction Amount"
          type="text"
          placeholder="0.00"
          value={formData?.amount}
          onChange={handleAmountChange}
          error={errors?.amount}
          required
          description="Enter the transaction amount in USD"
        />

        {/* Category Selection */}
        <Select
          label="Category"
          placeholder="Select transaction category"
          options={categories}
          value={formData?.category}
          onChange={(value) => handleInputChange('category', value)}
          error={errors?.category}
          required
          searchable
        />

        {/* Card Selection */}
        <Select
          label="Credit Card"
          placeholder="Select the card used for this transaction"
          options={availableCards}
          value={formData?.cardId}
          onChange={(value) => handleInputChange('cardId', value)}
          error={errors?.cardId}
          required
          disabled={!!selectedCardId}
          description={selectedCardId ? "Card pre-selected from card details page" : "Choose which card was used"}
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Notes (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={3}
            placeholder="Add any additional details about this transaction..."
            value={formData?.notes}
            onChange={(e) => handleInputChange('notes', e?.target?.value)}
          />
        </div>

        {/* Receipt Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Receipt (Optional)
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-4">
            <input
              type="file"
              id="receipt"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="receipt"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Icon name="Upload" size={24} className="text-muted-foreground mb-2" />
              <span className="text-sm text-foreground font-medium">
                {formData?.receipt ? formData?.receipt?.name : 'Upload Receipt'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                PNG, JPEG, or PDF (max 5MB)
              </span>
            </label>
          </div>
          {errors?.receipt && (
            <p className="text-sm text-error mt-1">{errors?.receipt}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="default"
            loading={isLoading}
            iconName="Plus"
            iconPosition="left"
            className="sm:flex-1"
          >
            Add Transaction
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            iconName="X"
            iconPosition="left"
            className="sm:flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;