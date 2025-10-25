import React from 'react';
import Icon from '../../../components/AppIcon';

const RecentActivityFeed = ({ activities }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'groceries':
        return 'ShoppingCart';
      case 'gas':
        return 'Fuel';
      case 'dining':
        return 'Utensils';
      case 'shopping':
        return 'ShoppingBag';
      case 'entertainment':
        return 'Film';
      case 'travel':
        return 'Plane';
      case 'payment':
        return 'CreditCard';
      default:
        return 'DollarSign';
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'groceries':
        return 'text-green-600 bg-green-100';
      case 'gas':
        return 'text-orange-600 bg-orange-100';
      case 'dining':
        return 'text-red-600 bg-red-100';
      case 'shopping':
        return 'text-purple-600 bg-purple-100';
      case 'entertainment':
        return 'text-blue-600 bg-blue-100';
      case 'travel':
        return 'text-indigo-600 bg-indigo-100';
      case 'payment':
        return 'text-success bg-success/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  if (!activities || activities?.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Activity" size={20} className="mr-2" />
          Recent Activity
        </h3>
        <p className="text-muted-foreground text-center py-8">No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="font-semibold text-foreground mb-4 flex items-center">
        <Icon name="Activity" size={20} className="mr-2" />
        Recent Activity
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities?.map((activity, index) => (
          <div key={activity?.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors duration-150">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getCategoryColor(activity?.category)}`}>
                <Icon name={getCategoryIcon(activity?.category)} size={16} />
              </div>
              <div>
                <p className="font-medium text-foreground">{activity?.description}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{activity?.cardName}</span>
                  <span>•</span>
                  <span>{formatDateTime(activity?.timestamp)}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-semibold ${activity?.type === 'payment' ? 'text-success' : 'text-foreground'}`}>
                {activity?.type === 'payment' ? '+' : '-'}{formatCurrency(activity?.amount)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{activity?.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityFeed;