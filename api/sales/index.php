<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';
require_once '../models/Sale.php';

// Require authentication
$auth = requireAuth();

// Initialize database and model
$database = new Database();
$db = $database->getConnection();
$sale = new Sale($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all sales or single sale
        if (isset($_GET['id'])) {
            $result = $sale->getById($_GET['id']);
            if ($result) {
                echo json_encode(["success" => true, "data" => $result]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Sale not found"]);
            }
        } else {
            $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : "";
            $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : "";
            $status = isset($_GET['status']) ? $_GET['status'] : "";
            
            $result = $sale->getAll($start_date, $end_date, $status);
            echo json_encode(["success" => true, "data" => $result]);
        }
        break;

    case 'POST':
        // Create new sale
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validate required fields
        if (empty($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "At least one item is required"]);
            exit();
        }
        
        if (empty($data['payment_method'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Payment method is required"]);
            exit();
        }
        
        // Set defaults
        $data['customer_name'] = $data['customer_name'] ?? 'Walk-in Customer';
        $data['customer_phone'] = $data['customer_phone'] ?? '';
        $data['customer_email'] = $data['customer_email'] ?? '';
        if ($data['payment_method'] === 'transfer') {
            $data['payment_method'] = 'bank_transfer';
        }
        if (!isset($data['tax'])) {
            $data['tax'] = 0;
        }
        if (!isset($data['discount'])) {
            $data['discount'] = 0;
        }
        
        $result = $sale->create($data, $data['items'], $auth['user_id']);
        
        if ($result) {
            http_response_code(201);
            $created_sale = $sale->getById($result);
            echo json_encode([
                "success" => true, 
                "message" => "Sale completed successfully",
                "data" => $created_sale
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to create sale"]);
        }
        break;

    case 'PUT':
        // Update sale status
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Sale ID is required"]);
            exit();
        }
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['status'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Status is required"]);
            exit();
        }
        
        if ($sale->updateStatus($_GET['id'], $data['status'])) {
            echo json_encode(["success" => true, "message" => "Sale status updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update sale status"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
