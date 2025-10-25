import React from 'react';
import Input from '../../../components/ui/Input';

const BillingSection = ({ formData, handleInputChange, errors }) => {
  const handleCreditLimitChange = (e) => {
    const value = e?.target?.value?.replace(/[^0-9.]/g, '');
    const parts = value?.split('.');
    if (parts?.length > 2) return;
    if (parts?.[1] && parts?.[1]?.length > 2) return;
    handleInputChange('creditLimit', value);
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })?.format(num);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-semibold text-sm">2</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Billing Information</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Billing Cycle Date"
            type="number"
            placeholder="15"
            value={formData?.billingDate}
            onChange={(e) => {
              const value = Math.min(31, Math.max(1, parseInt(e?.target?.value) || ''));
              handleInputChange('billingDate', value);
            }}
            error={errors?.billingDate}
            required
            min={1}
            max={31}
            description="Day of the month (1-31)"
          />
        </div>

        <div>
          <Input
            label="Payment Due Date"
            type="number"
            placeholder="25"
            value={formData?.dueDate}
            onChange={(e) => {
              const value = Math.min(31, Math.max(1, parseInt(e?.target?.value) || ''));
              handleInputChange('dueDate', value);
            }}
            error={errors?.dueDate}
            required
            min={1}
            max={31}
            description="Day of the month (1-31)"
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Credit Limit"
            type="text"
            placeholder="5000.00"
            value={formData?.creditLimit}
            onChange={handleCreditLimitChange}
            error={errors?.creditLimit}
            required
            description={`Formatted: ${formatCurrency(formData?.creditLimit)}`}
          />
        </div>
      </div>
    </div>
  );
};

export default BillingSection;