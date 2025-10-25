// const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

/**
 * PDF Processing Service
 * Handles extraction of text and data from PDF statements
 */
class PDFProcessor {
  /**
   * Extract text from PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<string>} - Extracted text
   */
  static async extractText(filePath) {
    try {
      // TODO: Implement PDF text extraction
      // For now, return a placeholder
      console.log('PDF text extraction not yet implemented for:', filePath);
      return 'PDF text extraction will be implemented soon. This is a placeholder for the extracted text from the PDF statement.';
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Parse credit card statement from extracted text
   * @param {string} text - Extracted text from PDF
   * @param {Object} metadata - Statement metadata
   * @returns {Object} - Parsed statement data
   */
  static parseStatement(text, metadata = {}) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const parsedData = {
      transactions: [],
      summary: {
        cardLimit: 0,
        availableLimit: 0,
        outstandingAmount: 0,
        minimumPayment: 0,
        dueDate: null,
        totalTransactions: 0,
        totalAmount: 0
      },
      rawText: text,
      metadata: metadata
    };

    // Parse transactions
    parsedData.transactions = this.extractTransactions(lines);
    
    // Parse summary information
    parsedData.summary = this.extractSummary(lines, metadata);
    
    // Calculate totals
    parsedData.summary.totalTransactions = parsedData.transactions.length;
    parsedData.summary.totalAmount = parsedData.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return parsedData;
  }

  /**
   * Extract transactions from text lines
   * @param {Array} lines - Text lines from PDF
   * @returns {Array} - Array of transaction objects
   */
  static extractTransactions(lines) {
    const transactions = [];
    const transactionPatterns = [
      // Pattern 1: Date Description Amount
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([+-]?\$?[\d,]+\.?\d*)$/,
      // Pattern 2: Date Description Amount Balance
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([+-]?\$?[\d,]+\.?\d*)\s+([+-]?\$?[\d,]+\.?\d*)$/,
      // Pattern 3: Description Date Amount
      /^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([+-]?\$?[\d,]+\.?\d*)$/
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of transactionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const transaction = this.parseTransactionLine(match, pattern);
          if (transaction) {
            transactions.push(transaction);
          }
          break;
        }
      }
    }

    return transactions;
  }

  /**
   * Parse individual transaction line
   * @param {Array} match - Regex match result
   * @param {RegExp} pattern - Pattern used for matching
   * @returns {Object|null} - Parsed transaction or null
   */
  static parseTransactionLine(match, pattern) {
    try {
      let date, description, amount, balance;

      if (pattern.source.includes('Date Description Amount Balance')) {
        [, date, description, amount, balance] = match;
      } else if (pattern.source.includes('Date Description Amount')) {
        [, date, description, amount] = match;
      } else if (pattern.source.includes('Description Date Amount')) {
        [, description, date, amount] = match;
      }

      // Clean and parse amount
      const cleanAmount = amount.replace(/[$,]/g, '');
      const parsedAmount = parseFloat(cleanAmount);
      
      if (isNaN(parsedAmount)) return null;

      // Parse date
      const parsedDate = this.parseDate(date);
      if (!parsedDate) return null;

      return {
        date: parsedDate,
        description: description.trim(),
        amount: parsedAmount,
        balance: balance ? parseFloat(balance.replace(/[$,]/g, '')) : null,
        category: 'unclassified', // Will be classified later
        verified: false,
        verifiedBy: null,
        verifiedAt: null
      };
    } catch (error) {
      console.error('Error parsing transaction line:', error);
      return null;
    }
  }

  /**
   * Parse date string to Date object
   * @param {string} dateStr - Date string
   * @returns {Date|null} - Parsed date or null
   */
  static parseDate(dateStr) {
    try {
      // Handle various date formats
      const formats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // MM/DD/YY
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          let year, month, day;
          
          if (format.source.includes('YYYY-MM-DD')) {
            [, year, month, day] = match;
          } else {
            [, month, day, year] = match;
            if (year.length === 2) {
              year = '20' + year;
            }
          }

          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  /**
   * Extract summary information from text lines
   * @param {Array} lines - Text lines from PDF
   * @param {Object} metadata - Statement metadata
   * @returns {Object} - Summary data
   */
  static extractSummary(lines, metadata) {
    const summary = {
      cardLimit: 0,
      availableLimit: 0,
      outstandingAmount: 0,
      minimumPayment: 0,
      dueDate: null,
      totalTransactions: 0,
      totalAmount: 0
    };

    // Common patterns for summary information
    const patterns = {
      cardLimit: [
        /credit limit[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /limit[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /available credit[:\s]+[\$]?([\d,]+\.?\d*)/i
      ],
      availableLimit: [
        /available credit[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /available balance[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /credit available[:\s]+[\$]?([\d,]+\.?\d*)/i
      ],
      outstandingAmount: [
        /outstanding balance[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /current balance[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /balance[:\s]+[\$]?([\d,]+\.?\d*)/i
      ],
      minimumPayment: [
        /minimum payment[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /min payment[:\s]+[\$]?([\d,]+\.?\d*)/i
      ],
      dueDate: [
        /due date[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /payment due[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i
      ]
    };

    // Search through all lines for summary information
    for (const line of lines) {
      for (const [key, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
          const match = line.match(pattern);
          if (match) {
            const value = match[1];
            
            if (key === 'dueDate') {
              summary[key] = this.parseDate(value);
            } else {
              const numValue = parseFloat(value.replace(/[$,]/g, ''));
              if (!isNaN(numValue)) {
                summary[key] = numValue;
              }
            }
            break;
          }
        }
      }
    }

    // Calculate available limit if not found
    if (summary.cardLimit > 0 && summary.outstandingAmount > 0) {
      summary.availableLimit = summary.cardLimit - summary.outstandingAmount;
    }

    return summary;
  }

  /**
   * Classify transaction into categories
   * @param {Object} transaction - Transaction object
   * @returns {string} - Category
   */
  static classifyTransaction(transaction) {
    const description = transaction.description.toLowerCase();
    
    // Bills
    if (description.includes('electric') || description.includes('water') || 
        description.includes('gas') || description.includes('internet') ||
        description.includes('phone') || description.includes('cable') ||
        description.includes('insurance') || description.includes('rent') ||
        description.includes('mortgage') || description.includes('utilities')) {
      return 'bills';
    }
    
    // Withdrawals
    if (description.includes('atm') || description.includes('withdrawal') ||
        description.includes('cash advance') || description.includes('cash back')) {
      return 'withdrawals';
    }
    
    // Orders (online purchases)
    if (description.includes('amazon') || description.includes('ebay') ||
        description.includes('shopify') || description.includes('paypal') ||
        description.includes('online') || description.includes('web')) {
      return 'orders';
    }
    
    // Fees
    if (description.includes('fee') || description.includes('charge') ||
        description.includes('interest') || description.includes('late') ||
        description.includes('overdraft') || description.includes('penalty')) {
      return 'fees';
    }
    
    // Personal Use (restaurants, groceries, entertainment)
    if (description.includes('restaurant') || description.includes('grocery') ||
        description.includes('gas station') || description.includes('movie') ||
        description.includes('entertainment') || description.includes('dining') ||
        description.includes('coffee') || description.includes('fast food')) {
      return 'personal_use';
    }
    
    return 'unclassified';
  }

  /**
   * Process PDF file and extract all data
   * @param {string} filePath - Path to PDF file
   * @param {Object} metadata - Statement metadata
   * @returns {Promise<Object>} - Complete parsed data
   */
  static async processPDF(filePath, metadata = {}) {
    try {
      console.log('Starting PDF processing for:', filePath);
      
      // Extract text from PDF
      const text = await this.extractText(filePath);
      console.log('Text extracted, length:', text.length);
      
      // Parse statement data
      const parsedData = this.parseStatement(text, metadata);
      console.log('Statement parsed, transactions found:', parsedData.transactions.length);
      
      // Classify transactions
      parsedData.transactions = parsedData.transactions.map(transaction => ({
        ...transaction,
        category: this.classifyTransaction(transaction)
      }));
      
      console.log('Transactions classified');
      
      return parsedData;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }
}

module.exports = PDFProcessor;
