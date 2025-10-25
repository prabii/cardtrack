import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const CardInformationSection = ({ 
  formData, 
  handleInputChange, 
  errors, 
  cardTypeOptions 
}) => {
  const formatCardNumber = (value) => {
    const v = value?.replace(/\s+/g, '')?.replace(/[^0-9]/gi, '');
    const matches = v?.match(/\d{4,16}/g);
    const match = matches && matches?.[0] || '';
    const parts = [];
    for (let i = 0, len = match?.length; i < len; i += 4) {
      parts?.push(match?.substring(i, i + 4));
    }
    if (parts?.length) {
      return parts?.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value?.replace(/\D/g, '');
    if (v?.length >= 2) {
      return v?.substring(0, 2) + '/' + v?.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e?.target?.value);
    handleInputChange('cardNumber', formatted);
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e?.target?.value);
    handleInputChange('expiryDate', formatted);
  };

  const handleCvvChange = (e) => {
    const value = e?.target?.value?.replace(/\D/g, '')?.substring(0, 4);
    handleInputChange('cvv', value);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-semibold text-sm">1</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Card Information</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Card Number"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={formData?.cardNumber}
            onChange={handleCardNumberChange}
            error={errors?.cardNumber}
            required
            maxLength={19}
            className="font-data"
          />
        </div>

        <div>
          <Input
            label="Expiry Date"
            type="text"
            placeholder="MM/YY"
            value={formData?.expiryDate}
            onChange={handleExpiryChange}
            error={errors?.expiryDate}
            required
            maxLength={5}
            className="font-data"
          />
        </div>

        <div>
          <Input
            label="CVV"
            type="password"
            placeholder="123"
            value={formData?.cvv}
            onChange={handleCvvChange}
            error={errors?.cvv}
            required
            maxLength={4}
            className="font-data"
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Cardholder Name"
            type="text"
            placeholder="John Doe"
            value={formData?.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e?.target?.value?.toUpperCase())}
            error={errors?.cardholderName}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Select
            label="Card Type"
            placeholder="Select card type"
            options={cardTypeOptions}
            value={formData?.cardType}
            onChange={(value) => handleInputChange('cardType', value)}
            error={errors?.cardType}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default CardInformationSection;