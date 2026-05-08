<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/customer_auth.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

function mapOrderResponse($order, $items) {
    return [
        "id" => (int)$order['id'],
        "receipt_number" => $order['receipt_number'],
        "customer_account_id" => isset($order['customer_account_id']) && $order['customer_account_id'] !== null ? (int)$order['customer_account_id'] : null,
        "customer" => [
            "full_name" => $order['customer_name'],
            "phone_number" => $order['customer_phone'],
            "email" => $order['customer_email'],
        ],
        "items" => array_map(function ($item) {
            return [
                "product_id" => (int)$item['product_id'],
                "product_name" => $item['product_name'],
                "quantity" => (int)$item['quantity'],
                "unit_price" => (float)$item['unit_price'],
                "line_total" => (float)$item['line_total'],
            ];
        }, $items),
        "total_amount" => (float)$order['total_amount'],
        "payment_status" => $order['payment_status'],
        "payment_reference" => $order['payment_reference'],
        "created_at" => $order['created_at'],
    ];
}

try {
    if ($method === 'GET') {
        $where = "";
        $value = null;
        if (isset($_GET['receipt_number'])) {
            $where = "receipt_number = :value";
            $value = $_GET['receipt_number'];
        } elseif (isset($_GET['id']) && is_numeric($_GET['id'])) {
            $where = "id = :value";
            $value = (int)$_GET['id'];
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "receipt_number or id is required"]);
            exit();
        }

        $stmt = $db->prepare("SELECT * FROM customer_orders WHERE {$where} LIMIT 1");
        $stmt->bindValue(":value", $value);
        $stmt->execute();
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Order not found"]);
            exit();
        }

        $items_stmt = $db->prepare("SELECT * FROM customer_order_items WHERE order_id = :order_id ORDER BY id ASC");
        $items_stmt->bindParam(":order_id", $order['id'], PDO::PARAM_INT);
        $items_stmt->execute();
        $items = $items_stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "data" => mapOrderResponse($order, $items)]);
        exit();
    }

    if ($method === 'POST') {
        $payload = json_decode(file_get_contents("php://input"), true);
        if (!$payload || !isset($payload['customer']) || !isset($payload['items']) || !is_array($payload['items'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid order payload"]);
            exit();
        }

        $customer = $payload['customer'];
        $required_customer = ['full_name', 'phone_number', 'email'];
        foreach ($required_customer as $field) {
            if (empty($customer[$field])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Customer field '{$field}' is required"]);
                exit();
            }
        }

        if (count($payload['items']) === 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Order must include at least one item"]);
            exit();
        }

        $customer_auth = getOptionalCustomerAuth();
        $customer_account_id = null;
        if ($customer_auth && isset($customer_auth['customer_id'])) {
            $customer_account_id = (int)$customer_auth['customer_id'];
        }

        $db->beginTransaction();

        $receipt_number = 'RCP-' . date('Ymd') . '-' . str_pad((string)random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        $total_amount = isset($payload['total_amount']) ? (float)$payload['total_amount'] : 0;

        if ($customer_account_id !== null) {
            $account_stmt = $db->prepare("SELECT id FROM customer_accounts WHERE id = :id LIMIT 1");
            $account_stmt->bindParam(':id', $customer_account_id, PDO::PARAM_INT);
            $account_stmt->execute();
            if (!$account_stmt->fetch(PDO::FETCH_ASSOC)) {
                throw new Exception('Invalid customer account');
            }
        }

        $order_stmt = $db->prepare("
            INSERT INTO customer_orders
            (receipt_number, customer_account_id, customer_name, customer_phone, customer_email, total_amount, payment_status, status)
            VALUES
            (:receipt_number, :customer_account_id, :customer_name, :customer_phone, :customer_email, :total_amount, 'pending', 'pending')
        ");
        $order_stmt->bindParam(":receipt_number", $receipt_number);
        if ($customer_account_id === null) {
            $order_stmt->bindValue(":customer_account_id", null, PDO::PARAM_NULL);
        } else {
            $order_stmt->bindValue(":customer_account_id", $customer_account_id, PDO::PARAM_INT);
        }
        $order_stmt->bindParam(":customer_name", $customer['full_name']);
        $order_stmt->bindParam(":customer_phone", $customer['phone_number']);
        $order_stmt->bindParam(":customer_email", $customer['email']);
        $order_stmt->bindParam(":total_amount", $total_amount);
        $order_stmt->execute();
        $order_id = (int)$db->lastInsertId();

        $item_stmt = $db->prepare("
            INSERT INTO customer_order_items
            (order_id, product_id, product_name, quantity, unit_price, line_total)
            VALUES
            (:order_id, :product_id, :product_name, :quantity, :unit_price, :line_total)
        ");

        $inserted_items = [];
        foreach ($payload['items'] as $item) {
            if (!isset($item['product_id'], $item['product_name'], $item['quantity'], $item['unit_price'])) {
                throw new Exception('Invalid order item payload');
            }
            $quantity = (int)$item['quantity'];
            $unit_price = (float)$item['unit_price'];
            $line_total = isset($item['line_total']) ? (float)$item['line_total'] : ($quantity * $unit_price);

            $item_stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
            $item_stmt->bindParam(":product_id", $item['product_id'], PDO::PARAM_INT);
            $item_stmt->bindParam(":product_name", $item['product_name']);
            $item_stmt->bindParam(":quantity", $quantity, PDO::PARAM_INT);
            $item_stmt->bindParam(":unit_price", $unit_price);
            $item_stmt->bindParam(":line_total", $line_total);
            $item_stmt->execute();

            $inserted_items[] = [
                "product_id" => (int)$item['product_id'],
                "product_name" => $item['product_name'],
                "quantity" => $quantity,
                "unit_price" => $unit_price,
                "line_total" => $line_total,
            ];
        }

        $db->commit();

        $order_response = [
            "id" => $order_id,
            "receipt_number" => $receipt_number,
            "customer_name" => $customer['full_name'],
            "customer_phone" => $customer['phone_number'],
            "customer_email" => $customer['email'],
            "customer_account_id" => $customer_account_id,
            "total_amount" => $total_amount,
            "payment_status" => "pending",
            "payment_reference" => null,
            "created_at" => date('Y-m-d H:i:s'),
        ];

        echo json_encode([
            "success" => true,
            "message" => "Order created successfully",
            "data" => mapOrderResponse($order_response, $inserted_items)
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to process order"]);
}
