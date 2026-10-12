const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
const DB_NAME = process.env.DB_NAME || 'udhaar_db';

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

/**
 * Automatically applies necessary migrations to ensure required tables
 * and columns (like due_date, reminder_status) exist without manual user effort.
 */
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log(`🐬 Connected to MySQL Database: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}`);

    // Ensure transactions table has due_date and reminder columns
    const [cols] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'transactions'`,
      [DB_NAME]
    );
    const existingCols = cols.map((c) => c.COLUMN_NAME.toLowerCase());

    if (!existingCols.includes('due_date')) {
      console.log('⚡ Adding due_date column to transactions table...');
      await connection.query('ALTER TABLE transactions ADD COLUMN due_date DATETIME NULL');
    }

    if (!existingCols.includes('reminder_status')) {
      console.log('⚡ Adding reminder_status column to transactions table...');
      await connection.query("ALTER TABLE transactions ADD COLUMN reminder_status VARCHAR(30) DEFAULT 'NONE'");
    }

    if (!existingCols.includes('reminder_sent_at')) {
      console.log('⚡ Adding reminder_sent_at column to transactions table...');
      await connection.query('ALTER TABLE transactions ADD COLUMN reminder_sent_at DATETIME NULL');
    }

    if (!existingCols.includes('reminder_channel')) {
      console.log('⚡ Adding reminder_channel column to transactions table...');
      await connection.query("ALTER TABLE transactions ADD COLUMN reminder_channel VARCHAR(30) DEFAULT 'SMS'");
    }

    if (!existingCols.includes('reminder_note')) {
      console.log('⚡ Adding reminder_note column to transactions table...');
      await connection.query('ALTER TABLE transactions ADD COLUMN reminder_note TEXT NULL');
    }

    // Ensure reminder_logs table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reminder_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        transaction_id BIGINT,
        customer_id BIGINT,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        due_date DATETIME,
        channel VARCHAR(50) DEFAULT 'SMS',
        status VARCHAR(50) DEFAULT 'SENT',
        response_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_customer (customer_id),
        INDEX idx_due (due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    connection.release();
    console.log('✅ Database schema verified and automated migrations applied successfully.');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
}

module.exports = {
  pool,
  initializeDatabase,
};
