import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityIndicator = () => {
  const securityFeatures = [
    {
      icon: 'Shield',
      title: 'SSL Encryption',
      description: 'Your data is protected with 256-bit SSL encryption'
    },
    {
      icon: 'Lock',
      title: 'Secure Storage',
      description: 'Card information is encrypted and stored securely'
    },
    {
      icon: 'Eye',
      title: 'Privacy Protected',
      description: 'We never share your financial information'
    }
  ];

  return (
    <div className="bg-muted/50 rounded-lg border border-border p-4 mb-6">
      <div className="flex items-center mb-3">
        <Icon name="ShieldCheck" size={20} className="text-success mr-2" />
        <h3 className="text-sm font-medium text-foreground">Security & Privacy</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {securityFeatures?.map((feature, index) => (
          <div key={index} className="flex items-start space-x-2">
            <Icon 
              name={feature?.icon} 
              size={16} 
              className="text-success mt-0.5 flex-shrink-0" 
            />
            <div>
              <p className="text-xs font-medium text-foreground">{feature?.title}</p>
              <p className="text-xs text-muted-foreground">{feature?.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityIndicator;