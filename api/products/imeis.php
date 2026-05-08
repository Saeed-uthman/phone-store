<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

if (!isset($_GET['product_id']) || !is_numeric($_GET['product_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "product_id is required"]);
    exit();
}

$product_id = (int)$_GET['product_id'];
$available_only = isset($_GET['available']) && $_GET['available'] === '1';

$database = new Database();
$db = $database->getConnection();

try {
    $check = $db->query("SHOW TABLES LIKE 'imeis'");
    if ($check->rowCount() === 0) {
        echo json_encode(["success" => true, "data" => []]);
        exit();
    }

    $query = "SELECT id, product_id, imei_number, is_sold, sold_at
              FROM imeis
              WHERE product_id = :product_id";

    if ($available_only) {
        $query .= " AND is_sold = 0";
    }

    $query .= " ORDER BY id ASC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":product_id", $product_id, PDO::PARAM_INT);
    $stmt->execute();
    $imeis = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $imeis]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to fetch IMEIs"]);
}

