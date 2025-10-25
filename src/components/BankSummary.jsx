import React from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

const BankSummary = ({ bank, transactions = [], onRefresh }) => {
  // Calculate transaction totals by category
  const calculateCategoryTotals = () => {
    const totals = {
      bills: 0,
      withdrawals: 0,
      orders: 0,
      fees: 0,
      personal: 0,
      unclassified: 0
    };

    transactions.forEach(transaction => {
      const amount = transaction.amount || 0;
      if (transaction.category) {
        totals[transaction.category] = (totals[transaction.category] || 0) + amount;
      } else {
        totals.unclassified += amount;
      }
    });

    return totals;
  };

  // Calculate verification status
  const calculateVerificationStatus = () => {
    const total = transactions.length;
    const verified = transactions.filter(t => t.verified).length;
    const pending = transactions.filter(t => t.pendingVerification).length;
    const unverified = total - verified - pending;

    return { total, verified, pending, unverified };
  };

  // Calculate payout totals for orders
  const calculatePayoutTotals = () => {
    const orderTransactions = transactions.filter(t => t.category === 'orders');
    const totalOrderAmount = orderTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalPayoutAmount = orderTransactions.reduce((sum, t) => sum + (t.payoutAmount || 0), 0);
    const receivedPayouts = orderTransactions.filter(t => t.payoutReceived).reduce((sum, t) => sum + (t.payoutAmount || 0), 0);
    const pendingPayouts = totalPayoutAmount - receivedPayouts;

    return {
      totalOrderAmount,
      totalPayoutAmount,
      receivedPayouts,
      pendingPayouts
    };
  };

  const categoryTotals = calculateCategoryTotals();
  const verificationStatus = calculateVerificationStatus();
  const payoutTotals = calculatePayoutTotals();

  const availableLimit = (bank.cardLimit || 0) - (bank.outstandingAmount || 0);
  const utilizationPercentage = bank.cardLimit > 0 ? ((bank.outstandingAmount || 0) / bank.cardLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Bank Card Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{bank.bankName}</h3>
            <p className="text-blue-100">Credit Card Account</p>
          </div>
          <CreditCard className="w-8 h-8 text-blue-200" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-blue-200 text-sm">Card Number</p>
            <p className="text-lg font-semibold">{bank.cardNumber || '**** **** **** ****'}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Card Limit</p>
            <p className="text-lg font-semibold">${(bank.cardLimit || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Available Limit</p>
            <p className="text-lg font-semibold">${availableLimit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Outstanding Amount */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
              <p className="text-2xl font-bold text-red-600">
                ${(bank.outstandingAmount || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {utilizationPercentage.toFixed(1)}% utilization
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600">
                {transactions.length}
              </p>
              <p className="text-xs text-gray-500">
                {verificationStatus.verified} verified
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Orders Total */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${categoryTotals.orders.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {payoutTotals.receivedPayouts > 0 ? `$${payoutTotals.receivedPayouts.toLocaleString()} received` : 'No payouts'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Bills Total */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bills Total</p>
              <p className="text-2xl font-bold text-red-600">
                ${categoryTotals.bills.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {categoryTotals.fees > 0 ? `$${categoryTotals.fees.toLocaleString()} in fees` : 'No fees'}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Transaction Categories Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categoryTotals).map(([category, amount]) => {
            if (amount === 0) return null;
            
            const categoryColors = {
              bills: 'bg-red-100 text-red-800',
              withdrawals: 'bg-blue-100 text-blue-800',
              orders: 'bg-green-100 text-green-800',
              fees: 'bg-yellow-100 text-yellow-800',
              personal: 'bg-purple-100 text-purple-800',
              unclassified: 'bg-gray-100 text-gray-800'
            };

            return (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category]}`}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  ${amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Verified</p>
              <p className="text-sm text-green-600">{verificationStatus.verified} transactions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Pending</p>
              <p className="text-sm text-yellow-600">{verificationStatus.pending} transactions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Unverified</p>
              <p className="text-sm text-red-600">{verificationStatus.unverified} transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Summary (for Orders) */}
      {categoryTotals.orders > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Payout Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Order Value</p>
              <p className="text-xl font-bold text-blue-800">
                ${payoutTotals.totalOrderAmount.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Received Payouts</p>
              <p className="text-xl font-bold text-green-800">
                ${payoutTotals.receivedPayouts.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Pending Payouts</p>
              <p className="text-xl font-bold text-yellow-800">
                ${payoutTotals.pendingPayouts.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Payout Rate</p>
              <p className="text-xl font-bold text-purple-800">
                {payoutTotals.totalOrderAmount > 0 
                  ? ((payoutTotals.totalPayoutAmount / payoutTotals.totalOrderAmount) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankSummary;
