const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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
      console.log('Extracting text from PDF:', filePath);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (accessError) {
        throw new Error(`PDF file not found at path: ${filePath}`);
      }
      
      const dataBuffer = await fs.readFile(filePath);
      
      // Check if file is empty
      if (!dataBuffer || dataBuffer.length === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Basic PDF validation - check PDF header
      const pdfHeader = dataBuffer.slice(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        throw new Error('File does not appear to be a valid PDF. PDF files must start with "%PDF" header.');
      }
      
      // Check PDF version
      const pdfVersionMatch = dataBuffer.toString().match(/%PDF-(\d\.\d)/);
      if (pdfVersionMatch) {
        const version = parseFloat(pdfVersionMatch[1]);
        console.log(`PDF version detected: ${version}`);
        if (version > 1.7) {
          console.warn(`PDF version ${version} is newer than 1.7, may have compatibility issues`);
        }
      }
      
      // Try to parse PDF with multiple fallback methods
      let data;
      let parseAttempts = [];
      
      // Method 1: Try pdf-parse with options
      try {
        console.log('Attempting PDF parse with pdf-parse (method 1)...');
        data = await pdfParse(dataBuffer, { max: 0 }); // 0 = parse all pages
        parseAttempts.push('pdf-parse with options: SUCCESS');
      } catch (parseError1) {
        parseAttempts.push(`pdf-parse with options: FAILED - ${parseError1.message}`);
        console.warn('Method 1 failed:', parseError1.message);
        
        // Method 2: Try pdf-parse without options
        try {
          console.log('Attempting PDF parse without options (method 2)...');
          data = await pdfParse(dataBuffer);
          parseAttempts.push('pdf-parse without options: SUCCESS');
        } catch (parseError2) {
          parseAttempts.push(`pdf-parse without options: FAILED - ${parseError2.message}`);
          console.warn('Method 2 failed:', parseError2.message);
          
          // Method 3: Try pdf-poppler if available (requires poppler-utils system package)
          try {
            console.log('Attempting PDF parse with pdf-poppler (method 3)...');
            const pdfPoppler = require('pdf-poppler');
            const path = require('path');
            const uniquePrefix = 'temp_extract_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            const options = {
              format: 'txt',
              out_dir: path.dirname(filePath),
              out_prefix: uniquePrefix,
              page: null // Extract all pages
            };
            
            // Create a temporary PDF file for pdf-poppler
            const tempPdfPath = filePath + '.temp.pdf';
            await fs.writeFile(tempPdfPath, dataBuffer);
            
            await pdfPoppler.convert(tempPdfPath, options);
            
            // Read the extracted text file
            const textFiles = await fs.readdir(options.out_dir);
            const textFile = textFiles.find(f => f.startsWith(uniquePrefix) && f.endsWith('.txt'));
            
            if (textFile) {
              const extractedText = await fs.readFile(path.join(options.out_dir, textFile), 'utf8');
              // Clean up temp files
              await fs.unlink(tempPdfPath).catch(() => {});
              await fs.unlink(path.join(options.out_dir, textFile)).catch(() => {});
              
              if (extractedText && extractedText.trim().length > 0) {
                // Create a mock data object compatible with pdf-parse format
                data = {
                  text: extractedText,
                  numpages: 1,
                  info: {},
                  metadata: null
                };
                parseAttempts.push('pdf-poppler: SUCCESS');
              } else {
                throw new Error('pdf-poppler: Empty text extracted');
              }
            } else {
              throw new Error('pdf-poppler: No text file generated');
            }
          } catch (popplerError) {
            parseAttempts.push(`pdf-poppler: FAILED - ${popplerError.message}`);
            console.warn('Method 3 (pdf-poppler) failed:', popplerError.message);
            
            // Method 4: Try pdftotext command if available (system command)
            try {
              console.log('Attempting PDF parse with pdftotext command (method 4)...');
              const path = require('path');
              const tempPdfPath = filePath + '.temp.pdf';
              const tempTxtPath = filePath + '.temp.txt';
              
              await fs.writeFile(tempPdfPath, dataBuffer);
              
              // Try to use pdftotext command (requires poppler-utils)
              // Escape paths properly for Windows
              const escapedPdfPath = tempPdfPath.replace(/\\/g, '/');
              const escapedTxtPath = tempTxtPath.replace(/\\/g, '/');
              
              await execAsync(`pdftotext "${escapedPdfPath}" "${escapedTxtPath}"`);
              
              const extractedText = await fs.readFile(tempTxtPath, 'utf8');
              
              // Clean up temp files
              await fs.unlink(tempPdfPath).catch(() => {});
              await fs.unlink(tempTxtPath).catch(() => {});
              
              if (extractedText && extractedText.trim().length > 0) {
                data = {
                  text: extractedText,
                  numpages: 1,
                  info: {},
                  metadata: null
                };
                parseAttempts.push('pdftotext command: SUCCESS');
              } else {
                throw new Error('pdftotext: Empty output');
              }
            } catch (pdftotextError) {
              parseAttempts.push(`pdftotext command: FAILED - ${pdftotextError.message}`);
              console.warn('Method 4 (pdftotext) failed:', pdftotextError.message);
              
              // All methods failed - provide helpful error
              const isXRefError = parseError1.message && (
                parseError1.message.includes('XRef') || 
                parseError1.message.includes('xref') ||
                parseError1.message.includes('bad XRef')
              );
              
              if (isXRefError) {
                const errorMessage = 'PDF file is corrupted (bad XRef entry).\n\n' +
                  'Possible causes:\n' +
                  '• PDF file was corrupted during upload\n' +
                  '• PDF uses unsupported format or encryption\n' +
                  '• PDF was created with incompatible software\n' +
                  '• PDF is password-protected or secured\n\n' +
                  'Solutions to try:\n' +
                  '1. Re-upload the PDF file\n' +
                  '2. Open PDF in Adobe Reader/PDF viewer and save it again\n' +
                  '3. Export/print the PDF to a new PDF file\n' +
                  '4. Use a PDF from a different source\n' +
                  '5. Convert PDF to text manually and enter data\n\n' +
                  `Parse attempts: ${parseAttempts.join('; ')}`;
                
                throw new Error(errorMessage);
              } else {
                throw new Error(`PDF parsing failed after trying multiple methods.\n\n` +
                  `Error: ${parseError1.message}\n` +
                  `Parse attempts: ${parseAttempts.join('; ')}`);
              }
            }
          }
        }
      }
      
      console.log('PDF parsing successful. Attempts:', parseAttempts);
      
      console.log('PDF text extracted successfully, pages:', data.numpages);
      
      if (!data.text || data.text.trim().length === 0) {
        console.warn('⚠️ WARNING: PDF extracted but text is empty');
        throw new Error('PDF file contains no extractable text. The PDF might be image-based or corrupted.');
      }
      
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      console.error('File path:', filePath);
      
      // Provide more helpful error messages
      if (error.message.includes('XRef')) {
        throw new Error('PDF file is corrupted (bad XRef entry). Please re-upload the PDF file or use a different PDF.');
      } else if (error.message.includes('not found')) {
        throw new Error(`PDF file not found: ${filePath}`);
      } else if (error.message.includes('empty')) {
        throw new Error('PDF file is empty or invalid.');
      } else {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    }
  }

  /**
   * Parse credit card statement from extracted text
   * @param {string} text - Extracted text from PDF
   * @param {Object} metadata - Statement metadata
   * @returns {Object} - Parsed statement data
   */
  static parseStatement(text, metadata = {}) {
    // Split by newlines and clean up
    let lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Try to merge lines that might be split (e.g., table format where date/description/amount are on same line but PDF extraction splits them)
    // Look for lines that start with a date but don't have an amount, and merge with next line if it has an amount
    const mergedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      const nextNextLine = lines[i + 2];
      
      // Pattern 1: Date - Description - $Amount (dash format, e.g., "11/05/2025 - AMAZON.COM - $125.50")
      if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*-\s*.+?\s*-\s*\$/)) {
        mergedLines.push(line);
      }
      // Pattern 2: If current line has a date but no $ sign or number amount, and next line has a $ sign or number, merge them
      else if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/) && 
          !line.match(/[\d,]+\.?\d{2}$/) && 
          nextLine && (nextLine.match(/\$[\d,]+\.?\d{2}/) || nextLine.match(/^[\d,]+\.?\d{2}$/))) {
        mergedLines.push(line + ' ' + nextLine);
        i++; // Skip next line since we merged it
      }
      // Pattern 3: If current line has a date, next line is description (no date, no $, no ending number), and nextNextLine has $ or number, merge all three
      else if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/) && 
               nextLine && !nextLine.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) && !nextLine.match(/[\d,]+\.?\d{2}$/) &&
               nextNextLine && (nextNextLine.match(/\$[\d,]+\.?\d{2}/) || nextNextLine.match(/^[\d,]+\.?\d{2}$/))) {
        mergedLines.push(line + ' ' + nextLine + ' ' + nextNextLine);
        i += 2; // Skip next two lines
      }
      // Pattern 4: If line already has date and $ or ending number, keep it as is
      else if (line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) && (line.match(/\$[\d,]+\.?\d{2}/) || line.match(/[\d,]+\.?\d{2}$/))) {
        mergedLines.push(line);
      }
      // Pattern 5: If line has date and description but no amount, try to merge with next line that has amount
      else if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/) && line.length > 10 && 
               nextLine && (nextLine.match(/^\$?[\d,]+\.?\d{2}$/) || nextLine.match(/\$[\d,]+\.?\d{2}/))) {
        mergedLines.push(line + ' ' + nextLine);
        i++;
      }
      // Pattern 6: Otherwise, keep the line
      else {
        mergedLines.push(line);
      }
    }
    
    lines = mergedLines;
    console.log(`After merging: ${lines.length} lines`);
    console.log('Sample merged lines:', lines.slice(0, 15));
    console.log('Lines with dates:', lines.filter(l => l.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)).slice(0, 15));
    
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
      // Pattern 1: Date - Description - $Amount (dash format, e.g., "11/05/2025 - AMAZON.COM PURCHASE - $125.50")
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s*-\s*(.+?)\s*-\s*\$([\d,]+\.?\d{2})$/,
      // Pattern 2: Date Description $Amount (table format - most common, e.g., "11/05/2025 AMAZON.COM PURCHASE $125.50")
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+\$([\d,]+\.?\d{2})$/,
      // Pattern 3: Date: Description - $Amount (colon format)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4}):\s*(.+?)\s*-\s*\$([\d,]+\.?\d{2})$/,
      // Pattern 4: Date: Description $Amount (colon without dash)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4}):\s*(.+?)\s+\$([\d,]+\.?\d{2})$/,
      // Pattern 5: Date Description Amount (with optional $)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+\$?([\d,]+\.?\d*)$/,
      // Pattern 6: Date Description Amount Balance
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)$/,
      // Pattern 7: Description Date Amount
      /^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+\$?([\d,]+\.?\d*)$/,
      // Pattern 8: Date Description Amount (non-anchored, more flexible)
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+\$([\d,]+\.?\d{2})/,
      // Pattern 9: Date Description Amount (without $ sign)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d,]+\.?\d{2})$/,
      // Pattern 10: Date Description Amount (more flexible spacing)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d,]+\.?\d{2,4})$/,
      // Pattern 11: Date Description Amount (with spaces in amount)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+\$?\s*([\d,]+\.?\d*)$/,
      // Pattern 12: Date Description Amount (description can have numbers)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d]{1,3}(?:,\d{3})*\.\d{2})$/,
      // Pattern 13: Date Description Amount (very flexible - last resort)
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d,]+\.?\d{2,4})/
    ];

    console.log(`Extracting transactions from ${lines.length} lines`);
    console.log('Sample lines (first 30):', lines.slice(0, 30));
    console.log('All lines with dates:', lines.filter(l => l.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)).slice(0, 20));
    let matchedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip lines that are clearly not transactions (headers, footers, etc.)
      if (line.match(/^(Date|Description|Amount|Balance|Statement|Period|Account|Cardholder|Credit Limit|Available|Outstanding|Minimum|Payment|Due|Total|Sample Bank|This is|Generated|Transaction Details|Previous|Payments|Credits|New Purchases|Cash Advances|Fees|Interest|New Balance)/i)) {
        continue;
      }
      
      // Skip lines that are too short or don't contain a date
      if (line.length < 8 || !line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
        continue;
      }
      
      // Skip lines that are just numbers or amounts without dates
      if (line.match(/^\$?[\d,]+\.?\d*$/)) {
        continue;
      }
      
      // Skip lines that are just dates without other content
      if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/)) {
        continue;
      }
      
      let matched = false;
      for (let p = 0; p < transactionPatterns.length; p++) {
        const pattern = transactionPatterns[p];
        const match = line.match(pattern);
        if (match) {
          const transaction = this.parseTransactionLine(match, pattern, p);
          if (transaction) {
            transactions.push(transaction);
            matchedCount++;
            matched = true;
            if (matchedCount <= 3) {
              console.log(`Matched line ${i} with pattern ${p + 1}:`, line.substring(0, 80));
            }
            break;
          }
        }
      }
      
      if (!matched && line.length > 10 && line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
        skippedCount++;
        if (skippedCount <= 5) {
          console.log(`Skipped potential transaction line ${i}:`, line.substring(0, 80));
        }
      }
    }

    console.log(`Extracted ${transactions.length} transactions (matched: ${matchedCount}, skipped: ${skippedCount})`);
    return transactions;
  }

  /**
   * Parse individual transaction line
   * @param {Array} match - Regex match result
   * @param {RegExp} pattern - Pattern used for matching
   * @returns {Object|null} - Parsed transaction or null
   */
  static parseTransactionLine(match, pattern, patternIndex) {
    try {
      let date, description, amount, balance;

      // Handle based on pattern index for more reliable matching (0-indexed)
      if (patternIndex === 0) {
        // Pattern 1: Date - Description - $Amount (dash format)
        [, date, description, amount] = match;
      } else if (patternIndex === 1) {
        // Pattern 2: Date Description $Amount (table format - most common)
        [, date, description, amount] = match;
      } else if (patternIndex === 2) {
        // Pattern 3: Date: Description - $Amount
        [, date, description, amount] = match;
      } else if (patternIndex === 3) {
        // Pattern 4: Date: Description $Amount (without dash)
        [, date, description, amount] = match;
      } else if (patternIndex === 4) {
        // Pattern 5: Date Description Amount with optional $
        [, date, description, amount] = match;
      } else if (patternIndex === 5) {
        // Pattern 6: Date Description Amount Balance
        [, date, description, amount, balance] = match;
      } else if (patternIndex === 6) {
        // Pattern 7: Description Date Amount
        [, description, date, amount] = match;
      } else if (patternIndex === 7) {
        // Pattern 8: Date Description Amount with $ (non-anchored)
        [, date, description, amount] = match;
      } else if (patternIndex === 8) {
        // Pattern 9: Date Description Amount without $
        [, date, description, amount] = match;
      } else if (patternIndex === 9) {
        // Pattern 10: Date Description Amount (more flexible spacing)
        [, date, description, amount] = match;
      } else if (patternIndex === 10) {
        // Pattern 11: Date Description Amount (with spaces in amount)
        [, date, description, amount] = match;
      } else if (patternIndex === 11) {
        // Pattern 12: Date Description Amount (description can have numbers)
        [, date, description, amount] = match;
      } else if (patternIndex === 12) {
        // Pattern 13: Date Description Amount (very flexible - last resort)
        [, date, description, amount] = match;
      } else {
        // Default: assume first group is date, second is description, third is amount
        [, date, description, amount] = match;
      }

      if (!date || !description || !amount) {
        console.warn('Missing fields in transaction match:', { date, description, amount, match });
        return null;
      }

      // Clean and parse amount - remove $, commas, and spaces
      const cleanAmount = amount.replace(/[$\s,]/g, '');
      const parsedAmount = parseFloat(cleanAmount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.warn('Invalid amount:', amount, '->', parsedAmount, 'cleanAmount:', cleanAmount);
        return null;
      }
      
      // Validate description is not empty and not just whitespace
      const trimmedDescription = description.trim();
      if (!trimmedDescription || trimmedDescription.length < 2) {
        console.warn('Description too short:', trimmedDescription);
        return null;
      }

      // Parse date
      const parsedDate = this.parseDate(date);
      if (!parsedDate) {
        console.warn('Invalid date:', date);
        return null;
      }

      const transaction = {
        date: parsedDate,
        description: description.trim(),
        amount: parsedAmount,
        balance: balance ? parseFloat(balance.replace(/[$,]/g, '')) : null,
        category: 'unclassified', // Will be classified later
        verified: false,
        verifiedBy: null,
        verifiedAt: null
      };

      return transaction;
    } catch (error) {
      console.error('Error parsing transaction line:', error);
      console.error('Match:', match);
      console.error('Pattern:', pattern);
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
        /Credit Limit:\s*\$?([\d,]+\.?\d*)/i,
        /Credit Limit\s*\$?([\d,]+\.?\d*)/i
      ],
      availableLimit: [
        /available credit[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /available balance[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /credit available[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /Available Credit:\s*\$?([\d,]+\.?\d*)/i,
        /Available Credit\s*\$?([\d,]+\.?\d*)/i
      ],
      outstandingAmount: [
        /outstanding balance[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /current balance[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /Outstanding Balance:\s*\$?([\d,]+\.?\d*)/i,
        /Outstanding Balance\s*\$?([\d,]+\.?\d*)/i,
        /balance[:\s]+[\$]?([\d,]+\.?\d*)/i
      ],
      minimumPayment: [
        /minimum payment[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /min payment[:\s]+[\$]?([\d,]+\.?\d*)/i,
        /Minimum Payment Due:\s*\$?([\d,]+\.?\d*)/i,
        /Minimum Payment Due\s*\$?([\d,]+\.?\d*)/i
      ],
      dueDate: [
        /due date[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /payment due[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /Payment Due Date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /Payment Due Date\s*(\w+\s+\d{1,2},\s+\d{4})/i
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
      console.log('First 500 chars of text:', text.substring(0, 500));
      
      // Parse statement data
      const parsedData = this.parseStatement(text, metadata);
      console.log('Statement parsed, transactions found:', parsedData.transactions.length);
      console.log('Sample transactions:', parsedData.transactions.slice(0, 3));
      
      if (parsedData.transactions.length === 0) {
        console.warn('⚠️ WARNING: No transactions extracted!');
        console.log('Text lines count:', text.split('\n').length);
        console.log('Sample text lines:', text.split('\n').slice(0, 50));
      }
      
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
