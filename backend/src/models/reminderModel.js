const { pool } = require('../config/db');

async function logReminder({
  transactionId,
  customerId,
  customerName,
  customerPhone,
  amount,
  dueDate,
  channel = 'SMS',
  status = 'SENT',
  responseMessage = '',
}) {
  let parsedDueDate = null;
  if (dueDate) {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      parsedDueDate = d;
    }
  }

  const [result] = await pool.query(
    `INSERT INTO reminder_logs 
     (transaction_id, customer_id, customer_name, customer_phone, amount, due_date, channel, status, response_message) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId || null,
      customerId || null,
      customerName || 'Customer',
      customerPhone || '',
      parseFloat(amount) || 0,
      parsedDueDate,
      channel,
      status,
      responseMessage,
    ]
  );
  return result.insertId;
}

async function getRecentLogs(limit = 50) {
  const [rows] = await pool.query(
    `SELECT id, 
            transaction_id AS transactionId, 
            customer_id AS customerId, 
            customer_name AS customerName, 
            customer_phone AS customerPhone, 
            amount, 
            due_date AS dueDate, 
            channel, 
            status, 
            response_message AS responseMessage, 
            sent_at AS sentAt 
     FROM reminder_logs 
     ORDER BY id DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function getScheduledUpcoming(limit = 50) {
  const [rows] = await pool.query(
    `SELECT t.id, 
            t.merchant_id AS merchantId, 
            t.customer_id AS customerId, 
            COALESCE(c.name, t.customer_name) AS customerName, 
            COALESCE(c.phone, t.customer_phone) AS customerPhone, 
            t.amount, 
            t.type, 
            t.note, 
            t.due_date AS dueDate, 
            t.reminder_status AS reminderStatus, 
            t.reminder_channel AS reminderChannel, 
            t.reminder_note AS reminderNote, 
            t.transaction_date AS transactionDate 
     FROM transactions t 
     LEFT JOIN customers c ON t.customer_id = c.id
     WHERE t.due_date IS NOT NULL 
       AND t.type = 'GIVE'
     ORDER BY t.due_date DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = {
  logReminder,
  getRecentLogs,
  getScheduledUpcoming,
};
