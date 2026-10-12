const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Instant mobile number lookup and quick Khata creation
router.get('/lookup', customerController.instantLookupByPhone);
router.post('/quick-lookup-or-create', customerController.quickLookupOrCreate);

// Standard Customer CRUD
router.get('/', customerController.listCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
