-- Schema extensions for customer checkout, payments, IMEI, and dashboard activity
-- Run this after api/database/schema.sql

USE phone_inventory;

CREATE TABLE IF NOT EXISTS imeis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    imei_number VARCHAR(20) NOT NULL UNIQUE,
    is_sold TINYINT(1) NOT NULL DEFAULT 0,
    sold_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_imei_product (product_id),
    INDEX idx_imei_is_sold (is_sold)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type ENUM('sale', 'stock_update', 'low_stock', 'new_product') NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_accounts_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    customer_account_id INT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    payment_reference VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL,
    INDEX idx_customer_orders_receipt (receipt_number),
    INDEX idx_customer_orders_customer_account_id (customer_account_id),
    INDEX idx_customer_orders_customer_email (customer_email),
    INDEX idx_customer_orders_payment_status (payment_status),
    INDEX idx_customer_orders_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_customer_order_items_order (order_id),
    INDEX idx_customer_order_items_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'paystack',
    amount DECIMAL(12, 2) NOT NULL,
    status ENUM('initialized', 'paid', 'failed') NOT NULL DEFAULT 'initialized',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_status (status)
) ENGINE=InnoDB;

ALTER TABLE customer_orders
    ADD COLUMN IF NOT EXISTS customer_account_id INT NULL AFTER receipt_number;

SET @idx_email_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_orders'
      AND INDEX_NAME = 'idx_customer_orders_customer_email'
);
SET @idx_email_sql = IF(
    @idx_email_exists = 0,
    'CREATE INDEX idx_customer_orders_customer_email ON customer_orders(customer_email)',
    'SELECT 1'
);
PREPARE idx_email_stmt FROM @idx_email_sql;
EXECUTE idx_email_stmt;
DEALLOCATE PREPARE idx_email_stmt;

SET @idx_account_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_orders'
      AND INDEX_NAME = 'idx_customer_orders_customer_account_id'
);
SET @idx_account_sql = IF(
    @idx_account_exists = 0,
    'CREATE INDEX idx_customer_orders_customer_account_id ON customer_orders(customer_account_id)',
    'SELECT 1'
);
PREPARE idx_account_stmt FROM @idx_account_sql;
EXECUTE idx_account_stmt;
DEALLOCATE PREPARE idx_account_stmt;

SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customer_orders'
      AND COLUMN_NAME = 'customer_account_id'
      AND REFERENCED_TABLE_NAME = 'customer_accounts'
);

SET @fk_sql = IF(
    @fk_exists = 0,
    'ALTER TABLE customer_orders ADD CONSTRAINT fk_customer_orders_account FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE fk_stmt FROM @fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;
