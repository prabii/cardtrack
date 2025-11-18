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
    
    console.log(`Initial lines count: ${lines.length}`);
    console.log('Sample initial lines:', lines.slice(0, 20));
    
    // Try to merge lines that might be split (e.g., table format where date/description/amount are on same line but PDF extraction splits them)
    // Look for lines that start with a date but don't have an amount, and merge with next line if it has an amount
    const mergedLines = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      const nextNextLine = lines[i + 2];
      
      // Check if line starts with a date
      const hasDate = line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/);
      const hasAmount = line.match(/\$[\d,]+\.?\d{2}/) || line.match(/[\d,]+\.?\d{2}$/);
      
      // Pattern 1: Complete transaction on one line (Date Description $Amount)
      if (hasDate && hasAmount && line.length > 15) {
        mergedLines.push(line);
        i++;
        continue;
      }
      
      // Pattern 2: Date - Description - $Amount (dash format, e.g., "11/05/2025 - AMAZON.COM - $125.50")
      if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*-\s*.+?\s*-\s*\$/)) {
        mergedLines.push(line);
        i++;
        continue;
      }
      
      // Pattern 3: Date on one line, amount on next line
      if (hasDate && !hasAmount && nextLine && (nextLine.match(/^\$?[\d,]+\.?\d{2}$/) || nextLine.match(/\$[\d,]+\.?\d{2}/))) {
        // Check if there's a description between date and amount
        if (line.length > 10) {
          mergedLines.push(line + ' ' + nextLine);
          i += 2;
        } else {
          // Date only, check if next line is description
          if (nextLine && !nextLine.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/) && nextNextLine && nextNextLine.match(/\$?[\d,]+\.?\d{2}/)) {
            mergedLines.push(line + ' ' + nextLine + ' ' + nextNextLine);
            i += 3;
          } else {
            mergedLines.push(line);
            i++;
          }
        }
        continue;
      }
      
      // Pattern 4: Date on one line, description on next, amount on third
      if (hasDate && !hasAmount && nextLine && !nextLine.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/) && 
          !nextLine.match(/[\d,]+\.?\d{2}$/) && nextNextLine && 
          (nextNextLine.match(/^\$?[\d,]+\.?\d{2}$/) || nextNextLine.match(/\$[\d,]+\.?\d{2}/))) {
        mergedLines.push(line + ' ' + nextLine + ' ' + nextNextLine);
        i += 3;
        continue;
      }
      
      // Pattern 5: Date and partial description, amount on next line
      if (hasDate && line.length > 10 && !hasAmount && nextLine && 
          (nextLine.match(/^\$?[\d,]+\.?\d{2}$/) || nextLine.match(/\$[\d,]+\.?\d{2}/))) {
        mergedLines.push(line + ' ' + nextLine);
        i += 2;
        continue;
      }
      
      // Pattern 6: Date only, try to find description and amount in following lines
      if (hasDate && line.length <= 12 && !hasAmount) {
        let merged = line;
        let foundAmount = false;
        let j = i + 1;
        let mergeCount = 0;
        
        // Look ahead up to 3 lines for description and amount
        while (j < lines.length && mergeCount < 3 && !foundAmount) {
          const checkLine = lines[j];
          const hasNextDate = checkLine.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/);
          
          // Stop if we hit another date
          if (hasNextDate) {
            break;
          }
          
          merged += ' ' + checkLine;
          mergeCount++;
          
          // Check if this line has an amount
          if (checkLine.match(/\$?[\d,]+\.?\d{2}/)) {
            foundAmount = true;
            mergedLines.push(merged);
            i = j + 1;
            break;
          }
          
          j++;
        }
        
        if (!foundAmount) {
          // Couldn't find amount, keep original line
          mergedLines.push(line);
          i++;
        }
        continue;
      }
      
      // Pattern 7: Keep line as is
      mergedLines.push(line);
      i++;
    }
    
    lines = mergedLines;
    console.log(`After merging: ${lines.length} lines`);
    console.log('Sample merged lines:', lines.slice(0, 20));
    console.log('Lines with dates:', lines.filter(l => l.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)).slice(0, 20));
    
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
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d,]+\.?\d{2,4})/,
      // Pattern 14: Date Description Rs.Amount (Indian format with Rs.)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+Rs\.([\d,]+\.?\d{2})$/i,
      // Pattern 15: Date Description AmountRs (amount at end with Rs suffix)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d,]+\.?\d{2})Rs$/i,
      // Pattern 16: Date Description AmountCr (credit indicator)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d,]+\.?\d{2})Cr$/i,
      // Pattern 17: Date Description AmountCr (no clear separator, amount at end with Cr) - e.g., "22/10/2025MK015295BAAL504S30001,178.82Cr"
      // Match amount at the very end, possibly with Cr/Rs suffix
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})(.+?)([\d]{1,3}(?:,\d{3})*\.\d{2})(?:Cr|Rs)?$/i,
      // Pattern 18: Date Description Amount (with description containing numbers/letters mixed, amount at end)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})([A-Za-z0-9\s\*\-\.]+?)([\d]{1,3}(?:,\d{3})*\.\d{2})$/,
      // Pattern 19: Date Description Amount (amount with comma thousands separator at end)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})(.+?)([\d]{1,3}(?:,\d{3})+\.\d{2})$/,
      // Pattern 20: Date Description Amount (flexible - amount at end, no comma thousands)
      /^(\d{1,2}\/\d{1,2}\/\d{2,4})(.+?)([\d]+\.\d{2})$/
    ];

    console.log(`Extracting transactions from ${lines.length} lines`);
    console.log('Sample lines (first 30):', lines.slice(0, 30));
    console.log('All lines with dates:', lines.filter(l => l.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)).slice(0, 20));
    let matchedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip lines that are clearly not transactions (headers, footers, etc.)
      if (line.match(/^(Date|Description|Amount|Balance|Statement|Period|Account|Cardholder|Credit Limit|Available|Outstanding|Minimum|Payment|Due|Total|Sample Bank|This is|Generated|Transaction Details|Previous|Payments|Credits|New Purchases|Cash Advances|Fees|Interest|New Balance|Card Information|Account Summary)/i)) {
        skippedCount++;
        continue;
      }
      
      // Skip lines that are too short or don't contain a date
      if (line.length < 8 || !line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
        continue;
      }
      
      // Skip lines that are just numbers or amounts without dates
      if (line.match(/^(Rs\.?|[\$])?[\d,]+\.?\d*$/i)) {
        continue;
      }
      
      // Skip lines that are just dates without other content (but allow if it's part of a merged line)
      if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/) && line.length < 15) {
        continue;
      }
      
      // Skip summary lines that might have dates but are not transactions
      if (line.match(/Total|Summary|Balance|Limit|Payment Due|Outstanding|StatementDate|CustomerRelationship|PrimaryCard|MinimumAmount|TotalAmount|Remembertopay|GSTIN|CreditLimit|AvailableCredit|CashLimit/i) && 
          !line.match(/AMAZON|STARBUCKS|WALMART|NETFLIX|RESTAURANT|GAS|SHOPPING|PURCHASE|PAYMENT|FEE|WITHDRAWAL|Grab|RAZ|NAME-CHEAP|MRDIY|NICHILEMA/i)) {
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
        if (skippedCount <= 10) {
          console.log(`⚠️ Skipped potential transaction line ${i}:`, line.substring(0, 100));
          console.log(`   Reason: No pattern matched. Line length: ${line.length}, Has date: ${!!line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)}, Has amount: ${!!line.match(/\$?[\d,]+\.?\d{2}/)}`);
        }
      }
    }

    console.log(`✅ Extracted ${transactions.length} transactions (matched: ${matchedCount}, skipped: ${skippedCount})`);
    
    if (transactions.length === 0 && skippedCount > 0) {
      console.warn('⚠️ WARNING: No transactions extracted but found lines with dates!');
      console.warn('This might indicate:');
      console.warn('1. Transaction format doesn\'t match expected patterns');
      console.warn('2. PDF text extraction split transactions incorrectly');
      console.warn('3. Date format is different than expected (MM/DD/YYYY)');
      console.warn('4. Amount format is different than expected ($XXX.XX)');
    }
    
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
      } else if (patternIndex === 13) {
        // Pattern 14: Date Description Rs.Amount (Indian format)
        [, date, description, amount] = match;
      } else if (patternIndex === 14) {
        // Pattern 15: Date Description AmountRs
        [, date, description, amount] = match;
      } else if (patternIndex === 15) {
        // Pattern 16: Date Description AmountCr
        [, date, description, amount] = match;
      } else if (patternIndex === 16) {
        // Pattern 17: Date Description AmountCr (no separator)
        // For this pattern, we need to be careful - the description might include numbers
        // Try to extract description more carefully by looking for the amount pattern at the end
        [, date, description, amount] = match;
        // Clean up description - remove trailing numbers that might be part of amount
        description = description.replace(/\d+$/, '').trim();
      } else if (patternIndex === 17) {
        // Pattern 18: Date Description Amount (mixed alphanumeric description)
        [, date, description, amount] = match;
      } else if (patternIndex === 18) {
        // Pattern 19: Date Description Amount (comma thousands)
        [, date, description, amount] = match;
      } else if (patternIndex === 19) {
        // Pattern 20: Date Description Amount (flexible)
        [, date, description, amount] = match;
      } else {
        // Default: assume first group is date, second is description, third is amount
        [, date, description, amount] = match;
      }

      if (!date || !description || !amount) {
        console.warn('Missing fields in transaction match:', { date, description, amount, match });
        return null;
      }

      // Clean and parse amount - remove $, Rs., commas, spaces, and currency indicators
      // But preserve the decimal point!
      let cleanAmount = amount.replace(/[Rs\$,\s]/gi, '').replace(/Cr$/i, '').replace(/Rs$/i, '');
      // Only remove period if it's not followed by digits (i.e., not a decimal point)
      // Actually, we should keep all periods - they might be decimal points
      // Just remove currency symbols and commas
      cleanAmount = cleanAmount.replace(/,/g, ''); // Remove thousand separators
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

      // Parse date - try multiple formats
      let parsedDate = this.parseDate(date);
      if (!parsedDate) {
        // Try alternative date parsing
        console.warn(`⚠️ Failed to parse date: "${date}". Trying alternative formats...`);
        // Try with different separators or formats
        const altDate = date.replace(/[-\s]/g, '/');
        parsedDate = this.parseDate(altDate);
        if (!parsedDate) {
          console.warn(`Invalid date after alternatives: ${date}`);
          return null;
        }
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
        // Try DD/MM/YYYY first (common in Indian statements)
        { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, isDDMM: true },
        { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, isDDMM: true },
        // Then try MM/DD/YYYY (US format)
        { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, isDDMM: false },
        { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, isDDMM: false },
        // ISO format
        { pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, isDDMM: false, isISO: true },
      ];

      for (const format of formats) {
        const match = dateStr.match(format.pattern);
        if (match) {
          let year, month, day;
          
          if (format.isISO) {
            [, year, month, day] = match;
          } else if (format.isDDMM) {
            // DD/MM/YYYY or DD/MM/YY format
            [, day, month, year] = match;
            if (year.length === 2) {
              year = '20' + year;
            }
          } else {
            // MM/DD/YYYY or MM/DD/YY format
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
   * Detect currency from text (Rs. = INR, $ = USD)
   * @param {string} text - Text to analyze
   * @returns {string} - Currency code (INR, USD, or default USD)
   */
  static detectCurrency(text) {
    if (!text) return 'USD';
    
    // Count occurrences of currency symbols
    const rsCount = (text.match(/Rs\./gi) || []).length;
    const dollarCount = (text.match(/\$/g) || []).length;
    
    // If Rs. appears more frequently, it's INR
    if (rsCount > dollarCount && rsCount > 0) {
      return 'INR';
    }
    
    // Default to USD
    return 'USD';
  }

  /**
   * Extract summary information from text lines
   * @param {Array} lines - Text lines from PDF
   * @param {Object} metadata - Statement metadata
   * @returns {Object} - Summary data
   */
  static extractSummary(lines, metadata) {
    // Detect currency from all lines combined
    const fullText = lines.join(' ');
    const currency = this.detectCurrency(fullText);
    
    const summary = {
      currency: currency,
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
        /credit limit[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /limit[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Credit Limit:\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Credit Limit\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /TotalCreditLimit[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /TotalCreditLimit[^:]*:([\d,]+\.?\d*)/i
      ],
      availableLimit: [
        /AvailableCreditLimit[:\s]*Rs\.([\d,]+\.?\d*)/i,  // Match Rs. amount after AvailableCreditLimit
        /available credit[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /available balance[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /credit available[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Available Credit:\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Available Credit\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i
      ],
      outstandingAmount: [
        /outstanding balance[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /current balance[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Outstanding Balance:\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Outstanding Balance\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /balance[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /TotalAmountDue[:\s\(]*TAD[\)]*[:\s]*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /TotalAmountDue[:\s\(]*[^)]*\)[:\s]*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Total.*Due[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /TotalOutstandingIncluding[:\s]*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i
      ],
      minimumPayment: [
        /minimum payment[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /min payment[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Minimum Payment Due:\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /Minimum Payment Due\s*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /MinimumAmountDue[:\s\(]*MAD[\)]*[:\s]*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /MinimumAmountDue[:\s\(]*[^)]*\)[:\s]*(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i,
        /MAD[:\s]+(?:Rs\.?|[\$])?([\d,]+\.?\d*)/i
      ],
      dueDate: [
        /due date[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /payment due[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /Payment Due Date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /Payment Due Date\s*(\w+\s+\d{1,2},\s+\d{4})/i,
        /Remembertopayby(\d{1,2}-\w+-\d{4})/i,
        /payby[:\s]+(\d{1,2}-\w+-\d{4})/i
      ]
    };

    // Search through all lines for summary information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      
      // Special handling for complex formats where amounts are on next line
      // Format: "TotalCreditLimitSelfSetCreditLimit:AvailableCreditLimit:" followed by "Rs.40,000.00Rs.40,000.00Rs.30,216.16"
      if (line.match(/TotalCreditLimit/i) && nextLine && !summary.cardLimit) {
        // Extract first Rs. amount from next line
        const cardLimitMatch = nextLine.match(/Rs\.([\d,]+\.?\d*)/i);
        if (cardLimitMatch) {
          const cleanValue = cardLimitMatch[1].replace(/,/g, '');
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue) && numValue > 0) {
            summary.cardLimit = numValue;
          }
        }
      }
      
      if (line.match(/AvailableCreditLimit/i) && nextLine && !summary.availableLimit) {
        // Extract all Rs. amounts from next line
        // Format: "Rs.40,000.00Rs.40,000.00Rs.30,216.16" - third one is available limit
        const allAmounts = nextLine.match(/Rs\.([\d,]+\.?\d*)/gi);
        if (allAmounts && allAmounts.length >= 3) {
          // Get the third match (available limit)
          const availableMatch = allAmounts[2];
          const amountMatch = availableMatch.match(/Rs\.([\d,]+\.?\d*)/i);
          if (amountMatch) {
            const cleanValue = amountMatch[1].replace(/,/g, '');
            const numValue = parseFloat(cleanValue);
            if (!isNaN(numValue) && numValue >= 0) {
              summary.availableLimit = numValue;
            }
          }
        } else if (allAmounts && allAmounts.length > 0) {
          // Fallback: get the last match if there aren't 3
          const lastMatch = allAmounts[allAmounts.length - 1];
          const amountMatch = lastMatch.match(/Rs\.([\d,]+\.?\d*)/i);
          if (amountMatch) {
            const cleanValue = amountMatch[1].replace(/,/g, '');
            const numValue = parseFloat(cleanValue);
            if (!isNaN(numValue) && numValue >= 0) {
              summary.availableLimit = numValue;
            }
          }
        }
      }
      
      for (const [key, patternList] of Object.entries(patterns)) {
        // Skip if we already found this value
        if (key === 'cardLimit' && summary.cardLimit > 0) continue;
        if (key === 'availableLimit' && summary.availableLimit > 0) continue;
        
        for (const pattern of patternList) {
          const match = line.match(pattern);
          if (match) {
            const value = match[1];
            
            if (key === 'dueDate') {
              // Handle date formats like "23-Nov-2025"
              let dateValue = value;
              if (value.match(/\d{1,2}-\w+-\d{4}/)) {
                // Convert "23-Nov-2025" to "23/11/2025"
                const monthMap = {
                  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                  'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                  'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                };
                const parts = value.split('-');
                if (parts.length === 3) {
                  const day = parts[0];
                  const monthName = parts[1].toLowerCase().substring(0, 3);
                  const year = parts[2];
                  const month = monthMap[monthName] || '01';
                  dateValue = `${day}/${month}/${year}`;
                }
              }
              summary[key] = this.parseDate(dateValue);
            } else {
              // Remove Rs., $, commas and spaces, but preserve decimal point
              let cleanValue = value.replace(/[Rs\$,\s]/gi, '').trim();
              // Remove trailing currency indicators
              cleanValue = cleanValue.replace(/(Rs|Cr)$/i, '');
              const numValue = parseFloat(cleanValue);
              if (!isNaN(numValue) && numValue >= 0) {
                summary[key] = numValue;
              }
            }
            break;
          }
        }
      }
    }

    // Calculate available limit if not found (only if we didn't extract it from PDF)
    if (summary.availableLimit === 0 && summary.cardLimit > 0 && summary.outstandingAmount > 0) {
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
      
      // Validate extracted text
      if (!text || text.trim().length === 0) {
        throw new Error('PDF text extraction returned empty text. The PDF might be image-based or corrupted.');
      }
      
      console.log(`Extracted ${text.length} characters from PDF`);
      console.log(`Text has ${text.split('\n').length} lines`);
      
      // Parse statement data
      const parsedData = this.parseStatement(text, metadata);
      console.log('Statement parsed, transactions found:', parsedData.transactions ? parsedData.transactions.length : 0);
      
      if (parsedData.transactions && parsedData.transactions.length > 0) {
        console.log('Sample transactions:', parsedData.transactions.slice(0, 3));
      } else {
        console.warn('⚠️ WARNING: No transactions extracted!');
        console.log('Text lines count:', text.split('\n').length);
        console.log('Sample text lines (first 50):', text.split('\n').slice(0, 50));
        console.log('Full text (first 2000 chars):', text.substring(0, 2000));
        
        // Try to find potential transaction patterns in the raw text
        const dateMatches = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g);
        const amountMatches = text.match(/\$[\d,]+\.?\d{2}/g) || text.match(/Rs\.?[\d,]+\.?\d{2}/gi) || text.match(/[\d,]+\.\d{2}/g);
        console.log(`Found ${dateMatches ? dateMatches.length : 0} date patterns and ${amountMatches ? amountMatches.length : 0} amount patterns in raw text`);
        
        if (dateMatches && dateMatches.length > 0) {
          console.log('Sample dates found:', dateMatches.slice(0, 10));
        }
        if (amountMatches && amountMatches.length > 0) {
          console.log('Sample amounts found:', amountMatches.slice(0, 10));
        }
        
        // Log lines that contain dates but weren't matched
        const linesWithDates = text.split('\n').filter(line => line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/));
        console.log(`Found ${linesWithDates.length} lines containing dates`);
        if (linesWithDates.length > 0) {
          console.log('Sample lines with dates (first 20):', linesWithDates.slice(0, 20));
        }
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

