import React from 'react';
import Icon from '../../../components/AppIcon';

const RecentTransactions = () => {
  // Mock data for recent transactions
  const recentTransactions = [
    {
      id: 1,
      merchant: 'Amazon.com',
      amount: 89.99,
      category: 'shopping',
      date: '2025-09-12',
      card: 'Chase Sapphire (*4532)',
      icon: 'ShoppingBag'
    },
    {
      id: 2,
      merchant: 'Starbucks',
      amount: 5.75,
      category: 'dining',
      date: '2025-09-12',
      card: 'American Express Gold (*1009)',
      icon: 'Coffee'
    },
    {
      id: 3,
      merchant: 'Shell Gas Station',
      amount: 45.20,
      category: 'gas',
      date: '2025-09-11',
      card: 'Citi Double Cash (*7845)',
      icon: 'Fuel'
    },
    {
      id: 4,
      merchant: 'Walmart Supercenter',
      amount: 127.34,
      category: 'groceries',
      date: '2025-09-11',
      card: 'Capital One Venture (*2156)',
      icon: 'ShoppingCart'
    },
    {
      id: 5,
      merchant: 'Netflix',
      amount: 15.99,
      category: 'entertainment',
      date: '2025-09-10',
      card: 'Chase Sapphire (*4532)',
      icon: 'Play'
    }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      shopping: 'text-blue-600 bg-blue-50',
      dining: 'text-orange-600 bg-orange-50',
      gas: 'text-green-600 bg-green-50',
      groceries: 'text-purple-600 bg-purple-50',
      entertainment: 'text-pink-600 bg-pink-50',
      utilities: 'text-yellow-600 bg-yellow-50',
      travel: 'text-indigo-600 bg-indigo-50',
      healthcare: 'text-red-600 bg-red-50',
      education: 'text-teal-600 bg-teal-50',
      other: 'text-gray-600 bg-gray-50'
    };
    return colors?.[category] || colors?.other;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday?.setDate(yesterday?.getDate() - 1);

    if (date?.toDateString() === today?.toDateString()) {
      return 'Today';
    } else if (date?.toDateString() === yesterday?.toDateString()) {
      return 'Yesterday';
    } else {
      return date?.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg mr-3">
            <Icon name="Clock" size={16} className="text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <span className="text-sm text-muted-foreground">Last 5 entries</span>
      </div>
      <div className="space-y-3">
        {recentTransactions?.map((transaction) => (
          <div
            key={transaction?.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150"
          >
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg mr-3 ${getCategoryColor(transaction?.category)}`}>
                <Icon name={transaction?.icon} size={18} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground truncate">
                    {transaction?.merchant}
                  </h4>
                  <span className="text-lg font-semibold text-foreground ml-4">
                    ${transaction?.amount?.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="capitalize">{transaction?.category}</span>
                    <span className="mx-2">•</span>
                    <span>{transaction?.card}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(transaction?.date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Icon name="Info" size={16} className="mr-2" />
          <span>Quick reference for similar transactions</span>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;