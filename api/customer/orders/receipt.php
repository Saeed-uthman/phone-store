<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/customer_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$receipt_number = isset($_GET['receipt_number']) ? trim((string)$_GET['receipt_number']) : '';
if ($receipt_number === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "receipt_number is required"]);
    exit();
}

$auth = requireCustomerAuth();
$customer_id = (int)$auth['customer_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

    $account_stmt = $db->prepare("SELECT id, email FROM customer_accounts WHERE id = :id LIMIT 1");
    $account_stmt->bindParam(':id', $customer_id, PDO::PARAM_INT);
    $account_stmt->execute();
    $account = $account_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Customer account not found"]);
        exit();
    }

    $email = strtolower((string)$account['email']);

    $order_stmt = $db->prepare("
        SELECT *
        FROM customer_orders
        WHERE receipt_number = :receipt_number
          AND (
              customer_account_id = :customer_id
              OR (customer_account_id IS NULL AND LOWER(customer_email) = :email)
          )
        LIMIT 1
    ");
    $order_stmt->bindParam(':receipt_number', $receipt_number);
    $order_stmt->bindParam(':customer_id', $customer_id, PDO::PARAM_INT);
    $order_stmt->bindParam(':email', $email);
    $order_stmt->execute();
    $order = $order_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Receipt not found"]);
        exit();
    }

    if (empty($order['customer_account_id']) && strtolower((string)$order['customer_email']) === $email) {
        $link_stmt = $db->prepare("
            UPDATE customer_orders
            SET customer_account_id = :customer_id, updated_at = CURRENT_TIMESTAMP
            WHERE id = :order_id
        ");
        $link_stmt->bindParam(':customer_id', $customer_id, PDO::PARAM_INT);
        $link_stmt->bindParam(':order_id', $order['id'], PDO::PARAM_INT);
        $link_stmt->execute();
    }

    $items_stmt = $db->prepare("
        SELECT product_id, product_name, quantity, unit_price, line_total
        FROM customer_order_items
        WHERE order_id = :order_id
        ORDER BY id ASC
    ");
    $items_stmt->bindParam(':order_id', $order['id'], PDO::PARAM_INT);
    $items_stmt->execute();
    $items = $items_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => [
            "id" => (int)$order['id'],
            "receipt_number" => $order['receipt_number'],
            "customer" => [
                "full_name" => $order['customer_name'],
                "phone_number" => $order['customer_phone'],
                "email" => $order['customer_email']
            ],
            "items" => array_map(function ($item) {
                return [
                    "product_id" => (int)$item['product_id'],
                    "product_name" => $item['product_name'],
                    "quantity" => (int)$item['quantity'],
                    "unit_price" => (float)$item['unit_price'],
                    "line_total" => (float)$item['line_total']
                ];
            }, $items),
            "total_amount" => (float)$order['total_amount'],
            "payment_status" => $order['payment_status'],
            "payment_reference" => $order['payment_reference'],
            "status" => $order['status'],
            "created_at" => $order['created_at'],
            "collection_instruction" => "Please come to the shop with this e-receipt to collect your item."
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to load receipt"]);
}
