const customerModel = require('../models/customerModel');
const transactionModel = require('../models/transactionModel');
const socketService = require('../services/socketService');

async function listCustomers(req, res) {
  try {
    const search = req.query.search || '';
    const customers = await customerModel.getAll(search);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customers', error: err.message });
  }
}

async function getCustomer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const customer = await customerModel.getById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customer', error: err.message });
  }
}

/**
 * Instant Phone Number Lookup:
 * When user enters a mobile number or contact, instantly check if their Khata exists.
 */
async function instantLookupByPhone(req, res) {
  try {
    const phone = req.query.phone || '';
    if (!phone || phone.trim().length < 3) {
      return res.status(400).json({ message: 'Valid phone search query required' });
    }

    const customer = await customerModel.getByPhone(phone.trim());
    if (!customer) {
      return res.json({
        exists: false,
        phone: phone.trim(),
        message: 'No existing Khata found for this number.',
      });
    }

    // Attach recent transactions for instantaneous ledger preview
    const recentTx = await transactionModel.getByCustomer(customer.id);

    return res.json({
      exists: true,
      customer,
      recentTransactions: recentTx.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: 'Error looking up customer by phone', error: err.message });
  }
}

/**
 * Instant Number-Based Khata Create or Retrieve:
 * Creates Khata account if it doesn't exist, or returns the existing one instantly.
 */
async function quickLookupOrCreate(req, res) {
  try {
    const { phone, name, creditLimit, address } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    let customer = await customerModel.getByPhone(phone);
    let isNew = false;

    if (!customer) {
      customer = await customerModel.create({
        name: name || `Customer (${phone.slice(-4)})`,
        phone,
        creditLimit: creditLimit || 10000,
        address: address || '',
      });
      isNew = true;

      // Real-time broadcast
      socketService.emitEvent('customer:created', { customer });
    }

    res.json({
      success: true,
      isNew,
      customer,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error processing quick Khata lookup/creation', error: err.message });
  }
}

async function createCustomer(req, res) {
  try {
    const { name, phone, email, address, creditLimit } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const customer = await customerModel.create({
      name,
      phone,
      email,
      address,
      creditLimit,
    });

    socketService.emitEvent('customer:created', { customer });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error creating customer', error: err.message });
  }
}

async function updateCustomer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await customerModel.update(id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    socketService.emitEvent('customer:updated', { customer: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating customer', error: err.message });
  }
}

async function deleteCustomer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await customerModel.remove(id);

    socketService.emitEvent('customer:deleted', { id });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting customer', error: err.message });
  }
}

module.exports = {
  listCustomers,
  getCustomer,
  instantLookupByPhone,
  quickLookupOrCreate,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
