<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';
require_once '../models/Product.php';

// Require authentication
$auth = requireAuth();

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Initialize database and model
$database = new Database();
$db = $database->getConnection();
$product = new Product($db);

$result = $product->getLowStock();

echo json_encode([
    "success" => true,
    "data" => $result,
    "count" => count($result)
]);
