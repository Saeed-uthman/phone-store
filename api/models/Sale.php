<?php
class Sale {
    private $conn;
    private $table_name = "sales";
    private $items_table = "sale_items";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get all sales with filters
    public function getAll($start_date = "", $end_date = "", $status = "") {
        $query = "SELECT s.*, u.username as cashier_name 
                  FROM " . $this->table_name . " s 
                  LEFT JOIN users u ON s.cashier_id = u.id 
                  WHERE 1=1";
        $params = [];

        if (!empty($start_date)) {
            $query .= " AND DATE(s.created_at) >= :start_date";
            $params[':start_date'] = $start_date;
        }

        if (!empty($end_date)) {
            $query .= " AND DATE(s.created_at) <= :end_date";
            $params[':end_date'] = $end_date;
        }

        if (!empty($status)) {
            $query .= " AND s.status = :status";
            $params[':status'] = $status;
        }

        $query .= " ORDER BY s.created_at DESC";

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get items for each sale
        foreach ($sales as &$sale) {
            $sale['items'] = $this->getSaleItems($sale['id']);
        }

        return $sales;
    }

    // Get single sale by ID
    public function getById($id) {
        $query = "SELECT s.*, u.username as cashier_name 
                  FROM " . $this->table_name . " s 
                  LEFT JOIN users u ON s.cashier_id = u.id 
                  WHERE s.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $sale = $stmt->fetch(PDO::FETCH_ASSOC);
            $sale['items'] = $this->getSaleItems($id);
            return $sale;
        }
        return false;
    }

    // Get sale items
    private function getSaleItems($sale_id) {
        $query = "SELECT si.*, p.name as product_name, p.brand, p.model 
                  FROM " . $this->items_table . " si 
                  LEFT JOIN products p ON si.product_id = p.id 
                  WHERE si.sale_id = :sale_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":sale_id", $sale_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Create new sale
    public function create($data, $items, $cashier_id) {
        try {
            $this->conn->beginTransaction();

            // Generate invoice number
            $invoice_number = 'INV-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

            // Calculate totals
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['price'] * $item['quantity'];
            }
            $discount = isset($data['discount']) ? $data['discount'] : 0;
            $tax = isset($data['tax']) ? $data['tax'] : ($subtotal * 0.1); // 10% default tax
            $total = $subtotal - $discount + $tax;

            // Insert sale
            $query = "INSERT INTO " . $this->table_name . " 
                      (invoice_number, customer_name, customer_phone, customer_email, subtotal, discount, tax, total, payment_method, status, cashier_id, notes) 
                      VALUES (:invoice_number, :customer_name, :customer_phone, :customer_email, :subtotal, :discount, :tax, :total, :payment_method, :status, :cashier_id, :notes)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(":invoice_number", $invoice_number);
            $stmt->bindParam(":customer_name", $data['customer_name']);
            $stmt->bindParam(":customer_phone", $data['customer_phone']);
            $stmt->bindParam(":customer_email", $data['customer_email']);
            $stmt->bindParam(":subtotal", $subtotal);
            $stmt->bindParam(":discount", $discount);
            $stmt->bindParam(":tax", $tax);
            $stmt->bindParam(":total", $total);
            $stmt->bindParam(":payment_method", $data['payment_method']);
            $status = isset($data['status']) ? $data['status'] : 'completed';
            $stmt->bindParam(":status", $status);
            $stmt->bindParam(":cashier_id", $cashier_id);
            $notes = isset($data['notes']) ? $data['notes'] : '';
            $stmt->bindParam(":notes", $notes);
            
            $stmt->execute();
            $sale_id = $this->conn->lastInsertId();

            // Insert sale items and update stock
            foreach ($items as $item) {
                $item_query = "INSERT INTO " . $this->items_table . " 
                              (sale_id, product_id, quantity, price, total) 
                              VALUES (:sale_id, :product_id, :quantity, :price, :total)";
                $item_stmt = $this->conn->prepare($item_query);
                
                $item_total = $item['price'] * $item['quantity'];
                
                $item_stmt->bindParam(":sale_id", $sale_id);
                $item_stmt->bindParam(":product_id", $item['product_id']);
                $item_stmt->bindParam(":quantity", $item['quantity']);
                $item_stmt->bindParam(":price", $item['price']);
                $item_stmt->bindParam(":total", $item_total);
                $item_stmt->execute();

                // Update product stock
                $stock_query = "UPDATE products SET stock_quantity = stock_quantity - :quantity WHERE id = :product_id";
                $stock_stmt = $this->conn->prepare($stock_query);
                $stock_stmt->bindParam(":quantity", $item['quantity']);
                $stock_stmt->bindParam(":product_id", $item['product_id']);
                $stock_stmt->execute();
            }

            $this->conn->commit();
            return $sale_id;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    // Update sale status
    public function updateStatus($id, $status) {
        $query = "UPDATE " . $this->table_name . " SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":status", $status);
        return $stmt->execute();
    }

    // Get sales statistics
    public function getStats($start_date = "", $end_date = "") {
        $where = "WHERE status = 'completed'";
        $params = [];

        if (!empty($start_date)) {
            $where .= " AND DATE(created_at) >= :start_date";
            $params[':start_date'] = $start_date;
        }

        if (!empty($end_date)) {
            $where .= " AND DATE(created_at) <= :end_date";
            $params[':end_date'] = $end_date;
        }

        $query = "SELECT 
                    COUNT(*) as total_sales,
                    SUM(total) as total_revenue,
                    SUM(subtotal) as gross_revenue,
                    SUM(discount) as total_discounts,
                    SUM(tax) as total_tax,
                    AVG(total) as average_sale
                  FROM " . $this->table_name . " " . $where;

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Get daily sales for chart
    public function getDailySales($days = 30) {
        $query = "SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total) as revenue 
                  FROM " . $this->table_name . " 
                  WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
                  GROUP BY DATE(created_at) 
                  ORDER BY date ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":days", $days, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
