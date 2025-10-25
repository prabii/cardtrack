import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CardHeader = ({ card, onEditCard, onRecordPayment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return 'text-success bg-success/10';
      case 'due':
        return 'text-warning bg-warning/10';
      case 'overdue':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getCardTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'visa':
        return 'CreditCard';
      case 'mastercard':
        return 'CreditCard';
      case 'amex':
        return 'CreditCard';
      default:
        return 'CreditCard';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(card?.nextDueDate);

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Card Info */}
        <div className="flex items-start space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <Icon name={getCardTypeIcon(card?.type)} size={24} className="text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-semibold text-foreground">{card?.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card?.status)}`}>
                {card?.status?.charAt(0)?.toUpperCase() + card?.status?.slice(1)}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-muted-foreground">
              <span className="font-data">**** **** **** {card?.lastFour}</span>
              <span>{card?.type}</span>
              <span>Expires {card?.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* Balance & Due Info */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="text-center sm:text-right">
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(card?.currentBalance)}</p>
          </div>
          
          <div className="text-center sm:text-right">
            <p className="text-sm text-muted-foreground mb-1">Next Due Date</p>
            <p className="text-lg font-medium text-foreground">{formatDate(card?.nextDueDate)}</p>
            <p className={`text-xs ${daysUntilDue <= 3 ? 'text-warning' : 'text-muted-foreground'}`}>
              {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : `${Math.abs(daysUntilDue)} days overdue`}
            </p>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
        <Button
          variant="default"
          size="sm"
          onClick={onRecordPayment}
          iconName="DollarSign"
          iconPosition="left"
          iconSize={16}
        >
          Record Payment
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onEditCard}
          iconName="Edit"
          iconPosition="left"
          iconSize={16}
        >
          Edit Card
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {}}
          iconName="FileText"
          iconPosition="left"
          iconSize={16}
        >
          View Statements
        </Button>
      </div>
    </div>
  );
};

export default CardHeader;