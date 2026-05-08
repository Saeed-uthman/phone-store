<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/customer_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$auth = requireCustomerAuth();
$customer_id = (int)$auth['customer_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("
        SELECT id, full_name, email, phone, created_at
        FROM customer_accounts
        WHERE id = :id
        LIMIT 1
    ");
    $stmt->bindParam(':id', $customer_id, PDO::PARAM_INT);
    $stmt->execute();
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Customer account not found"]);
        exit();
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "id" => (int)$account['id'],
            "full_name" => $account['full_name'],
            "email" => $account['email'],
            "phone" => $account['phone'],
            "created_at" => $account['created_at']
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to load customer profile"]);
}
