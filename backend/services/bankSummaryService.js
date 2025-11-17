const Bank = require('../models/Bank');
const Transaction = require('../models/Transaction');
const Statement = require('../models/Statement');
const Cardholder = require('../models/Cardholder');

/**
 * Bank Summary Service
 * Handles calculations for bank summaries including limits, outstanding amounts, and profit/loss
 */
class BankSummaryService {
  /**
   * Get summary for a specific bank
   * @param {string} bankId - Bank ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Bank summary data
   */
  static async getBankSummary(bankId, filters = {}) {
    try {
      console.log(`Getting summary for bank: ${bankId}`);
      
      // Get bank details
      const bank = await Bank.findById(bankId)
        .populate('cardholder', 'name email');
      
      if (!bank) {
        throw new Error('Bank not found');
      }

      // Get all statements for this bank
      // Match by cardholder, bankName, and last 4 digits of card
      const cardDigits = bank.cardNumber ? bank.cardNumber.slice(-4) : null;
      const statementQuery = {
        cardholder: bank.cardholder._id || bank.cardholder,
        bankName: bank.bankName,
        isDeleted: false
      };
      
      // Only add cardDigits filter if we have it
      if (cardDigits && cardDigits.length === 4) {
        statementQuery.cardDigits = cardDigits;
      }
      
      const statements = await Statement.find(statementQuery).sort({ createdAt: -1 });

      // Get all transactions for this bank
      const transactionFilters = {
        cardholder: bank.cardholder._id || bank.cardholder,
        isDeleted: false
      };
      
      // If we have statements, filter by statement IDs
      if (statements.length > 0) {
        transactionFilters.statement = { $in: statements.map(s => s._id) };
      }
      // Note: If no statements, we can't reliably match transactions to this bank
      // Transactions are linked to statements, so we'll get empty results which is correct

      // Apply date filters if provided
      if (filters.startDate && filters.endDate) {
        transactionFilters.date = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const transactions = await Transaction.find(transactionFilters)
        .populate('statement', 'month year');

      // Calculate summary data
      const summary = await this.calculateBankSummary(bank, statements, transactions, filters);

      return {
        success: true,
        data: {
          bank: bank.getPublicInfo(),
          summary,
          statements: statements.map(s => s.getPublicInfo()),
          transactions: transactions.length
        }
      };

    } catch (error) {
      console.error('Error getting bank summary:', error);
      throw error;
    }
  }

  /**
   * Calculate bank summary data
   * @param {Object} bank - Bank object
   * @param {Array} statements - Array of statements
   * @param {Array} transactions - Array of transactions
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Calculated summary
   */
  static async calculateBankSummary(bank, statements, transactions, filters = {}) {
    try {
      // Basic bank information
      const summary = {
        cardLimit: bank.cardLimit || 0,
        availableLimit: bank.availableLimit || 0,
        outstandingAmount: bank.outstandingAmount || 0,
        cardholder: bank.cardholder,
        bankName: bank.bankName,
        cardNumber: bank.cardNumber,
        cardType: bank.cardType
      };

      // Calculate from latest statement if available
      const latestStatement = statements[0];
      if (latestStatement && latestStatement.extractedData) {
        summary.cardLimit = latestStatement.extractedData.cardLimit || summary.cardLimit;
        summary.availableLimit = latestStatement.extractedData.availableLimit || summary.availableLimit;
        summary.outstandingAmount = latestStatement.extractedData.outstandingAmount || summary.outstandingAmount;
        summary.minimumPayment = latestStatement.extractedData.minimumPayment || 0;
        summary.dueDate = latestStatement.extractedData.dueDate;
      }

      // Calculate transaction totals by category
      const categoryTotals = this.calculateCategoryTotals(transactions);
      summary.categoryTotals = categoryTotals;

      // Calculate overall transaction statistics
      const transactionStats = this.calculateTransactionStats(transactions);
      summary.transactionStats = transactionStats;

      // Calculate profit/loss and to give/to take
      const financials = this.calculateFinancials(categoryTotals, summary);
      summary.financials = financials;

      // Calculate verification statistics
      const verificationStats = this.calculateVerificationStats(transactions);
      summary.verificationStats = verificationStats;

      // Calculate monthly trends
      const monthlyTrends = this.calculateMonthlyTrends(statements, transactions);
      summary.monthlyTrends = monthlyTrends;

      return summary;

    } catch (error) {
      console.error('Error calculating bank summary:', error);
      throw error;
    }
  }

  /**
   * Calculate totals by category
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Category totals
   */
  static calculateCategoryTotals(transactions) {
    const categories = {
      bills: { count: 0, amount: 0, verified: 0 },
      withdrawals: { count: 0, amount: 0, verified: 0 },
      orders: { count: 0, amount: 0, verified: 0 },
      fees: { count: 0, amount: 0, verified: 0 },
      personal_use: { count: 0, amount: 0, verified: 0 },
      unclassified: { count: 0, amount: 0, verified: 0 }
    };

    transactions.forEach(transaction => {
      const category = transaction.category || 'unclassified';
      if (categories[category]) {
        categories[category].count++;
        categories[category].amount += transaction.amount || 0;
        if (transaction.verified) {
          categories[category].verified++;
        }
      }
    });

    return categories;
  }

  /**
   * Calculate transaction statistics
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Transaction statistics
   */
  static calculateTransactionStats(transactions) {
    const stats = {
      totalTransactions: transactions.length,
      totalAmount: 0,
      averageAmount: 0,
      verifiedTransactions: 0,
      unverifiedTransactions: 0,
      verifiedAmount: 0,
      unverifiedAmount: 0
    };

    transactions.forEach(transaction => {
      const amount = transaction.amount || 0;
      stats.totalAmount += amount;
      
      if (transaction.verified) {
        stats.verifiedTransactions++;
        stats.verifiedAmount += amount;
      } else {
        stats.unverifiedTransactions++;
        stats.unverifiedAmount += amount;
      }
    });

    stats.averageAmount = stats.totalTransactions > 0 ? stats.totalAmount / stats.totalTransactions : 0;

    return stats;
  }

  /**
   * Calculate financial metrics
   * @param {Object} categoryTotals - Category totals
   * @param {Object} summary - Bank summary
   * @returns {Object} - Financial calculations
   */
  static calculateFinancials(categoryTotals, summary) {
    const financials = {
      totalSpent: 0,
      totalBills: categoryTotals.bills.amount,
      totalWithdrawals: categoryTotals.withdrawals.amount,
      totalOrders: categoryTotals.orders.amount,
      totalFees: categoryTotals.fees.amount,
      totalPersonalUse: categoryTotals.personal_use.amount,
      totalUnclassified: categoryTotals.unclassified.amount,
      
      // Profit/Loss calculations (these would need business logic)
      profit: 0,
      loss: 0,
      
      // To Give/To Take calculations (these would need business logic)
      toGive: 0,
      toTake: 0,
      
      // Available credit
      availableCredit: summary.availableLimit,
      creditUtilization: 0
    };

    // Calculate total spent
    financials.totalSpent = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);

    // Calculate credit utilization
    if (summary.cardLimit > 0) {
      financials.creditUtilization = (summary.outstandingAmount / summary.cardLimit) * 100;
    }

    // TODO: Implement business logic for profit/loss and to give/to take
    // These would depend on specific business rules and cardholder agreements
    
    return financials;
  }

  /**
   * Calculate verification statistics
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Verification statistics
   */
  static calculateVerificationStats(transactions) {
    const stats = {
      totalTransactions: transactions.length,
      verifiedTransactions: 0,
      unverifiedTransactions: 0,
      verificationRate: 0,
      verifiedByCategory: {}
    };

    const categories = ['bills', 'withdrawals', 'orders', 'fees', 'personal_use', 'unclassified'];

    categories.forEach(category => {
      stats.verifiedByCategory[category] = {
        total: 0,
        verified: 0,
        rate: 0
      };
    });

    transactions.forEach(transaction => {
      const category = transaction.category || 'unclassified';
      
      if (transaction.verified) {
        stats.verifiedTransactions++;
        stats.verifiedByCategory[category].verified++;
      } else {
        stats.unverifiedTransactions++;
      }
      
      stats.verifiedByCategory[category].total++;
    });

    // Calculate verification rates
    stats.verificationRate = stats.totalTransactions > 0 ? 
      (stats.verifiedTransactions / stats.totalTransactions) * 100 : 0;

    categories.forEach(category => {
      const catStats = stats.verifiedByCategory[category];
      catStats.rate = catStats.total > 0 ? (catStats.verified / catStats.total) * 100 : 0;
    });

    return stats;
  }

  /**
   * Calculate monthly trends
   * @param {Array} statements - Array of statements
   * @param {Array} transactions - Array of transactions
   * @returns {Array} - Monthly trend data
   */
  static calculateMonthlyTrends(statements, transactions) {
    const monthlyData = {};

    // Process statements
    statements.forEach(statement => {
      const key = `${statement.year}-${statement.month}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: statement.month,
          year: statement.year,
          statements: 0,
          transactions: 0,
          totalAmount: 0,
          cardLimit: 0,
          availableLimit: 0,
          outstandingAmount: 0
        };
      }
      
      monthlyData[key].statements++;
      monthlyData[key].cardLimit = statement.extractedData?.cardLimit || 0;
      monthlyData[key].availableLimit = statement.extractedData?.availableLimit || 0;
      monthlyData[key].outstandingAmount = statement.extractedData?.outstandingAmount || 0;
    });

    // Process transactions
    transactions.forEach(transaction => {
      if (transaction.statement) {
        const statement = statements.find(s => s._id.toString() === transaction.statement._id.toString());
        if (statement) {
          const key = `${statement.year}-${statement.month}`;
          if (monthlyData[key]) {
            monthlyData[key].transactions++;
            monthlyData[key].totalAmount += transaction.amount || 0;
          }
        }
      }
    });

    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.year, this.getMonthIndex(a.month));
      const dateB = new Date(b.year, this.getMonthIndex(b.month));
      return dateB - dateA;
    });
  }

  /**
   * Get month index from month name
   * @param {string} monthName - Month name
   * @returns {number} - Month index (0-11)
   */
  static getMonthIndex(monthName) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.indexOf(monthName);
  }

  /**
   * Get overall summary across all banks
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Overall summary data
   */
  static async getOverallSummary(filters = {}) {
    try {
      console.log('Getting overall summary across all banks');

      // Get all banks
      const banks = await Bank.find({ isDeleted: false })
        .populate('cardholder', 'name email');

      const bankSummaries = [];
      let totalCardLimit = 0;
      let totalAvailableLimit = 0;
      let totalOutstandingAmount = 0;
      let totalTransactions = 0;
      let totalAmount = 0;
      let totalVerified = 0;

      // Get summary for each bank
      for (const bank of banks) {
        try {
          const summary = await this.getBankSummary(bank._id, filters);
          if (summary.success && summary.data && summary.data.summary) {
            bankSummaries.push(summary.data);
            
            const bankSummary = summary.data.summary;
            // Use bank's outstandingAmount if summary doesn't have it
            const outstanding = bankSummary.outstandingAmount !== undefined && bankSummary.outstandingAmount !== null
              ? bankSummary.outstandingAmount
              : (bank.outstandingAmount || 0);
            
            totalCardLimit += bankSummary.cardLimit || bank.cardLimit || 0;
            totalAvailableLimit += bankSummary.availableLimit || bank.availableLimit || 0;
            totalOutstandingAmount += outstanding;
            totalTransactions += summary.data.transactions || 0;
            totalAmount += bankSummary.financials?.totalSpent || 0;
            totalVerified += bankSummary.verificationStats?.verifiedTransactions || 0;
            
            console.log(`Bank ${bank.bankName}: Outstanding = ${outstanding}, Total so far = ${totalOutstandingAmount}`);
          }
        } catch (error) {
          console.error(`Error getting summary for bank ${bank._id}:`, error);
          // Still add bank's outstanding amount even if summary fails
          if (bank.outstandingAmount) {
            totalOutstandingAmount += bank.outstandingAmount;
            console.log(`Using bank's outstandingAmount directly: ${bank.outstandingAmount}`);
          }
        }
      }
      
      console.log(`Overall Summary - Total Outstanding: ${totalOutstandingAmount} from ${banks.length} banks`);

      // Calculate overall metrics
      const overallSummary = {
        totalBanks: banks.length,
        totalCardLimit,
        totalAvailableLimit,
        totalOutstandingAmount,
        totalTransactions,
        totalAmount,
        totalVerified,
        averageCardLimit: banks.length > 0 ? totalCardLimit / banks.length : 0,
        averageOutstandingAmount: banks.length > 0 ? totalOutstandingAmount / banks.length : 0,
        overallCreditUtilization: totalCardLimit > 0 ? (totalOutstandingAmount / totalCardLimit) * 100 : 0,
        verificationRate: totalTransactions > 0 ? (totalVerified / totalTransactions) * 100 : 0
      };

      return {
        success: true,
        data: {
          overallSummary,
          bankSummaries
        }
      };

    } catch (error) {
      console.error('Error getting overall summary:', error);
      throw error;
    }
  }
}

module.exports = BankSummaryService;
