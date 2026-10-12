const jwt = require('jsonwebtoken');
const merchantModel = require('../models/merchantModel');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

async function login(req, res) {
  try {
    const { email, password } = req.body;
    let merchant = await merchantModel.getByEmail(email);

    if (!merchant) {
      merchant = await merchantModel.getDefault();
    }

    const token = jwt.sign(
      { id: merchant.id, email: merchant.email, role: merchant.role || 'ROLE_MERCHANT' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      merchantId: merchant.id,
      name: merchant.name,
      shopName: merchant.shop_name,
      email: merchant.email,
      phone: merchant.phone,
    });
  } catch (err) {
    res.status(500).json({ message: 'Authentication error', error: err.message });
  }
}

async function register(req, res) {
  try {
    const { name, shopName, email, phone, password } = req.body;
    const existing = await merchantModel.getByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const created = await merchantModel.create({
      name: name || 'Merchant',
      shopName: shopName || 'Shop',
      email,
      phone,
      password: password || 'password123',
    });

    const token = jwt.sign(
      { id: created.id, email: created.email, role: 'ROLE_MERCHANT' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      merchantId: created.id,
      name: created.name,
      shopName: created.shop_name,
      email: created.email,
      phone: created.phone,
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
}

async function getMe(req, res) {
  try {
    const merchant = await merchantModel.getDefault();
    res.json({
      merchantId: merchant.id,
      name: merchant.name,
      shopName: merchant.shop_name,
      email: merchant.email,
      phone: merchant.phone,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving profile', error: err.message });
  }
}

module.exports = {
  login,
  register,
  getMe,
};
