const PDFProcessor = require('./pdfProcessor');
const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const Cardholder = require('../models/Cardholder');
const Bank = require('../models/Bank');

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
      console.log(`Starting processing for statement: ${statementId}, userId: ${userId}`);
      
      // Validate statement ID
      if (!statementId || statementId === 'undefined' || statementId === 'null') {
        throw new Error('Invalid statement ID: ' + statementId);
      }
      
      // Validate user ID
      if (!userId || userId === 'undefined' || userId === 'null') {
        throw new Error('Invalid user ID: ' + userId);
      }
      
      // Get statement
      const statement = await Statement.findById(statementId);
      if (!statement) {
        throw new Error(`Statement not found with ID: ${statementId}`);
      }

      // Update status to processing
      await statement.updateStatus('processing', userId);
      console.log('Status updated to processing');

      // Process PDF
      const metadata = {
        cardholder: statement.cardholder,
        month: statement.month,
        year: statement.year,
        bankName: statement.bankName,
        cardNumber: statement.cardNumber
      };

      console.log('Processing PDF file:', statement.filePath);
      
      let parsedData;
      try {
        parsedData = await PDFProcessor.processPDF(statement.filePath, metadata);
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        // Update statement status to failed with error message
        statement.status = 'failed';
        statement.processingError = pdfError.message || 'Failed to process PDF';
        await statement.save();
        throw new Error(`PDF processing failed: ${pdfError.message}`);
      }
      console.log('PDF processed successfully:', {
        transactions: parsedData.transactions.length,
        cardLimit: parsedData.summary.cardLimit,
        outstandingAmount: parsedData.summary.outstandingAmount
      });
      console.log('Sample transactions:', parsedData.transactions.slice(0, 3));
      
      if (!parsedData.transactions || parsedData.transactions.length === 0) {
        console.warn('⚠️ WARNING: No transactions extracted from PDF!');
        console.log('Parsed data keys:', Object.keys(parsedData));
        console.log('Summary data:', parsedData.summary);
      }

      // Update statement with extracted data
      // Use actual transaction count from parsedData.transactions, not summary
      const actualTransactionCount = parsedData.transactions ? parsedData.transactions.length : 0;
      const actualTotalAmount = parsedData.transactions ? 
        parsedData.transactions.reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
      
      statement.extractedData = {
        totalTransactions: actualTransactionCount,
        totalAmount: actualTotalAmount,
        cardLimit: parsedData.summary.cardLimit,
        availableLimit: parsedData.summary.availableLimit,
        outstandingAmount: parsedData.summary.outstandingAmount,
        minimumPayment: parsedData.summary.minimumPayment,
        dueDate: parsedData.summary.dueDate
      };
      
      console.log(`Statement extractedData updated: ${actualTransactionCount} transactions, $${actualTotalAmount} total`);

      await statement.save();
      console.log('Statement data updated');

      // Update Bank's outstanding amount, card limit, and available limit from statement
      if (statement.bankName && statement.cardNumber) {
        try {
          // Try to find bank by exact match first
          let bank = await Bank.findOne({
            cardholder: statement.cardholder,
            bankName: statement.bankName,
            cardNumber: statement.cardNumber,
            isDeleted: false
          });

          // If not found, try matching by bankName and last 4 digits
          if (!bank && statement.cardDigits) {
            bank = await Bank.findOne({
              cardholder: statement.cardholder,
              bankName: statement.bankName,
              $expr: {
                $eq: [
                  { $substr: ['$cardNumber', -4, 4] },
                  statement.cardDigits
                ]
              },
              isDeleted: false
            });
          }

          // If still not found, try just by bankName and cardholder
          if (!bank) {
            bank = await Bank.findOne({
              cardholder: statement.cardholder,
              bankName: statement.bankName,
              isDeleted: false
            });
          }

          if (bank) {
            // Update bank with latest statement data
            if (parsedData.summary.outstandingAmount !== undefined && parsedData.summary.outstandingAmount !== null) {
              bank.outstandingAmount = parsedData.summary.outstandingAmount;
              console.log(`Updated bank ${bank.bankName} outstanding amount to: ${bank.outstandingAmount}`);
            }
            if (parsedData.summary.cardLimit !== undefined && parsedData.summary.cardLimit !== null) {
              bank.cardLimit = parsedData.summary.cardLimit;
            }
            if (parsedData.summary.availableLimit !== undefined && parsedData.summary.availableLimit !== null) {
              bank.availableLimit = parsedData.summary.availableLimit;
            }
            await bank.save();
            console.log(`Bank ${bank.bankName} updated successfully. Outstanding: ${bank.outstandingAmount}, Limit: ${bank.cardLimit}`);
          } else {
            console.warn(`⚠️ Bank not found for cardholder ${statement.cardholder}, bank ${statement.bankName}, card ${statement.cardNumber || statement.cardDigits}`);
            console.warn('Statement processed but bank outstanding amount was not updated. Please ensure the bank account exists.');
          }
        } catch (bankError) {
          console.error('Error updating bank:', bankError);
          console.error('Bank update error stack:', bankError.stack);
          // Don't fail the whole process if bank update fails
        }
      } else {
        console.warn('⚠️ Statement missing bankName or cardNumber, cannot update bank outstanding amount');
      }

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
    
    console.log(`Creating transactions for statement ${statementId}, count: ${transactions.length}`);
    
    if (!transactions || transactions.length === 0) {
      console.warn('⚠️ No transactions to create!');
      return createdTransactions;
    }
    
    // Get statement to access cardholder
    const statement = await Statement.findById(statementId);
    if (!statement) {
      throw new Error('Statement not found');
    }

    if (!statement.cardholder) {
      throw new Error('Statement missing cardholder reference');
    }

    console.log(`Statement cardholder: ${statement.cardholder}`);

    for (let i = 0; i < transactions.length; i++) {
      const transactionData = transactions[i];
      try {
        // Validate transaction data
        if (!transactionData.date) {
          console.warn(`Transaction ${i} missing date:`, transactionData);
          continue;
        }
        if (!transactionData.description) {
          console.warn(`Transaction ${i} missing description:`, transactionData);
          continue;
        }
        if (!transactionData.amount || isNaN(transactionData.amount)) {
          console.warn(`Transaction ${i} missing or invalid amount:`, transactionData);
          continue;
        }

        const transaction = new Transaction({
          statement: statementId,
          cardholder: statement.cardholder,
          date: transactionData.date,
          description: transactionData.description.trim(),
          amount: Math.abs(parseFloat(transactionData.amount)), // Ensure positive amount
          balance: transactionData.balance ? parseFloat(transactionData.balance) : null,
          category: transactionData.category || 'unclassified',
          verified: false
        });

        const savedTransaction = await transaction.save();
        createdTransactions.push(savedTransaction);
        console.log(`✓ Created transaction ${i + 1}/${transactions.length}: ${savedTransaction.description} - $${savedTransaction.amount}`);
      } catch (error) {
        console.error(`✗ Error creating transaction ${i + 1}:`, error.message);
        console.error('Transaction data:', JSON.stringify(transactionData, null, 2));
        console.error('Error stack:', error.stack);
        // Continue with other transactions
      }
    }

    console.log(`Successfully created ${createdTransactions.length} out of ${transactions.length} transactions`);
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
