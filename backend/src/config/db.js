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

    // Ensure core tables exist automatically
    await connection.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        shop_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'ROLE_MERCHANT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        merchant_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        credit_limit DECIMAL(12, 2) DEFAULT 10000.00,
        risk_level VARCHAR(50) DEFAULT 'LOW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        merchant_id BIGINT NOT NULL,
        customer_id BIGINT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        amount DECIMAL(12, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'CASH',
        note TEXT,
        due_date DATETIME NULL,
        reminder_status VARCHAR(30) DEFAULT 'NONE',
        reminder_sent_at DATETIME NULL,
        reminder_channel VARCHAR(30) DEFAULT 'SMS',
        reminder_note TEXT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        merchant_id BIGINT,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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

    // Ensure default demo merchant and sample customers exist
    const [existingMerchants] = await connection.query('SELECT id FROM merchants LIMIT 1');
    if (existingMerchants.length === 0) {
      console.log('🌱 Seeding default demo merchant (Rajesh Sharma)...');
      await connection.query(`
        INSERT INTO merchants (id, name, shop_name, email, phone, password, role)
        VALUES (1, 'Rajesh Sharma', 'Sharma General Store', 'merchant@example.com', '9876543210', 'password123', 'ROLE_MERCHANT')
      `);

      console.log('🌱 Seeding sample customer credit accounts...');
      await connection.query(`
        INSERT INTO customers (id, merchant_id, name, phone, email, address, credit_limit, risk_level)
        VALUES 
          (1, 1, 'Ramesh Kumar', '9876543211', 'ramesh@example.com', 'Sector 4, Main Market', 15000.00, 'LOW'),
          (2, 1, 'Priya Singh', '9876543212', 'priya@example.com', 'Lane 2, Vikas Nagar', 10000.00, 'MEDIUM'),
          (3, 1, 'Amit Verma', '9876543213', 'amit@example.com', 'Shop 12, Gandhi Chowk', 8000.00, 'HIGH')
      `);

      console.log('🌱 Seeding sample ledger entries...');
      await connection.query(`
        INSERT INTO transactions (merchant_id, customer_id, customer_name, customer_phone, amount, type, payment_mode, note, due_date)
        VALUES
          (1, 1, 'Ramesh Kumar', '9876543211', 4500.00, 'GIVE', 'CASH', 'Grocery on credit', DATE_ADD(NOW(), INTERVAL 3 DAY)),
          (1, 2, 'Priya Singh', '9876543212', 3200.00, 'GIVE', 'CASH', 'Household items', DATE_ADD(NOW(), INTERVAL 5 DAY)),
          (1, 1, 'Ramesh Kumar', '9876543211', 1500.00, 'RECEIVE', 'ONLINE', 'Part payment via UPI', NULL),
          (1, 3, 'Amit Verma', '9876543213', 7500.00, 'GIVE', 'CASH', 'Bulk supply', DATE_SUB(NOW(), INTERVAL 1 DAY))
      `);
      console.log('✅ Demo seed data initialized successfully!');
    }

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
