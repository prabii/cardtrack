import React from 'react';
import Icon from '../../../components/AppIcon';

const SummaryMetrics = ({ totalCards, upcomingPayments, overdueCount }) => {
  const metrics = [
    {
      label: 'Total Cards',
      value: totalCards,
      icon: 'CreditCard',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Upcoming Payments',
      value: upcomingPayments,
      icon: 'Calendar',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Overdue Alerts',
      value: overdueCount,
      icon: 'AlertTriangle',
      color: 'text-error',
      bgColor: 'bg-error/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {metrics?.map((metric, index) => (
        <div key={index} className="bg-card rounded-lg p-6 border border-border shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{metric?.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metric?.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${metric?.bgColor}`}>
              <Icon name={metric?.icon} size={24} className={metric?.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryMetrics;