import React from 'react';
import Icon from '../../../components/AppIcon';

const UpcomingPaymentsTimeline = ({ payments }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `${diffDays} days`;
  };

  const getUrgencyColor = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-error';
    if (diffDays <= 3) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (!payments || payments?.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Calendar" size={20} className="mr-2" />
          Upcoming Payments
        </h3>
        <p className="text-muted-foreground text-center py-8">No upcoming payments in the next 7 days</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="font-semibold text-foreground mb-4 flex items-center">
        <Icon name="Calendar" size={20} className="mr-2" />
        Upcoming Payments
      </h3>
      <div className="space-y-4">
        {payments?.map((payment, index) => (
          <div key={payment?.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <div>
                <p className="font-medium text-foreground">{payment?.cardName}</p>
                <p className="text-sm text-muted-foreground">•••• {payment?.lastFourDigits}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-foreground">{formatCurrency(payment?.amount)}</p>
              <p className={`text-sm ${getUrgencyColor(payment?.dueDate)}`}>
                {formatDate(payment?.dueDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingPaymentsTimeline;