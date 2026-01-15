-- Phone Store Inventory Management System
-- MySQL Database Schema
-- Compatible with XAMPP and cPanel

-- Create database (run this first if not exists)
CREATE DATABASE IF NOT EXISTS phone_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE phone_inventory;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) DEFAULT '',
    category ENUM('smartphones', 'tablets', 'accessories', 'smartwatches', 'audio', 'cases', 'chargers', 'cables', 'other') NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    description TEXT,
    image_url VARCHAR(500) DEFAULT '',
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sku (sku),
    INDEX idx_brand (brand),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- SALES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(100) DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(20) DEFAULT '',
    customer_email VARCHAR(100) DEFAULT '',
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'mobile_money', 'bank_transfer') NOT NULL,
    status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'completed',
    cashier_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice (invoice_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- SALE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_sale_id (sale_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB;

-- =====================================================
-- PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (change in production!)
-- =====================================================
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@phonestore.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- =====================================================
-- INSERT SAMPLE PRODUCTS
-- =====================================================
INSERT INTO products (name, brand, model, category, sku, price, cost_price, stock_quantity, min_stock_level, description, status) VALUES
('iPhone 15 Pro Max', 'Apple', '15 Pro Max', 'smartphones', 'APL-IP15PM-256', 1199.00, 950.00, 25, 5, '256GB, Natural Titanium', 'active'),
('iPhone 15 Pro', 'Apple', '15 Pro', 'smartphones', 'APL-IP15P-128', 999.00, 800.00, 30, 5, '128GB, Blue Titanium', 'active'),
('iPhone 15', 'Apple', '15', 'smartphones', 'APL-IP15-128', 799.00, 650.00, 40, 10, '128GB, Pink', 'active'),
('Samsung Galaxy S24 Ultra', 'Samsung', 'S24 Ultra', 'smartphones', 'SAM-S24U-256', 1299.00, 1000.00, 20, 5, '256GB, Titanium Gray', 'active'),
('Samsung Galaxy S24+', 'Samsung', 'S24+', 'smartphones', 'SAM-S24P-256', 999.00, 780.00, 25, 5, '256GB, Onyx Black', 'active'),
('Samsung Galaxy Z Fold5', 'Samsung', 'Z Fold5', 'smartphones', 'SAM-ZF5-512', 1799.00, 1400.00, 10, 3, '512GB, Phantom Black', 'active'),
('Google Pixel 8 Pro', 'Google', 'Pixel 8 Pro', 'smartphones', 'GOO-P8P-256', 999.00, 750.00, 15, 5, '256GB, Obsidian', 'active'),
('OnePlus 12', 'OnePlus', '12', 'smartphones', 'OP-12-256', 799.00, 600.00, 20, 5, '256GB, Flowy Emerald', 'active'),
('iPad Pro 12.9"', 'Apple', 'iPad Pro', 'tablets', 'APL-IPADP-256', 1099.00, 850.00, 15, 3, 'M2 chip, 256GB, Space Gray', 'active'),
('Samsung Galaxy Tab S9 Ultra', 'Samsung', 'Tab S9 Ultra', 'tablets', 'SAM-TS9U-256', 1199.00, 900.00, 10, 3, '256GB, Graphite', 'active'),
('Apple Watch Series 9', 'Apple', 'Watch S9', 'smartwatches', 'APL-AWS9-45', 429.00, 320.00, 30, 10, '45mm, GPS, Midnight', 'active'),
('Samsung Galaxy Watch 6 Classic', 'Samsung', 'Watch 6 Classic', 'smartwatches', 'SAM-GW6C-47', 399.00, 280.00, 25, 10, '47mm, Black', 'active'),
('AirPods Pro 2nd Gen', 'Apple', 'AirPods Pro 2', 'audio', 'APL-APP2', 249.00, 180.00, 50, 15, 'USB-C Charging Case', 'active'),
('Samsung Galaxy Buds2 Pro', 'Samsung', 'Buds2 Pro', 'audio', 'SAM-GB2P', 229.00, 150.00, 40, 10, 'Graphite', 'active'),
('Apple MagSafe Charger', 'Apple', 'MagSafe', 'chargers', 'APL-MAGSAFE', 39.00, 25.00, 100, 20, '15W Wireless Charger', 'active'),
('Samsung 45W Super Fast Charger', 'Samsung', '45W Charger', 'chargers', 'SAM-45W', 49.00, 30.00, 80, 20, 'USB-C, White', 'active'),
('USB-C to Lightning Cable', 'Apple', 'USB-C Lightning', 'cables', 'APL-USBC-L-1M', 19.00, 10.00, 150, 30, '1m Length', 'active'),
('iPhone 15 Pro Clear Case', 'Apple', 'Clear Case', 'cases', 'APL-CC-IP15P', 49.00, 25.00, 60, 15, 'MagSafe Compatible', 'active'),
('Galaxy S24 Ultra S-View Case', 'Samsung', 'S-View Case', 'cases', 'SAM-SVC-S24U', 59.00, 30.00, 40, 10, 'Black', 'active'),
('Anker PowerCore 20000', 'Anker', 'PowerCore', 'accessories', 'ANK-PC20K', 49.00, 30.00, 45, 10, '20000mAh Power Bank', 'active')
ON DUPLICATE KEY UPDATE name = name;

-- =====================================================
-- INSERT SAMPLE SALES (Optional)
-- =====================================================
INSERT INTO sales (invoice_number, customer_name, customer_phone, subtotal, discount, tax, total, payment_method, status, cashier_id) VALUES
('INV-20240115-0001', 'John Doe', '+1234567890', 1199.00, 0, 119.90, 1318.90, 'card', 'completed', 1),
('INV-20240115-0002', 'Jane Smith', '+1987654321', 249.00, 20.00, 22.90, 251.90, 'cash', 'completed', 1),
('INV-20240115-0003', 'Walk-in Customer', '', 39.00, 0, 3.90, 42.90, 'cash', 'completed', 1);

INSERT INTO sale_items (sale_id, product_id, quantity, price, total) VALUES
(1, 1, 1, 1199.00, 1199.00),
(2, 13, 1, 249.00, 249.00),
(3, 15, 1, 39.00, 39.00);
