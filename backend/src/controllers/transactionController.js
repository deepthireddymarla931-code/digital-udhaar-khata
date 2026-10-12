const transactionModel = require('../models/transactionModel');
const customerModel = require('../models/customerModel');
const socketService = require('../services/socketService');

async function createTransaction(req, res) {
  try {
    let {
      customerId,
      customerName,
      customerPhone,
      phone,
      amount,
      type,
      paymentMode,
      note,
      dueDate,
      reminderChannel,
      reminderNote,
    } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'A valid positive transaction amount is required' });
    }

    if (!type || !['GIVE', 'RECEIVE'].includes(type)) {
      return res.status(400).json({ message: 'Transaction type must be GIVE or RECEIVE' });
    }

    // Support instant number-based transaction if customerId is not yet created
    if (!customerId && (phone || customerPhone)) {
      const targetPhone = phone || customerPhone;
      let existingCust = await customerModel.getByPhone(targetPhone);
      if (!existingCust) {
        existingCust = await customerModel.create({
          name: customerName || `Customer (${targetPhone.slice(-4)})`,
          phone: targetPhone,
        });
      }
      customerId = existingCust.id;
      customerName = existingCust.name;
      customerPhone = existingCust.phone;
    }

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID or mobile number is required' });
    }

    const tx = await transactionModel.create({
      merchantId: 1,
      customerId: parseInt(customerId, 10),
      customerName,
      customerPhone: customerPhone || phone,
      amount: parseFloat(amount),
      type,
      paymentMode: paymentMode || 'CASH',
      note: note || '',
      dueDate: dueDate || null,
      reminderChannel: reminderChannel || 'SMS',
      reminderNote: reminderNote || '',
    });

    // Get fresh customer metrics
    const updatedCustomer = await customerModel.getById(customerId);
    const updatedSummary = await transactionModel.getDashboardSummary();

    // Broadcast instant multi-device ledger update via WebSockets
    socketService.emitEvent('transaction:created', {
      transaction: tx,
      customer: updatedCustomer,
    });

    socketService.emitEvent('ledger:updated', {
      summary: updatedSummary,
      customerId,
      customer: updatedCustomer,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(tx);
  } catch (err) {
    console.error('Error recording transaction:', err);
    res.status(500).json({ message: 'Error recording transaction', error: err.message });
  }
}

async function listTransactions(req, res) {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const transactions = await transactionModel.getAll(limit);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions', error: err.message });
  }
}

async function getTransactionsByCustomer(req, res) {
  try {
    const customerId = parseInt(req.params.id, 10);
    const transactions = await transactionModel.getByCustomer(customerId);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customer transactions', error: err.message });
  }
}

async function getDashboardSummary(req, res) {
  try {
    const summary = await transactionModel.getDashboardSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Error calculating dashboard summary', error: err.message });
  }
}

/**
 * Core Feature 3:
 * Dedicated breakdown for "You Will Give" (Udhaar/Debit) vs "You Will Get" (Advance/Credit)
 */
async function getMarketSplit(req, res) {
  try {
    const split = await transactionModel.getMarketSplit();
    res.json(split);
  } catch (err) {
    res.status(500).json({ message: 'Error calculating market split', error: err.message });
  }
}

module.exports = {
  createTransaction,
  listTransactions,
  getTransactionsByCustomer,
  getDashboardSummary,
  getMarketSplit,
};
