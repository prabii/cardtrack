import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionTable = ({ transactions, onEditTransaction, onDeleteTransaction }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(Math.abs(amount));
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      groceries: 'ShoppingCart',
      dining: 'Utensils',
      gas: 'Fuel',
      shopping: 'ShoppingBag',
      entertainment: 'Film',
      travel: 'Plane',
      utilities: 'Zap',
      healthcare: 'Heart',
      other: 'MoreHorizontal'
    };
    return icons?.[category] || 'MoreHorizontal';
  };

  const getCategoryColor = (category) => {
    const colors = {
      groceries: 'text-green-600 bg-green-50',
      dining: 'text-orange-600 bg-orange-50',
      gas: 'text-blue-600 bg-blue-50',
      shopping: 'text-purple-600 bg-purple-50',
      entertainment: 'text-pink-600 bg-pink-50',
      travel: 'text-indigo-600 bg-indigo-50',
      utilities: 'text-yellow-600 bg-yellow-50',
      healthcare: 'text-red-600 bg-red-50',
      other: 'text-gray-600 bg-gray-50'
    };
    return colors?.[category] || 'text-gray-600 bg-gray-50';
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTransactions = [...transactions]?.sort((a, b) => {
    let aValue = a?.[sortField];
    let bValue = b?.[sortField];

    if (sortField === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortField === 'amount') {
      aValue = Math.abs(aValue);
      bValue = Math.abs(bValue);
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-foreground hover:text-primary transition-colors duration-150"
    >
      <span>{children}</span>
      {sortField === field && (
        <Icon 
          name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
          size={16} 
        />
      )}
    </button>
  );

  if (transactions?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Icon name="CreditCard" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Transactions Found</h3>
        <p className="text-muted-foreground mb-4">
          No transactions match your current filters or this card has no transaction history.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left">
                <SortButton field="date">Date</SortButton>
              </th>
              <th className="px-6 py-3 text-left">
                <SortButton field="description">Description</SortButton>
              </th>
              <th className="px-6 py-3 text-left">
                <SortButton field="category">Category</SortButton>
              </th>
              <th className="px-6 py-3 text-right">
                <SortButton field="amount">Amount</SortButton>
              </th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedTransactions?.map((transaction) => (
              <tr key={transaction?.id} className="hover:bg-muted/30 transition-colors duration-150">
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {formatDate(transaction?.date)}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{transaction?.description}</div>
                  {transaction?.merchant && (
                    <div className="text-sm text-muted-foreground">{transaction?.merchant}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-full ${getCategoryColor(transaction?.category)}`}>
                      <Icon name={getCategoryIcon(transaction?.category)} size={14} />
                    </div>
                    <span className="text-sm capitalize">{transaction?.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${transaction?.amount < 0 ? 'text-error' : 'text-success'}`}>
                    {transaction?.amount < 0 ? '-' : '+'}{formatCurrency(transaction?.amount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditTransaction(transaction)}
                      className="h-8 w-8"
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTransaction(transaction?.id)}
                      className="h-8 w-8 text-error hover:text-error"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border">
        {sortedTransactions?.map((transaction) => (
          <div key={transaction?.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getCategoryColor(transaction?.category)}`}>
                  <Icon name={getCategoryIcon(transaction?.category)} size={16} />
                </div>
                <div>
                  <div className="font-medium text-foreground">{transaction?.description}</div>
                  {transaction?.merchant && (
                    <div className="text-sm text-muted-foreground">{transaction?.merchant}</div>
                  )}
                </div>
              </div>
              <span className={`font-medium ${transaction?.amount < 0 ? 'text-error' : 'text-success'}`}>
                {transaction?.amount < 0 ? '-' : '+'}{formatCurrency(transaction?.amount)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{formatDate(transaction?.date)}</span>
                <span className="capitalize">{transaction?.category}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditTransaction(transaction)}
                  className="h-8 w-8"
                >
                  <Icon name="Edit" size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteTransaction(transaction?.id)}
                  className="h-8 w-8 text-error hover:text-error"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionTable;