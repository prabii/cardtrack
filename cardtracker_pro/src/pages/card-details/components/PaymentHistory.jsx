import React from 'react';
import Icon from '../../../components/AppIcon';

const PaymentHistory = ({ payments }) => {
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

  const formatTime = (date) => {
    return new Date(date)?.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'pending':
        return 'Clock';
      case 'failed':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  if (payments?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Icon name="DollarSign" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Payment History</h3>
        <p className="text-muted-foreground">
          No payments have been recorded for this card yet.
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
              <th className="px-6 py-3 text-left font-medium text-foreground">Date</th>
              <th className="px-6 py-3 text-left font-medium text-foreground">Amount</th>
              <th className="px-6 py-3 text-left font-medium text-foreground">Method</th>
              <th className="px-6 py-3 text-left font-medium text-foreground">Status</th>
              <th className="px-6 py-3 text-left font-medium text-foreground">Confirmation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments?.map((payment) => (
              <tr key={payment?.id} className="hover:bg-muted/30 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-foreground">
                    {formatDate(payment?.date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(payment?.date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-lg font-semibold text-success">
                    {formatCurrency(payment?.amount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="CreditCard" size={16} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">{payment?.method}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name={getPaymentStatusIcon(payment?.status)} 
                      size={16} 
                      className={getPaymentStatusColor(payment?.status)?.split(' ')?.[0]}
                    />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment?.status)}`}>
                      {payment?.status?.charAt(0)?.toUpperCase() + payment?.status?.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-data text-sm text-muted-foreground">
                    {payment?.confirmationNumber}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border">
        {payments?.map((payment) => (
          <div key={payment?.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg font-semibold text-success mb-1">
                  {formatCurrency(payment?.amount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(payment?.date)} at {formatTime(payment?.date)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Icon 
                  name={getPaymentStatusIcon(payment?.status)} 
                  size={16} 
                  className={getPaymentStatusColor(payment?.status)?.split(' ')?.[0]}
                />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment?.status)}`}>
                  {payment?.status?.charAt(0)?.toUpperCase() + payment?.status?.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <div className="flex items-center space-x-1">
                  <Icon name="CreditCard" size={14} className="text-muted-foreground" />
                  <span className="text-foreground">{payment?.method}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confirmation:</span>
                <span className="font-data text-foreground">{payment?.confirmationNumber}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentHistory;