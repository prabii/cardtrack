import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  CreditCard,
  Users,
  CheckCircle,
  AlertTriangle,
  Calculator
} from 'lucide-react';

const OverallSummary = ({ banks = [], allTransactions = [], cardholders = [] }) => {
  // Calculate overall totals
  const calculateOverallTotals = () => {
    let totalCardLimit = 0;
    let totalOutstandingAmount = 0;
    let totalAvailableLimit = 0;
    
    const categoryTotals = {
      bills: 0,
      withdrawals: 0,
      orders: 0,
      fees: 0,
      personal: 0,
      unclassified: 0
    };

    const payoutTotals = {
      totalOrderAmount: 0,
      totalPayoutAmount: 0,
      receivedPayouts: 0,
      pendingPayouts: 0
    };

    const verificationTotals = {
      total: 0,
      verified: 0,
      pending: 0,
      unverified: 0
    };

    // Calculate bank totals
    banks.forEach(bank => {
      totalCardLimit += bank.cardLimit || 0;
      totalOutstandingAmount += bank.outstandingAmount || 0;
      totalAvailableLimit += (bank.cardLimit || 0) - (bank.outstandingAmount || 0);
    });

    // Calculate transaction totals
    allTransactions.forEach(transaction => {
      const amount = transaction.amount || 0;
      
      // Category totals
      if (transaction.category) {
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
      } else {
        categoryTotals.unclassified += amount;
      }

      // Payout totals for orders
      if (transaction.category === 'orders') {
        payoutTotals.totalOrderAmount += amount;
        payoutTotals.totalPayoutAmount += transaction.payoutAmount || 0;
        if (transaction.payoutReceived) {
          payoutTotals.receivedPayouts += transaction.payoutAmount || 0;
        }
      }

      // Verification totals
      verificationTotals.total++;
      if (transaction.verified) {
        verificationTotals.verified++;
      } else if (transaction.pendingVerification) {
        verificationTotals.pending++;
      } else {
        verificationTotals.unverified++;
      }
    });

    payoutTotals.pendingPayouts = payoutTotals.totalPayoutAmount - payoutTotals.receivedPayouts;

    return {
      totalCardLimit,
      totalOutstandingAmount,
      totalAvailableLimit,
      categoryTotals,
      payoutTotals,
      verificationTotals
    };
  };

  // Calculate profit/loss and to give/to take
  const calculateFinancialSummary = () => {
    const totals = calculateOverallTotals();
    
    // Basic calculations (formulas will be enhanced later)
    const totalIncome = totals.payoutTotals.receivedPayouts;
    const totalExpenses = totals.categoryTotals.bills + totals.categoryTotals.fees + totals.categoryTotals.personal;
    const netProfit = totalIncome - totalExpenses;
    
    // To Give = Outstanding amount that needs to be paid back
    const toGive = totals.totalOutstandingAmount;
    
    // To Take = Net profit from orders (simplified calculation)
    const toTake = Math.max(0, netProfit);
    
    // Advances to cardholders (simplified - could be enhanced with actual advance tracking)
    const advancesToCardholders = totals.categoryTotals.withdrawals;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      toGive,
      toTake,
      advancesToCardholders,
      totalAmountGiven: toGive + advancesToCardholders
    };
  };

  const totals = calculateOverallTotals();
  const financialSummary = calculateFinancialSummary();
  const utilizationPercentage = totals.totalCardLimit > 0 
    ? (totals.totalOutstandingAmount / totals.totalCardLimit) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Financial Overview */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Overall Financial Summary</h2>
            <p className="text-indigo-200">Complete overview of all cardholder accounts</p>
          </div>
          <Calculator className="w-8 h-8 text-indigo-200" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-indigo-200 text-sm">Total Card Limit</p>
            <p className="text-2xl font-bold">${totals.totalCardLimit.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-indigo-200 text-sm">Outstanding Amount</p>
            <p className="text-2xl font-bold">${totals.totalOutstandingAmount.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-indigo-200 text-sm">Available Limit</p>
            <p className="text-2xl font-bold">${totals.totalAvailableLimit.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-indigo-200 text-sm">Utilization</p>
            <p className="text-2xl font-bold">{utilizationPercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* To Give */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">To Give</p>
              <p className="text-2xl font-bold text-red-600">
                ${financialSummary.toGive.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Outstanding amounts</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* To Take */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">To Take</p>
              <p className="text-2xl font-bold text-green-600">
                ${financialSummary.toTake.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Net profit from orders</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Advances to Cardholders */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Advances to Cardholders</p>
              <p className="text-2xl font-bold text-blue-600">
                ${financialSummary.advancesToCardholders.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Withdrawal amounts</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Total Amount Given */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount Given</p>
              <p className="text-2xl font-bold text-purple-600">
                ${financialSummary.totalAmountGiven.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">To Give + Advances</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Transaction Categories Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Categories Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(totals.categoryTotals).map(([category, amount]) => {
            if (amount === 0) return null;
            
            const categoryColors = {
              bills: 'bg-red-100 text-red-800',
              withdrawals: 'bg-blue-100 text-blue-800',
              orders: 'bg-green-100 text-green-800',
              fees: 'bg-yellow-100 text-yellow-800',
              personal: 'bg-purple-100 text-purple-800',
              unclassified: 'bg-gray-100 text-gray-800'
            };

            const categoryIcons = {
              bills: <TrendingDown className="w-5 h-5" />,
              withdrawals: <Users className="w-5 h-5" />,
              orders: <TrendingUp className="w-5 h-5" />,
              fees: <AlertTriangle className="w-5 h-5" />,
              personal: <CreditCard className="w-5 h-5" />,
              unclassified: <BarChart3 className="w-5 h-5" />
            };

            return (
              <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`p-2 rounded-full ${categoryColors[category]}`}>
                    {categoryIcons[category]}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {((amount / totals.totalOutstandingAmount) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  ${amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Verified Transactions</p>
              <p className="text-sm text-green-600">
                {totals.verificationTotals.verified} of {totals.verificationTotals.total} 
                ({totals.verificationTotals.total > 0 
                  ? ((totals.verificationTotals.verified / totals.verificationTotals.total) * 100).toFixed(1)
                  : 0}%)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Pending Verification</p>
              <p className="text-sm text-yellow-600">
                {totals.verificationTotals.pending} transactions
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Unverified</p>
              <p className="text-sm text-red-600">
                {totals.verificationTotals.unverified} transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Summary */}
      {totals.payoutTotals.totalOrderAmount > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Payout Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Order Value</p>
              <p className="text-xl font-bold text-blue-800">
                ${totals.payoutTotals.totalOrderAmount.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Received Payouts</p>
              <p className="text-xl font-bold text-green-800">
                ${totals.payoutTotals.receivedPayouts.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Pending Payouts</p>
              <p className="text-xl font-bold text-yellow-800">
                ${totals.payoutTotals.pendingPayouts.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Payout Rate</p>
              <p className="text-xl font-bold text-purple-800">
                {totals.payoutTotals.totalOrderAmount > 0 
                  ? ((totals.payoutTotals.totalPayoutAmount / totals.payoutTotals.totalOrderAmount) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Banks</p>
            <p className="text-xl font-bold text-gray-800">{banks.length}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Cardholders</p>
            <p className="text-xl font-bold text-gray-800">{cardholders.length}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Transactions</p>
            <p className="text-xl font-bold text-gray-800">{totals.verificationTotals.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallSummary;
