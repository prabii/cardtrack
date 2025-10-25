const express = require('express');
const { query, param } = require('express-validator');
const BankSummaryService = require('../services/bankSummaryService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   GET /api/bank-summaries/:bankId
// @desc    Get summary for a specific bank
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

// @route   GET /api/bank-summaries/overall/summary
// @desc    Get overall summary across all banks
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
    
    const filters = { cardholder: cardholderId };
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    // Get all banks for this cardholder
    const Bank = require('../models/Bank');
    const banks = await Bank.find({ 
      cardholder: cardholderId, 
      isDeleted: false 
    }).populate('cardholder', 'name email');

    const bankSummaries = [];
    
    for (const bank of banks) {
      try {
        const summary = await BankSummaryService.getBankSummary(bank._id, filters);
        if (summary.success) {
          bankSummaries.push(summary.data);
        }
      } catch (error) {
        console.error(`Error getting summary for bank ${bank._id}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        cardholder: banks[0]?.cardholder || null,
        bankSummaries,
        totalBanks: bankSummaries.length
      }
    });
  } catch (error) {
    console.error('Get cardholder bank summaries error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get cardholder bank summaries' 
    });
  }
});

module.exports = router;
