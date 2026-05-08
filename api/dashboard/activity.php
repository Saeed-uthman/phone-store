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

$database = new Database();
$db = $database->getConnection();

try {
    $activity_exists = $db->query("SHOW TABLES LIKE 'activities'")->rowCount() > 0;

    if ($activity_exists) {
        $stmt = $db->prepare("
            SELECT id, activity_type AS type, message, created_at
            FROM activities
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $rows]);
        exit();
    }

    // Fallback: derive activity from recent sales if activities table is not available.
    $sales_stmt = $db->prepare("
        SELECT id, invoice_number, total, created_at
        FROM sales
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $sales_stmt->execute();
    $sales_rows = $sales_stmt->fetchAll(PDO::FETCH_ASSOC);

    $derived = [];
    foreach ($sales_rows as $sale) {
        $derived[] = [
            "id" => (int)$sale['id'],
            "type" => "sale",
            "message" => "Sale {$sale['invoice_number']} completed for NGN" . number_format((float)$sale['total'], 0),
            "created_at" => $sale['created_at'],
        ];
    }

    echo json_encode(["success" => true, "data" => $derived]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to fetch recent activity"]);
}

