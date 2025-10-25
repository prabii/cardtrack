// const PDFProcessor = require('./pdfProcessor');
const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const Cardholder = require('../models/Cardholder');

/**
 * Statement Processing Service
 * Handles the complete processing of uploaded statements
 */
class StatementProcessor {
  /**
   * Process a statement from uploaded to processed
   * @param {string} statementId - Statement ID
   * @param {string} userId - User ID who initiated processing
   * @returns {Promise<Object>} - Processing result
   */
  static async processStatement(statementId, userId) {
    try {
      console.log(`Starting processing for statement: ${statementId}`);
      
      // Get statement
      const statement = await Statement.findById(statementId);
      if (!statement) {
        throw new Error('Statement not found');
      }

      // Update status to processing
      await statement.updateStatus('processing', userId);
      console.log('Status updated to processing');

      // Process PDF (temporarily disabled)
      const metadata = {
        cardholder: statement.cardholder,
        month: statement.month,
        year: statement.year,
        bankName: statement.bankName,
        cardNumber: statement.cardNumber
      };

      // TODO: Implement PDF processing
      const parsedData = {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalAmount: 0,
          cardLimit: 0,
          availableLimit: 0,
          outstandingAmount: 0,
          minimumPayment: 0,
          dueDate: null
        }
      };
      console.log('PDF processing temporarily disabled');

      // Update statement with extracted data
      statement.extractedData = {
        totalTransactions: parsedData.summary.totalTransactions,
        totalAmount: parsedData.summary.totalAmount,
        cardLimit: parsedData.summary.cardLimit,
        availableLimit: parsedData.summary.availableLimit,
        outstandingAmount: parsedData.summary.outstandingAmount,
        minimumPayment: parsedData.summary.minimumPayment,
        dueDate: parsedData.summary.dueDate
      };

      await statement.save();
      console.log('Statement data updated');

      // Create transaction records
      const transactions = await this.createTransactions(statementId, parsedData.transactions);
      console.log(`Created ${transactions.length} transactions`);

      // Update status to processed
      await statement.updateStatus('processed', userId);
      console.log('Status updated to processed');

      return {
        success: true,
        statement: statement.getPublicInfo(),
        transactions: transactions.length,
        message: 'Statement processed successfully'
      };

    } catch (error) {
      console.error('Error processing statement:', error);
      
      // Update statement status to failed
      try {
        const statement = await Statement.findById(statementId);
        if (statement) {
          statement.status = 'failed';
          statement.processingError = error.message;
          await statement.save();
        }
      } catch (updateError) {
        console.error('Error updating statement status to failed:', updateError);
      }

      throw error;
    }
  }

  /**
   * Create transaction records from parsed data
   * @param {string} statementId - Statement ID
   * @param {Array} transactions - Array of transaction data
   * @returns {Promise<Array>} - Created transactions
   */
  static async createTransactions(statementId, transactions) {
    const createdTransactions = [];

    for (const transactionData of transactions) {
      try {
        const transaction = new Transaction({
          statement: statementId,
          cardholder: transactionData.cardholder || statementId.cardholder,
          date: transactionData.date,
          description: transactionData.description,
          amount: transactionData.amount,
          balance: transactionData.balance,
          category: transactionData.category,
          verified: false
        });

        const savedTransaction = await transaction.save();
        createdTransactions.push(savedTransaction);
      } catch (error) {
        console.error('Error creating transaction:', error);
        // Continue with other transactions
      }
    }

    return createdTransactions;
  }

  /**
   * Process all pending statements
   * @param {string} userId - User ID who initiated processing
   * @returns {Promise<Object>} - Processing results
   */
  static async processAllPending(userId) {
    try {
      console.log('Processing all pending statements');
      
      const pendingStatements = await Statement.findPending();
      console.log(`Found ${pendingStatements.length} pending statements`);

      const results = {
        processed: 0,
        failed: 0,
        errors: []
      };

      for (const statement of pendingStatements) {
        try {
          await this.processStatement(statement._id, userId);
          results.processed++;
          console.log(`Processed statement: ${statement._id}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            statementId: statement._id,
            error: error.message
          });
          console.error(`Failed to process statement ${statement._id}:`, error.message);
        }
      }

      return {
        success: true,
        results,
        message: `Processed ${results.processed} statements, ${results.failed} failed`
      };

    } catch (error) {
      console.error('Error processing pending statements:', error);
      throw error;
    }
  }

  /**
   * Get statement processing statistics
   * @returns {Promise<Object>} - Processing statistics
   */
  static async getProcessingStats() {
    try {
      const stats = await Statement.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalStatements = await Statement.countDocuments({ isDeleted: false });
      const totalTransactions = await Transaction.countDocuments({ isDeleted: false });
      const verifiedTransactions = await Transaction.countDocuments({ 
        isDeleted: false, 
        verified: true 
      });

      return {
        success: true,
        data: {
          statements: {
            total: totalStatements,
            byStatus: stats
          },
          transactions: {
            total: totalTransactions,
            verified: verifiedTransactions,
            unverified: totalTransactions - verifiedTransactions
          }
        }
      };

    } catch (error) {
      console.error('Error getting processing stats:', error);
      throw error;
    }
  }

  /**
   * Reprocess a statement
   * @param {string} statementId - Statement ID
   * @param {string} userId - User ID who initiated reprocessing
   * @returns {Promise<Object>} - Reprocessing result
   */
  static async reprocessStatement(statementId, userId) {
    try {
      console.log(`Reprocessing statement: ${statementId}`);

      // Delete existing transactions for this statement
      await Transaction.deleteMany({ statement: statementId });
      console.log('Deleted existing transactions');

      // Process statement again
      const result = await this.processStatement(statementId, userId);
      console.log('Reprocessing completed');

      return result;

    } catch (error) {
      console.error('Error reprocessing statement:', error);
      throw error;
    }
  }

  /**
   * Get statement with transactions
   * @param {string} statementId - Statement ID
   * @returns {Promise<Object>} - Statement with transactions
   */
  static async getStatementWithTransactions(statementId) {
    try {
      const statement = await Statement.findById(statementId)
        .populate('cardholder', 'name email')
        .populate('uploadedBy', 'name email')
        .populate('processedBy', 'name email');

      if (!statement) {
        throw new Error('Statement not found');
      }

      const transactions = await Transaction.findByStatement(statementId);

      return {
        success: true,
        data: {
          statement: statement.getPublicInfo(),
          transactions: transactions.map(t => t.getPublicInfo())
        }
      };

    } catch (error) {
      console.error('Error getting statement with transactions:', error);
      throw error;
    }
  }
}

module.exports = StatementProcessor;
