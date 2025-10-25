import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ 
  onSubmit, 
  isLoading, 
  isFormValid, 
  onReset 
}) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-card">
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={isLoading}
          iconName="RotateCcw"
          iconPosition="left"
          iconSize={16}
        >
          Reset Form
        </Button>
        
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          iconName="ArrowLeft"
          iconPosition="left"
          iconSize={16}
        >
          Cancel
        </Button>
        
        <Button
          variant="default"
          onClick={onSubmit}
          loading={isLoading}
          disabled={!isFormValid || isLoading}
          iconName="CreditCard"
          iconPosition="left"
          iconSize={16}
          className="min-w-[140px]"
        >
          {isLoading ? 'Adding Card...' : 'Add Credit Card'}
        </Button>
      </div>

      {!isFormValid && (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Please complete all required fields to add your credit card
        </p>
      )}
    </div>
  );
};

export default ActionButtons;