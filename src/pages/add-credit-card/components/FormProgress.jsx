import React from 'react';
import Icon from '../../../components/AppIcon';

const FormProgress = ({ currentStep, totalSteps, completedFields, totalFields }) => {
  const progressPercentage = (completedFields / totalFields) * 100;

  const steps = [
    { label: 'Card Info', icon: 'CreditCard' },
    { label: 'Billing', icon: 'Calendar' },
    { label: 'Identity', icon: 'User' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Form Progress</h3>
        <span className="text-xs text-muted-foreground">
          {completedFields}/{totalFields} fields completed
        </span>
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      {/* Step Indicators */}
      <div className="flex justify-between">
        {steps?.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors duration-200 ${
              index < currentStep 
                ? 'bg-success text-white' 
                : index === currentStep 
                  ? 'bg-primary text-white' :'bg-muted text-muted-foreground'
            }`}>
              {index < currentStep ? (
                <Icon name="Check" size={16} />
              ) : (
                <Icon name={step?.icon} size={16} />
              )}
            </div>
            <span className={`text-xs ${
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step?.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormProgress;