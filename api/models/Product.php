<?php
class Product {
    private $conn;
    private $table_name = "products";

    public $id;
    public $name;
    public $brand;
    public $model;
    public $category;
    public $sku;
    public $price;
    public $cost_price;
    public $stock_quantity;
    public $min_stock_level;
    public $description;
    public $image_url;
    public $status;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get all products with optional filters
    public function getAll($search = "", $category = "", $status = "") {
        $query = "SELECT * FROM " . $this->table_name . " WHERE 1=1";
        $params = [];

        if (!empty($search)) {
            $query .= " AND (name LIKE :search OR brand LIKE :search OR model LIKE :search OR sku LIKE :search)";
            $params[':search'] = "%$search%";
        }

        if (!empty($category)) {
            $query .= " AND category = :category";
            $params[':category'] = $category;
        }

        if (!empty($status)) {
            $query .= " AND status = :status";
            $params[':status'] = $status;
        }

        $query .= " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get single product by ID
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Create new product
    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (name, brand, model, category, sku, price, cost_price, stock_quantity, min_stock_level, description, image_url, status) 
                  VALUES (:name, :brand, :model, :category, :sku, :price, :cost_price, :stock_quantity, :min_stock_level, :description, :image_url, :status)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":name", $data['name']);
        $stmt->bindParam(":brand", $data['brand']);
        $stmt->bindParam(":model", $data['model']);
        $stmt->bindParam(":category", $data['category']);
        $stmt->bindParam(":sku", $data['sku']);
        $stmt->bindParam(":price", $data['price']);
        $stmt->bindParam(":cost_price", $data['cost_price']);
        $stmt->bindParam(":stock_quantity", $data['stock_quantity']);
        $stmt->bindParam(":min_stock_level", $data['min_stock_level']);
        $stmt->bindParam(":description", $data['description']);
        $stmt->bindParam(":image_url", $data['image_url']);
        $stmt->bindParam(":status", $data['status']);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Update product
    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET 
                  name = :name, brand = :brand, model = :model, category = :category, 
                  sku = :sku, price = :price, cost_price = :cost_price, 
                  stock_quantity = :stock_quantity, min_stock_level = :min_stock_level, 
                  description = :description, image_url = :image_url, status = :status,
                  updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":name", $data['name']);
        $stmt->bindParam(":brand", $data['brand']);
        $stmt->bindParam(":model", $data['model']);
        $stmt->bindParam(":category", $data['category']);
        $stmt->bindParam(":sku", $data['sku']);
        $stmt->bindParam(":price", $data['price']);
        $stmt->bindParam(":cost_price", $data['cost_price']);
        $stmt->bindParam(":stock_quantity", $data['stock_quantity']);
        $stmt->bindParam(":min_stock_level", $data['min_stock_level']);
        $stmt->bindParam(":description", $data['description']);
        $stmt->bindParam(":image_url", $data['image_url']);
        $stmt->bindParam(":status", $data['status']);
        
        return $stmt->execute();
    }

    // Delete product
    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    // Get low stock products
    public function getLowStock() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE stock_quantity <= min_stock_level ORDER BY stock_quantity ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Update stock quantity
    public function updateStock($id, $quantity) {
        $query = "UPDATE " . $this->table_name . " SET stock_quantity = stock_quantity + :quantity, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":quantity", $quantity);
        return $stmt->execute();
    }
}
