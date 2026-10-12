const { pool } = require('../config/db');
const customerModel = require('./customerModel');

async function create({
  merchantId = 1,
  customerId,
  customerName,
  customerPhone,
  amount,
  type,
  paymentMode = 'CASH',
  note = '',
  dueDate = null,
  reminderChannel = 'SMS',
  reminderNote = '',
}) {
  let custName = customerName;
  let custPhone = customerPhone;

  if (customerId) {
    const cust = await customerModel.getById(customerId);
    if (cust) {
      custName = cust.name;
      custPhone = cust.phone;
    }
  }

  let parsedDueDate = null;
  if (dueDate) {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      parsedDueDate = d;
    }
  }

  const reminderStatus = (parsedDueDate && type === 'GIVE') ? 'PENDING' : 'NONE';

  const [result] = await pool.query(
    `INSERT INTO transactions 
     (merchant_id, customer_id, customer_name, customer_phone, amount, type, payment_mode, note, due_date, reminder_status, reminder_channel, reminder_note, transaction_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      merchantId,
      customerId,
      custName,
      custPhone,
      parseFloat(amount),
      type,
      paymentMode,
      note,
      parsedDueDate,
      reminderStatus,
      reminderChannel,
      reminderNote,
    ]
  );

  return getById(result.insertId);
}

async function getById(id) {
  const [rows] = await pool.query(
    `SELECT id, 
            merchant_id AS merchantId, 
            customer_id AS customerId, 
            customer_name AS customerName, 
            customer_phone AS customerPhone, 
            amount, 
            type, 
            payment_mode AS paymentMode, 
            note, 
            due_date AS dueDate, 
            reminder_status AS reminderStatus, 
            reminder_sent_at AS reminderSentAt, 
            reminder_channel AS reminderChannel, 
            reminder_note AS reminderNote, 
            transaction_date AS transactionDate 
     FROM transactions WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getAll(limit = 100) {
  const [rows] = await pool.query(
    `SELECT id, 
            merchant_id AS merchantId, 
            customer_id AS customerId, 
            customer_name AS customerName, 
            customer_phone AS customerPhone, 
            amount, 
            type, 
            payment_mode AS paymentMode, 
            note, 
            due_date AS dueDate, 
            reminder_status AS reminderStatus, 
            reminder_sent_at AS reminderSentAt, 
            reminder_channel AS reminderChannel, 
            reminder_note AS reminderNote, 
            transaction_date AS transactionDate 
     FROM transactions ORDER BY id DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function getByCustomer(customerId) {
  const [rows] = await pool.query(
    `SELECT id, 
            merchant_id AS merchantId, 
            customer_id AS customerId, 
            customer_name AS customerName, 
            customer_phone AS customerPhone, 
            amount, 
            type, 
            payment_mode AS paymentMode, 
            note, 
            due_date AS dueDate, 
            reminder_status AS reminderStatus, 
            reminder_sent_at AS reminderSentAt, 
            reminder_channel AS reminderChannel, 
            reminder_note AS reminderNote, 
            transaction_date AS transactionDate 
     FROM transactions WHERE customer_id = ? ORDER BY id DESC`,
    [customerId]
  );
  return rows;
}

async function getDuePending() {
  const [rows] = await pool.query(
    `SELECT t.id, 
            t.merchant_id AS merchantId, 
            t.customer_id AS customerId, 
            t.customer_name AS customerName, 
            t.customer_phone AS customerPhone, 
            t.amount, 
            t.type, 
            t.payment_mode AS paymentMode, 
            t.note, 
            t.due_date AS dueDate, 
            t.reminder_status AS reminderStatus, 
            t.reminder_channel AS reminderChannel, 
            t.reminder_note AS reminderNote, 
            t.transaction_date AS transactionDate,
            c.name as custLiveName,
            c.phone as custLivePhone
     FROM transactions t
     LEFT JOIN customers c ON t.customer_id = c.id
     WHERE t.type = 'GIVE'
       AND t.due_date IS NOT NULL 
       AND t.due_date <= NOW() 
       AND t.reminder_status = 'PENDING'
     ORDER BY t.due_date ASC`
  );
  return rows;
}

async function markReminderSent(id, status = 'SENT') {
  await pool.query(
    'UPDATE transactions SET reminder_status = ?, reminder_sent_at = NOW() WHERE id = ?',
    [status, id]
  );
  return getById(id);
}

async function getDashboardSummary() {
  const [custRows] = await pool.query('SELECT id FROM customers');
  let totalOutstanding = 0;
  let activeDebtorsCount = 0;

  for (let c of custRows) {
    const { netBalance } = await customerModel.getMetrics(c.id);
    if (netBalance > 0) {
      totalOutstanding += netBalance;
      activeDebtorsCount++;
    }
  }

  const [todayGivenRows] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) AS totalGivenToday FROM transactions WHERE type = "GIVE" AND DATE(transaction_date) = CURDATE()'
  );
  const [todayCollectedRows] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) AS totalCollectedToday FROM transactions WHERE type = "RECEIVE" AND DATE(transaction_date) = CURDATE()'
  );

  const [recentRows] = await pool.query(
    `SELECT id, 
            merchant_id AS merchantId, 
            customer_id AS customerId, 
            customer_name AS customerName, 
            customer_phone AS customerPhone, 
            amount, 
            type, 
            payment_mode AS paymentMode, 
            note, 
            due_date AS dueDate, 
            reminder_status AS reminderStatus, 
            transaction_date AS transactionDate 
     FROM transactions ORDER BY id DESC LIMIT 10`
  );

  // Pending and upcoming reminders count
  const [reminderRows] = await pool.query(
    `SELECT COUNT(*) AS pendingCount FROM transactions WHERE due_date IS NOT NULL AND reminder_status = 'PENDING'`
  );

  return {
    totalOutstandingCredit: totalOutstanding,
    totalCollectedToday: parseFloat(todayCollectedRows[0].totalCollectedToday) || 0,
    totalGivenToday: parseFloat(todayGivenRows[0].totalGivenToday) || 0,
    activeDebtorsCount,
    totalCustomersCount: custRows.length,
    pendingRemindersCount: reminderRows[0].pendingCount || 0,
    recentTransactions: recentRows,
  };
}

async function getMarketSplit() {
  const allCustomers = await customerModel.getAll();

  const youWillGetCustomers = [];
  const youWillGiveCustomers = [];
  let totalYouWillGet = 0;
  let totalYouWillGive = 0;

  for (const c of allCustomers) {
    if (c.netBalance > 0) {
      // You gave credit -> Customer owes you (You Will Get)
      totalYouWillGet += c.netBalance;
      youWillGetCustomers.push({
        ...c,
        amountOwed: c.netBalance,
      });
    } else if (c.netBalance < 0) {
      // Customer paid advance or you owe them (You Will Give)
      const absAmount = Math.abs(c.netBalance);
      totalYouWillGive += absAmount;
      youWillGiveCustomers.push({
        ...c,
        amountToGive: absAmount,
      });
    }
  }

  // Sort by highest amount first
  youWillGetCustomers.sort((a, b) => b.netBalance - a.netBalance);
  youWillGiveCustomers.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

  return {
    totalYouWillGet,
    totalYouWillGive,
    netMarketPosition: totalYouWillGet - totalYouWillGive,
    youWillGetCount: youWillGetCustomers.length,
    youWillGiveCount: youWillGiveCustomers.length,
    youWillGetCustomers,
    youWillGiveCustomers,
  };
}

module.exports = {
  create,
  getById,
  getAll,
  getByCustomer,
  getDuePending,
  markReminderSent,
  getDashboardSummary,
  getMarketSplit,
};
