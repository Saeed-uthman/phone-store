-- Seed script generated from src/data/mockData.ts
-- Target database: phone_inventory
-- Run after api/database/schema.sql

USE phone_inventory;

SET FOREIGN_KEY_CHECKS = 0;

-- Optional tables for frontend mock parity (not present in base schema.sql)
CREATE TABLE IF NOT EXISTS imeis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    imei_number VARCHAR(20) NOT NULL UNIQUE,
    is_sold TINYINT(1) NOT NULL DEFAULT 0,
    sold_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_is_sold (is_sold)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type ENUM('sale', 'stock_update', 'low_stock', 'new_product') NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

TRUNCATE TABLE sale_items;
TRUNCATE TABLE sales;
TRUNCATE TABLE imeis;
TRUNCATE TABLE activities;
TRUNCATE TABLE products;
TRUNCATE TABLE password_resets;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- Users from mockUsers
-- Password for both users: password123
INSERT INTO users (id, username, email, password, role, created_at, updated_at) VALUES
(1, 'admin', 'admin@phonestore.com', '$2y$10$Q6sqUGxvVyyClsmtMvy.ee/g6Z.FB.ssyUk1ocYHy3WMBqHYG19JG', 'admin', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(2, 'sales', 'sales@phonestore.com', '$2y$10$Q6sqUGxvVyyClsmtMvy.ee/g6Z.FB.ssyUk1ocYHy3WMBqHYG19JG', 'staff', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Products from mockProducts
INSERT INTO products (
    id, name, brand, model, category, sku, price, cost_price, stock_quantity, min_stock_level,
    description, image_url, status, created_at, updated_at
) VALUES
(1, 'Samsung Galaxy A15', 'Samsung', 'Galaxy A15', 'smartphones', 'MOCK-PROD-001', 150000.00, 120000.00, 10, 3, 'Phone product imported from frontend mock data', '', 'active', '2024-01-15 10:00:00', '2024-01-20 14:30:00'),
(2, 'iPhone 15 Pro Max', 'iPhone', '15 Pro Max', 'smartphones', 'MOCK-PROD-002', 1050000.00, 850000.00, 5, 2, 'Phone product imported from frontend mock data', '', 'active', '2024-01-10 09:00:00', '2024-01-22 11:00:00'),
(3, 'Samsung Galaxy S24 Ultra', 'Samsung', 'Galaxy S24 Ultra', 'smartphones', 'MOCK-PROD-003', 900000.00, 700000.00, 3, 2, 'Phone product imported from frontend mock data', '', 'active', '2024-01-12 08:00:00', '2024-01-21 16:00:00'),
(4, 'Xiaomi Redmi Note 13', 'Xiaomi', 'Redmi Note 13', 'smartphones', 'MOCK-PROD-004', 110000.00, 80000.00, 15, 5, 'Phone product imported from frontend mock data', '', 'active', '2024-01-08 10:00:00', '2024-01-19 12:00:00'),
(5, 'Google Pixel 8', 'Google', 'Pixel 8', 'smartphones', 'MOCK-PROD-005', 580000.00, 450000.00, 2, 2, 'Phone product imported from frontend mock data', '', 'active', '2024-01-05 11:00:00', '2024-01-18 09:00:00'),
(6, 'Samsung Galaxy Buds3 Pro', 'Samsung', 'Galaxy Buds3 Pro', 'accessories', 'MOCK-PROD-006', 65000.00, 45000.00, 20, 5, 'Accessory product imported from frontend mock data', '', 'active', '2024-01-14 13:00:00', '2024-01-20 10:00:00'),
(7, 'Apple 20W USB-C Power Adapter', 'Apple', '20W USB-C Power Adapter', 'chargers', 'MOCK-PROD-007', 15000.00, 8000.00, 30, 10, 'Charger product imported from frontend mock data', '', 'active', '2024-01-11 14:00:00', '2024-01-17 11:00:00'),
(8, 'Spigen Ultra Hybrid iPhone 15', 'Spigen', 'Ultra Hybrid iPhone 15', 'cases', 'MOCK-PROD-008', 7500.00, 3000.00, 50, 15, 'Case product imported from frontend mock data', '', 'active', '2024-01-09 09:00:00', '2024-01-16 15:00:00'),
(9, 'Tempered Samsung S24 Ultra Glass', 'Tempered', 'Samsung S24 Ultra Glass', 'accessories', 'MOCK-PROD-009', 4000.00, 1500.00, 40, 10, 'Screen protector imported from frontend mock data', '', 'active', '2024-01-07 10:00:00', '2024-01-15 12:00:00'),
(10, 'Anker USB-C to Lightning 1m', 'Anker', 'USB-C to Lightning 1m', 'cables', 'MOCK-PROD-010', 5500.00, 2500.00, 25, 8, 'Cable product imported from frontend mock data', '', 'active', '2024-01-06 11:00:00', '2024-01-14 10:00:00');

-- IMEIs from mockIMEIs
INSERT INTO imeis (id, product_id, imei_number, is_sold, sold_at) VALUES
(1, 1, '356789012345678', 0, NULL),
(2, 1, '356789012345679', 0, NULL),
(3, 1, '356789012345680', 1, '2024-01-20 10:30:00'),
(4, 1, '356789012345681', 0, NULL),
(5, 1, '356789012345682', 0, NULL),
(6, 1, '356789012345683', 1, '2024-01-21 14:00:00'),
(7, 1, '356789012345684', 0, NULL),
(8, 1, '356789012345685', 0, NULL),
(9, 1, '356789012345686', 0, NULL),
(10, 1, '356789012345687', 0, NULL),
(11, 2, '490154203237518', 0, NULL),
(12, 2, '490154203237519', 0, NULL),
(13, 2, '490154203237520', 1, '2024-01-19 11:00:00'),
(14, 2, '490154203237521', 0, NULL),
(15, 2, '490154203237522', 0, NULL),
(16, 3, '352436108765432', 0, NULL),
(17, 3, '352436108765433', 0, NULL),
(18, 3, '352436108765434', 0, NULL),
(19, 4, '861234567890123', 0, NULL),
(20, 4, '861234567890124', 0, NULL),
(21, 4, '861234567890125', 0, NULL),
(22, 4, '861234567890126', 0, NULL),
(23, 4, '861234567890127', 0, NULL),
(24, 5, '358673104590876', 0, NULL),
(25, 5, '358673104590877', 0, NULL);

-- Sales from mockSales
-- payment_method mapping: transfer -> bank_transfer
INSERT INTO sales (
    id, invoice_number, customer_name, customer_phone, customer_email, subtotal, discount, tax, total,
    payment_method, status, cashier_id, notes, created_at, updated_at
) VALUES
(1, 'INV-MOCK-0001', 'Walk-in Customer', '', '', 150000.00, 0.00, 0.00, 150000.00, 'card', 'completed', 2, 'Imported from frontend mock data', '2024-01-20 10:30:00', '2024-01-20 10:30:00'),
(2, 'INV-MOCK-0002', 'Walk-in Customer', '', '', 1065000.00, 0.00, 0.00, 1065000.00, 'bank_transfer', 'completed', 1, 'Imported from frontend mock data', '2024-01-19 11:00:00', '2024-01-19 11:00:00'),
(3, 'INV-MOCK-0003', 'Walk-in Customer', '', '', 23000.00, 0.00, 0.00, 23000.00, 'cash', 'completed', 2, 'Imported from frontend mock data', '2024-01-21 14:00:00', '2024-01-21 14:00:00'),
(4, 'INV-MOCK-0004', 'Walk-in Customer', '', '', 150000.00, 0.00, 0.00, 150000.00, 'cash', 'completed', 1, 'Imported from frontend mock data', '2024-01-21 15:30:00', '2024-01-21 15:30:00'),
(5, 'INV-MOCK-0005', 'Walk-in Customer', '', '', 130000.00, 0.00, 0.00, 130000.00, 'bank_transfer', 'completed', 2, 'Imported from frontend mock data', '2024-01-18 09:15:00', '2024-01-18 09:15:00'),
(6, 'INV-MOCK-0006', 'Walk-in Customer', '', '', 121500.00, 0.00, 0.00, 121500.00, 'card', 'completed', 1, 'Imported from frontend mock data', '2024-01-17 16:45:00', '2024-01-17 16:45:00'),
(7, 'INV-MOCK-0007', 'Walk-in Customer', '', '', 16500.00, 0.00, 0.00, 16500.00, 'cash', 'completed', 2, 'Imported from frontend mock data', '2024-01-16 11:20:00', '2024-01-16 11:20:00'),
(8, 'INV-MOCK-0008', 'Walk-in Customer', '', '', 900000.00, 0.00, 0.00, 900000.00, 'bank_transfer', 'completed', 1, 'Imported from frontend mock data', '2024-01-15 14:00:00', '2024-01-15 14:00:00'),
(9, 'INV-MOCK-0009', 'Walk-in Customer', '', '', 41000.00, 0.00, 0.00, 41000.00, 'card', 'completed', 2, 'Imported from frontend mock data', '2024-01-14 10:30:00', '2024-01-14 10:30:00'),
(10, 'INV-MOCK-0010', 'Walk-in Customer', '', '', 595000.00, 0.00, 0.00, 595000.00, 'bank_transfer', 'completed', 1, 'Imported from frontend mock data', '2024-01-12 13:00:00', '2024-01-12 13:00:00');

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total, created_at) VALUES
(1, 1, 1, 1, 150000.00, 150000.00, '2024-01-20 10:30:00'),
(2, 2, 2, 1, 1050000.00, 1050000.00, '2024-01-19 11:00:00'),
(3, 2, 7, 1, 15000.00, 15000.00, '2024-01-19 11:00:00'),
(4, 3, 8, 2, 7500.00, 15000.00, '2024-01-21 14:00:00'),
(5, 3, 9, 2, 4000.00, 8000.00, '2024-01-21 14:00:00'),
(6, 4, 1, 1, 150000.00, 150000.00, '2024-01-21 15:30:00'),
(7, 5, 6, 2, 65000.00, 130000.00, '2024-01-18 09:15:00'),
(8, 6, 4, 1, 110000.00, 110000.00, '2024-01-17 16:45:00'),
(9, 6, 8, 1, 7500.00, 7500.00, '2024-01-17 16:45:00'),
(10, 6, 9, 1, 4000.00, 4000.00, '2024-01-17 16:45:00'),
(11, 7, 10, 3, 5500.00, 16500.00, '2024-01-16 11:20:00'),
(12, 8, 3, 1, 900000.00, 900000.00, '2024-01-15 14:00:00'),
(13, 9, 7, 2, 15000.00, 30000.00, '2024-01-14 10:30:00'),
(14, 9, 10, 2, 5500.00, 11000.00, '2024-01-14 10:30:00'),
(15, 10, 5, 1, 580000.00, 580000.00, '2024-01-12 13:00:00'),
(16, 10, 7, 1, 15000.00, 15000.00, '2024-01-12 13:00:00');

-- Activities from mockActivities
INSERT INTO activities (id, activity_type, message, created_at) VALUES
(1, 'sale', 'Samsung Galaxy A15 sold for NGN150,000', '2024-01-21 15:30:00'),
(2, 'low_stock', 'Google Pixel 8 is running low (2 units left)', '2024-01-21 14:00:00'),
(3, 'sale', 'Multiple items sold for NGN23,000', '2024-01-21 14:00:00'),
(4, 'stock_update', 'Added 10 units of Anker USB-C Cable', '2024-01-21 10:00:00'),
(5, 'sale', 'iPhone 15 Pro Max + Charger sold for NGN1,065,000', '2024-01-19 11:00:00'),
(6, 'new_product', 'New product added: Samsung Galaxy Buds3 Pro', '2024-01-14 13:00:00'),
(7, 'low_stock', 'Samsung Galaxy S24 Ultra is running low (3 units left)', '2024-01-12 16:00:00');

-- Keep AUTO_INCREMENT aligned
ALTER TABLE users AUTO_INCREMENT = 3;
ALTER TABLE products AUTO_INCREMENT = 11;
ALTER TABLE imeis AUTO_INCREMENT = 26;
ALTER TABLE sales AUTO_INCREMENT = 11;
ALTER TABLE sale_items AUTO_INCREMENT = 17;
ALTER TABLE activities AUTO_INCREMENT = 8;

