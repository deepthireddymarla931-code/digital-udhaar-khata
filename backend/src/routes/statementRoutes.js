const express = require('express');
const router = express.Router();
const statementController = require('../controllers/statementController');

router.get(['/customer/:id', '/customer/:id/pdf'], statementController.downloadCustomerStatement);

module.exports = router;
