import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const RecordPaymentModal = ({ isOpen, onClose, onRecordPayment, cardName }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date()?.toISOString()?.split('T')?.[0],
    paymentMethod: 'bank_transfer',
    confirmationNumber: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const paymentMethodOptions = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online_banking', label: 'Online Banking' },
    { value: 'check', label: 'Check' },
    { value: 'cash', label: 'Cash' },
    { value: 'auto_pay', label: 'Auto Pay' }
  ];

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.amount || parseFloat(formData?.amount) <= 0) {
      newErrors.amount = 'Please enter a valid payment amount';
    }

    if (!formData?.paymentDate) {
      newErrors.paymentDate = 'Please select a payment date';
    }

    if (!formData?.confirmationNumber?.trim()) {
      newErrors.confirmationNumber = 'Please enter a confirmation number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (validateForm()) {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData?.amount),
        id: Date.now()?.toString(),
        date: new Date(formData.paymentDate)?.toISOString(),
        status: 'completed'
      };
      
      onRecordPayment(paymentData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      paymentDate: new Date()?.toISOString()?.split('T')?.[0],
      paymentMethod: 'bank_transfer',
      confirmationNumber: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-hover w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Record Payment</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Recording payment for {cardName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Payment Amount"
            type="number"
            value={formData?.amount}
            onChange={(e) => handleInputChange('amount', e?.target?.value)}
            error={errors?.amount}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />

          <Input
            label="Payment Date"
            type="date"
            value={formData?.paymentDate}
            onChange={(e) => handleInputChange('paymentDate', e?.target?.value)}
            error={errors?.paymentDate}
            required
          />

          <Select
            label="Payment Method"
            options={paymentMethodOptions}
            value={formData?.paymentMethod}
            onChange={(value) => handleInputChange('paymentMethod', value)}
            required
          />

          <Input
            label="Confirmation Number"
            type="text"
            value={formData?.confirmationNumber}
            onChange={(e) => handleInputChange('confirmationNumber', e?.target?.value)}
            error={errors?.confirmationNumber}
            placeholder="Enter confirmation/reference number"
            required
          />

          <Input
            label="Notes (Optional)"
            type="text"
            value={formData?.notes}
            onChange={(e) => handleInputChange('notes', e?.target?.value)}
            placeholder="Additional notes about this payment"
          />

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              fullWidth
              iconName="Check"
              iconPosition="left"
              iconSize={16}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;