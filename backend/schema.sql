-- ============================================================
-- DIGITAL UDHAAR KHATA - CLOUD MYSQL DATABASE DDL SCHEMA
-- Compatible with Cloud MySQL (Aiven, TiDB Cloud, Railway, PlanetScale, AWS RDS)
-- ============================================================

CREATE DATABASE IF NOT EXISTS udhaar_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE udhaar_db;

-- 1. MERCHANTS TABLE
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

-- 2. CUSTOMERS TABLE
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

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'GIVE' or 'RECEIVE'
    payment_mode VARCHAR(50) DEFAULT 'CASH', -- 'CASH', 'UPI', 'CHEQUE', 'BANK_TRANSFER'
    note TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_id BIGINT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SEED DEFAULT DEMO DATA (If tables are empty)
INSERT IGNORE INTO merchants (id, name, shop_name, email, phone, password, role) 
VALUES (1, 'Rajesh Sharma', 'Sharma General Store', 'merchant@example.com', '9876543210', '$2a$10$e70/3L6G36g3...password123', 'ROLE_MERCHANT');

INSERT IGNORE INTO customers (id, merchant_id, name, phone, email, address, credit_limit, risk_level)
VALUES 
(1, 1, 'Ramesh Kumar', '9811223344', 'ramesh@example.com', 'Shop #4, Main Market, Delhi', 15000.00, 'LOW'),
(2, 1, 'Priya Verma', '9899887766', 'priya@example.com', 'Flat 202, Sunshine Apts', 10000.00, 'MEDIUM'),
(3, 1, 'Amit Patel', '9711002233', 'amit@example.com', 'Block C, Sector 15, Gurgaon', 8000.00, 'HIGH');

INSERT IGNORE INTO transactions (id, merchant_id, customer_id, customer_name, customer_phone, amount, type, payment_mode, note)
VALUES
(101, 1, 1, 'Ramesh Kumar', '9811223344', 2500.00, 'GIVE', 'CASH', 'Grocery & Rice pack'),
(102, 1, 1, 'Ramesh Kumar', '9811223344', 1000.00, 'RECEIVE', 'UPI', 'GPay payment received'),
(103, 1, 2, 'Priya Verma', '9899887766', 4200.00, 'GIVE', 'CASH', 'Refill items');
