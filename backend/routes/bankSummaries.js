const express = require('express');
const { query, param } = require('express-validator');
const BankSummaryService = require('../services/bankSummaryService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   GET /api/bank-summaries/overall/summary
// @desc    Get overall summary across all banks
// NOTE: This route must come BEFORE /:bankId to avoid route conflicts
router.get('/overall/summary', [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = {};
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const result = await BankSummaryService.getOverallSummary(filters);
    res.json(result);
  } catch (error) {
    console.error('Get overall summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get overall summary' 
    });
  }
});

// @route   GET /api/bank-summaries/:bankId
// @desc    Get summary for a specific bank
// NOTE: This route must come AFTER /overall/summary to avoid route conflicts
router.get('/:bankId', [
  param('bankId').isMongoId(),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const { bankId } = req.params;
    const { startDate, endDate } = req.query;
    
    const filters = {};
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const result = await BankSummaryService.getBankSummary(bankId, filters);
    res.json(result);
  } catch (error) {
    console.error('Get bank summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get bank summary' 
    });
  }
});

// @route   GET /api/bank-summaries/cardholder/:cardholderId
// @desc    Get summaries for all banks of a specific cardholder
router.get('/cardholder/:cardholderId', [
  param('cardholderId').isMongoId(),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const { cardholderId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Build filters (only date filters, not cardholder - that's handled by bank selection)
    const filters = {};
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    // Get cardholder details
    const Cardholder = require('../models/Cardholder');
    const cardholder = await Cardholder.findById(cardholderId);
    if (!cardholder) {
      return res.status(404).json({
        success: false,
        message: 'Cardholder not found'
      });
    }

    // Get all banks for this cardholder
    const Bank = require('../models/Bank');
    const banks = await Bank.find({ 
      cardholder: cardholderId, 
      isDeleted: false 
    }).populate('cardholder', 'name email');

    if (banks.length === 0) {
      return res.json({
        success: true,
        data: {
          cardholder: {
            _id: cardholder._id,
            name: cardholder.name,
            email: cardholder.email
          },
          bankSummaries: [],
          totalBanks: 0,
          overallSummary: {
            totalCardLimit: 0,
            totalAvailableLimit: 0,
            totalOutstandingAmount: 0,
            totalTransactions: 0,
            totalAmount: 0
          }
        }
      });
    }

    const bankSummaries = [];
    let totalCardLimit = 0;
    let totalAvailableLimit = 0;
    let totalOutstandingAmount = 0;
    let totalTransactions = 0;
    let totalAmount = 0;
    
    for (const bank of banks) {
      try {
        const summary = await BankSummaryService.getBankSummary(bank._id, filters);
        if (summary.success && summary.data) {
          bankSummaries.push(summary.data);
          
          // Aggregate totals for overall summary
          const bankSummary = summary.data.summary || {};
          totalCardLimit += bankSummary.cardLimit || bank.cardLimit || 0;
          totalAvailableLimit += bankSummary.availableLimit || bank.availableLimit || 0;
          totalOutstandingAmount += bankSummary.outstandingAmount || bank.outstandingAmount || 0;
          totalTransactions += summary.data.transactions || 0;
          totalAmount += bankSummary.financials?.totalSpent || 0;
        }
      } catch (error) {
        console.error(`Error getting summary for bank ${bank._id}:`, error);
        // Still add bank's basic info even if summary fails
        totalOutstandingAmount += bank.outstandingAmount || 0;
        totalCardLimit += bank.cardLimit || 0;
        totalAvailableLimit += bank.availableLimit || 0;
      }
    }

    // Calculate overall summary for cardholder
    const overallSummary = {
      totalCardLimit,
      totalAvailableLimit,
      totalOutstandingAmount,
      totalTransactions,
      totalAmount,
      averageCardLimit: banks.length > 0 ? totalCardLimit / banks.length : 0,
      averageOutstandingAmount: banks.length > 0 ? totalOutstandingAmount / banks.length : 0,
      creditUtilization: totalCardLimit > 0 ? (totalOutstandingAmount / totalCardLimit) * 100 : 0
    };

    res.json({
      success: true,
      data: {
        cardholder: {
          _id: cardholder._id,
          name: cardholder.name,
          email: cardholder.email,
          phone: cardholder.phone
        },
        bankSummaries,
        totalBanks: bankSummaries.length,
        overallSummary
      }
    });
  } catch (error) {
    console.error('Get cardholder bank summaries error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get cardholder bank summaries',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
