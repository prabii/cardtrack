import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const CardIdentificationSection = ({ 
  formData, 
  handleInputChange, 
  errors, 
  bankOptions 
}) => {
  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-semibold text-sm">3</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Card Identification</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Card Nickname"
            type="text"
            placeholder="My Primary Card"
            value={formData?.nickname}
            onChange={(e) => handleInputChange('nickname', e?.target?.value)}
            error={errors?.nickname}
            required
            description="Easy name to identify this card"
          />
        </div>

        <div>
          <Select
            label="Issuing Bank"
            placeholder="Select bank"
            options={bankOptions}
            value={formData?.bank}
            onChange={(value) => handleInputChange('bank', value)}
            error={errors?.bank}
            required
            searchable
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Card Description (Optional)"
            type="text"
            placeholder="Travel rewards card with 2x points"
            value={formData?.description}
            onChange={(e) => handleInputChange('description', e?.target?.value)}
            description="Additional notes about this card"
          />
        </div>
      </div>
    </div>
  );
};

export default CardIdentificationSection;