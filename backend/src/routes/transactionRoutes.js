const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Market breakdown ("You Will Give" vs "You Will Get")
router.get('/market-split', transactionController.getMarketSplit);

// Overall dashboard analytics summary
router.get('/dashboard-summary', transactionController.getDashboardSummary);

// Transactions CRUD & lookup
router.get('/', transactionController.listTransactions);
router.post('/', transactionController.createTransaction);
router.get('/customer/:id', transactionController.getTransactionsByCustomer);

module.exports = router;
