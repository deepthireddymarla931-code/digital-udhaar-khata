const { pool } = require('../config/db');

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM merchants WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM merchants WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getDefault() {
  const [rows] = await pool.query('SELECT * FROM merchants LIMIT 1');
  return rows[0] || {
    id: 1,
    name: 'Rajesh Sharma',
    shop_name: 'Sharma General Store',
    email: 'merchant@example.com',
    phone: '9876543210',
  };
}

async function create({ name, shopName, email, phone, password = 'password123', role = 'ROLE_MERCHANT' }) {
  const [result] = await pool.query(
    'INSERT INTO merchants (name, shop_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
    [name, shopName, email, phone, password, role]
  );
  return getById(result.insertId);
}

module.exports = {
  getById,
  getByEmail,
  getDefault,
  create,
};
