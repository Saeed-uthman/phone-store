<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/customer_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

function mapOrderRow($order, $items) {
    return [
        "id" => (int)$order['id'],
        "receipt_number" => $order['receipt_number'],
        "customer_account_id" => $order['customer_account_id'] ? (int)$order['customer_account_id'] : null,
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
        "created_at" => $order['created_at']
    ];
}

$auth = requireCustomerAuth();
$customer_id = (int)$auth['customer_id'];

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$per_page = isset($_GET['per_page']) ? max(1, min(100, (int)$_GET['per_page'])) : 10;
$offset = ($page - 1) * $per_page;

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

    $link_stmt = $db->prepare("
        UPDATE customer_orders
        SET customer_account_id = :customer_id, updated_at = CURRENT_TIMESTAMP
        WHERE customer_account_id IS NULL
          AND LOWER(customer_email) = :email
    ");
    $link_stmt->bindParam(':customer_id', $customer_id, PDO::PARAM_INT);
    $link_stmt->bindParam(':email', $email);
    $link_stmt->execute();

    $count_stmt = $db->prepare("
        SELECT COUNT(*) AS total
        FROM customer_orders
        WHERE customer_account_id = :customer_id
           OR (customer_account_id IS NULL AND LOWER(customer_email) = :email)
    ");
    $count_stmt->bindParam(':customer_id', $customer_id, PDO::PARAM_INT);
    $count_stmt->bindParam(':email', $email);
    $count_stmt->execute();
    $total = (int)$count_stmt->fetchColumn();

    $orders_stmt = $db->prepare("
        SELECT *
        FROM customer_orders
        WHERE customer_account_id = :customer_id
           OR (customer_account_id IS NULL AND LOWER(customer_email) = :email)
        ORDER BY created_at DESC, id DESC
        LIMIT :limit OFFSET :offset
    ");
    $orders_stmt->bindParam(':customer_id', $customer_id, PDO::PARAM_INT);
    $orders_stmt->bindParam(':email', $email);
    $orders_stmt->bindValue(':limit', $per_page, PDO::PARAM_INT);
    $orders_stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $orders_stmt->execute();
    $orders = $orders_stmt->fetchAll(PDO::FETCH_ASSOC);

    $order_ids = array_map(function ($row) {
        return (int)$row['id'];
    }, $orders);

    $items_by_order = [];
    if (count($order_ids) > 0) {
        $placeholders = implode(',', array_fill(0, count($order_ids), '?'));
        $items_stmt = $db->prepare("
            SELECT order_id, product_id, product_name, quantity, unit_price, line_total
            FROM customer_order_items
            WHERE order_id IN ($placeholders)
            ORDER BY id ASC
        ");
        foreach ($order_ids as $index => $order_id) {
            $items_stmt->bindValue($index + 1, $order_id, PDO::PARAM_INT);
        }
        $items_stmt->execute();
        $items = $items_stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($items as $item) {
            $oid = (int)$item['order_id'];
            if (!isset($items_by_order[$oid])) {
                $items_by_order[$oid] = [];
            }
            $items_by_order[$oid][] = $item;
        }
    }

    $mapped_orders = array_map(function ($order) use ($items_by_order) {
        $order_id = (int)$order['id'];
        return mapOrderRow($order, $items_by_order[$order_id] ?? []);
    }, $orders);

    echo json_encode([
        "success" => true,
        "data" => $mapped_orders,
        "pagination" => [
            "total" => $total,
            "page" => $page,
            "per_page" => $per_page,
            "total_pages" => $per_page > 0 ? (int)ceil($total / $per_page) : 0
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to load order history"]);
}
