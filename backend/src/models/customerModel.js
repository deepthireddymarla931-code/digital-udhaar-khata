const { pool } = require('../config/db');

async function getMetrics(customerId) {
  const [givenRows] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) AS totalGiven FROM transactions WHERE customer_id = ? AND type = "GIVE"',
    [customerId]
  );
  const [receivedRows] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) AS totalReceived FROM transactions WHERE customer_id = ? AND type = "RECEIVE"',
    [customerId]
  );
  const totalGiven = parseFloat(givenRows[0].totalGiven || 0);
  const totalReceived = parseFloat(receivedRows[0].totalReceived || 0);
  const netBalance = totalGiven - totalReceived;

  let status = 'SETTLED';
  if (netBalance > 0) status = 'OWES';
  else if (netBalance < 0) status = 'ADVANCE';

  const [custRows] = await pool.query('SELECT credit_limit FROM customers WHERE id = ?', [customerId]);
  const limit = custRows.length > 0 ? parseFloat(custRows[0].credit_limit) : 10000;
  const ratio = limit > 0 ? netBalance / limit : 0;

  let riskLevel = 'LOW';
  if (ratio > 0.85) riskLevel = 'HIGH';
  else if (ratio > 0.50) riskLevel = 'MEDIUM';

  await pool.query('UPDATE customers SET risk_level = ? WHERE id = ?', [riskLevel, customerId]);

  return { totalGiven, totalReceived, netBalance, status, riskLevel, creditLimit: limit };
}

async function getAll(search = '') {
  const queryTerm = `%${(search || '').toLowerCase()}%`;
  const [rows] = await pool.query(
    'SELECT * FROM customers WHERE LOWER(name) LIKE ? OR phone LIKE ? ORDER BY id DESC',
    [queryTerm, queryTerm]
  );

  return Promise.all(
    rows.map(async (c) => {
      const metrics = await getMetrics(c.id);
      return {
        id: c.id,
        merchantId: c.merchant_id,
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        address: c.address || '',
        creditLimit: parseFloat(c.credit_limit || 10000),
        riskLevel: metrics.riskLevel,
        createdAt: c.created_at,
        ...metrics,
      };
    })
  );
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const c = rows[0];
  const metrics = await getMetrics(c.id);
  return {
    id: c.id,
    merchantId: c.merchant_id,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    address: c.address || '',
    creditLimit: parseFloat(c.credit_limit || 10000),
    riskLevel: metrics.riskLevel,
    createdAt: c.created_at,
    ...metrics,
  };
}

async function getByPhone(phone) {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  if (!clean) return null;
  const [rows] = await pool.query(
    'SELECT * FROM customers WHERE REPLACE(REPLACE(phone, " ", ""), "-", "") LIKE ? OR phone LIKE ? LIMIT 1',
    [`%${clean}%`, `%${clean}%`]
  );
  if (rows.length === 0) return null;
  return getById(rows[0].id);
}

async function create({ merchantId = 1, name, phone, email = '', address = '', creditLimit = 10000.0 }) {
  const [result] = await pool.query(
    'INSERT INTO customers (merchant_id, name, phone, email, address, credit_limit, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [merchantId, name, phone, email, address, parseFloat(creditLimit) || 10000.0, 'LOW']
  );
  return getById(result.insertId);
}

async function update(id, { name, phone, email, address, creditLimit }) {
  await pool.query(
    'UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email), address = COALESCE(?, address), credit_limit = COALESCE(?, credit_limit) WHERE id = ?',
    [name || null, phone || null, email || null, address || null, creditLimit ? parseFloat(creditLimit) : null, id]
  );
  return getById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM reminder_logs WHERE customer_id = ?', [id]);
  await pool.query('DELETE FROM transactions WHERE customer_id = ?', [id]);
  await pool.query('DELETE FROM customers WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getMetrics,
  getAll,
  getById,
  getByPhone,
  create,
  update,
  remove,
};
