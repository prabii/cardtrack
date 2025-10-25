import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CreditCardSummary = ({ card, onViewDetails, onAddTransaction, onMarkPaid }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent':
        return 'text-error bg-error/10 border-error/20';
      case 'upcoming':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'paid':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'urgent':
        return 'Urgent';
      case 'upcoming':
        return 'Due Soon';
      case 'paid':
        return 'Paid';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-card hover:shadow-interactive transition-shadow duration-200">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="CreditCard" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{card?.name}</h3>
            <p className="text-sm text-muted-foreground">•••• {card?.lastFourDigits}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(card?.status)}`}>
          {getStatusText(card?.status)}
        </div>
      </div>
      {/* Card Details */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Current Balance</span>
          <span className="font-semibold text-foreground">{formatCurrency(card?.currentBalance)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Due Date</span>
          <span className="font-medium text-foreground">{formatDate(card?.dueDate)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Minimum Payment</span>
          <span className="font-medium text-foreground">{formatCurrency(card?.minimumPayment)}</span>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(card?.id)}
          iconName="Eye"
          iconPosition="left"
          iconSize={14}
          className="flex-1"
        >
          Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTransaction(card?.id)}
          iconName="Plus"
          iconPosition="left"
          iconSize={14}
          className="flex-1"
        >
          Add
        </Button>
        {card?.status !== 'paid' && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onMarkPaid(card?.id)}
            iconName="Check"
            iconPosition="left"
            iconSize={14}
            className="flex-1"
          >
            Paid
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreditCardSummary;