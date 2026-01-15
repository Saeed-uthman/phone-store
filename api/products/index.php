<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';
require_once '../models/Product.php';

// Require authentication
$auth = requireAuth();

// Initialize database and model
$database = new Database();
$db = $database->getConnection();
$product = new Product($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all products or single product
        if (isset($_GET['id'])) {
            $result = $product->getById($_GET['id']);
            if ($result) {
                echo json_encode(["success" => true, "data" => $result]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Product not found"]);
            }
        } else {
            $search = isset($_GET['search']) ? $_GET['search'] : "";
            $category = isset($_GET['category']) ? $_GET['category'] : "";
            $status = isset($_GET['status']) ? $_GET['status'] : "";
            
            $result = $product->getAll($search, $category, $status);
            echo json_encode(["success" => true, "data" => $result]);
        }
        break;

    case 'POST':
        // Create new product
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate required fields
        $required = ['name', 'brand', 'category', 'sku', 'price', 'stock_quantity'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Field '$field' is required"]);
                exit();
            }
        }
        
        // Set defaults
        $data['model'] = $data['model'] ?? '';
        $data['cost_price'] = $data['cost_price'] ?? 0;
        $data['min_stock_level'] = $data['min_stock_level'] ?? 10;
        $data['description'] = $data['description'] ?? '';
        $data['image_url'] = $data['image_url'] ?? '';
        $data['status'] = $data['status'] ?? 'active';
        
        $result = $product->create($data);
        if ($result) {
            http_response_code(201);
            echo json_encode([
                "success" => true, 
                "message" => "Product created successfully",
                "id" => $result
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to create product"]);
        }
        break;

    case 'PUT':
        // Update product
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Product ID is required"]);
            exit();
        }
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Check if product exists
        $existing = $product->getById($_GET['id']);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Product not found"]);
            exit();
        }
        
        // Merge with existing data
        $data = array_merge($existing, $data);
        
        if ($product->update($_GET['id'], $data)) {
            echo json_encode(["success" => true, "message" => "Product updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update product"]);
        }
        break;

    case 'DELETE':
        // Delete product
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Product ID is required"]);
            exit();
        }
        
        if ($product->delete($_GET['id'])) {
            echo json_encode(["success" => true, "message" => "Product deleted successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to delete product"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
