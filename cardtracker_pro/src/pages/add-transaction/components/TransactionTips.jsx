import React from 'react';
import Icon from '../../../components/AppIcon';

const TransactionTips = () => {
  const tips = [
    {
      id: 1,
      icon: 'Calendar',
      title: 'Record Immediately',
      description: 'Add transactions as soon as possible to maintain accurate records and avoid forgetting details.'
    },
    {
      id: 2,
      icon: 'Tag',
      title: 'Use Proper Categories',
      description: 'Consistent categorization helps with budgeting and expense tracking over time.'
    },
    {
      id: 3,
      icon: 'Receipt',
      title: 'Keep Receipts',
      description: 'Upload receipt photos for important purchases, especially for business expenses or returns.'
    },
    {
      id: 4,
      icon: 'DollarSign',
      title: 'Double-Check Amounts',
      description: 'Verify transaction amounts match your receipt to catch any processing errors early.'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-8 h-8 bg-warning/10 rounded-lg mr-3">
          <Icon name="Lightbulb" size={16} className="text-warning" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Transaction Tips</h3>
      </div>
      <div className="space-y-4">
        {tips?.map((tip) => (
          <div key={tip?.id} className="flex items-start">
            <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg mr-3 mt-0.5 flex-shrink-0">
              <Icon name={tip?.icon} size={16} className="text-muted-foreground" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-foreground text-sm">{tip?.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {tip?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Icon name="Info" size={16} className="mr-2" />
          <span>Best practices for transaction management</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionTips;