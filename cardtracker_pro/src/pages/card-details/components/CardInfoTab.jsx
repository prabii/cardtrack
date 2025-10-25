import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';


const CardInfoTab = ({ card, onSaveCard }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: card?.name,
    cardNumber: card?.cardNumber,
    expiryDate: card?.expiryDate,
    cvv: card?.cvv,
    cardholderName: card?.cardholderName,
    type: card?.type,
    creditLimit: card?.creditLimit,
    billingDate: card?.billingDate,
    dueDate: card?.dueDate,
    interestRate: card?.interestRate,
    annualFee: card?.annualFee
  });

  const cardTypeOptions = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSaveCard(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: card?.name,
      cardNumber: card?.cardNumber,
      expiryDate: card?.expiryDate,
      cvv: card?.cvv,
      cardholderName: card?.cardholderName,
      type: card?.type,
      creditLimit: card?.creditLimit,
      billingDate: card?.billingDate,
      dueDate: card?.dueDate,
      interestRate: card?.interestRate,
      annualFee: card?.annualFee
    });
    setIsEditing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-foreground">Card Information</h3>
        
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            iconName="Edit"
            iconPosition="left"
            iconSize={16}
          >
            Edit Card
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              iconName="X"
              iconPosition="left"
              iconSize={16}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              iconName="Check"
              iconPosition="left"
              iconSize={16}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground border-b border-border pb-2">Basic Information</h4>
          
          <Input
            label="Card Name"
            type="text"
            value={formData?.name}
            onChange={(e) => handleInputChange('name', e?.target?.value)}
            disabled={!isEditing}
            placeholder="Enter card name"
          />

          <Input
            label="Cardholder Name"
            type="text"
            value={formData?.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e?.target?.value)}
            disabled={!isEditing}
            placeholder="Enter cardholder name"
          />

          <Select
            label="Card Type"
            options={cardTypeOptions}
            value={formData?.type}
            onChange={(value) => handleInputChange('type', value)}
            disabled={!isEditing}
          />

          <Input
            label="Card Number"
            type="text"
            value={formData?.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', e?.target?.value)}
            disabled={!isEditing}
            placeholder="**** **** **** ****"
          />
        </div>

        {/* Security & Dates */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground border-b border-border pb-2">Security & Dates</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              type="text"
              value={formData?.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e?.target?.value)}
              disabled={!isEditing}
              placeholder="MM/YY"
            />

            <Input
              label="CVV"
              type="text"
              value={formData?.cvv}
              onChange={(e) => handleInputChange('cvv', e?.target?.value)}
              disabled={!isEditing}
              placeholder="***"
            />
          </div>

          <Input
            label="Billing Date"
            type="number"
            value={formData?.billingDate}
            onChange={(e) => handleInputChange('billingDate', e?.target?.value)}
            disabled={!isEditing}
            placeholder="Day of month (1-31)"
            min="1"
            max="31"
          />

          <Input
            label="Due Date"
            type="number"
            value={formData?.dueDate}
            onChange={(e) => handleInputChange('dueDate', e?.target?.value)}
            disabled={!isEditing}
            placeholder="Day of month (1-31)"
            min="1"
            max="31"
          />
        </div>

        {/* Financial Information */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="font-medium text-foreground border-b border-border pb-2">Financial Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Credit Limit"
              type="number"
              value={formData?.creditLimit}
              onChange={(e) => handleInputChange('creditLimit', e?.target?.value)}
              disabled={!isEditing}
              placeholder="0.00"
              min="0"
              step="0.01"
            />

            <Input
              label="Interest Rate (%)"
              type="number"
              value={formData?.interestRate}
              onChange={(e) => handleInputChange('interestRate', e?.target?.value)}
              disabled={!isEditing}
              placeholder="0.00"
              min="0"
              step="0.01"
            />

            <Input
              label="Annual Fee"
              type="number"
              value={formData?.annualFee}
              onChange={(e) => handleInputChange('annualFee', e?.target?.value)}
              disabled={!isEditing}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Summary Information (Read-only) */}
        {!isEditing && (
          <div className="md:col-span-2 bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Current Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Balance</span>
                <div className="font-medium text-foreground">{formatCurrency(card?.currentBalance)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Available Credit</span>
                <div className="font-medium text-success">
                  {formatCurrency(card?.creditLimit - card?.currentBalance)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Utilization</span>
                <div className="font-medium text-foreground">
                  {((card?.currentBalance / card?.creditLimit) * 100)?.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className={`font-medium capitalize ${
                  card?.status === 'current' ? 'text-success' : 
                  card?.status === 'due' ? 'text-warning' : 'text-error'
                }`}>
                  {card?.status}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardInfoTab;