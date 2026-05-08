<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
if (!$payload || empty($payload['order_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "order_id is required"]);
    exit();
}

$order_id = (int)$payload['order_id'];
$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();

    $order_stmt = $db->prepare("SELECT * FROM customer_orders WHERE id = :order_id LIMIT 1");
    $order_stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
    $order_stmt->execute();
    $order = $order_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception('Order not found');
    }

    if ($order['payment_status'] === 'paid') {
        echo json_encode([
            "success" => true,
            "message" => "Payment already completed",
            "receipt_number" => $order['receipt_number'],
            "payment_reference" => $order['payment_reference'] ?: '',
        ]);
        $db->commit();
        exit();
    }

    $items_stmt = $db->prepare("SELECT * FROM customer_order_items WHERE order_id = :order_id ORDER BY id ASC");
    $items_stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
    $items_stmt->execute();
    $items = $items_stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($items) === 0) {
        throw new Exception('Order has no items');
    }

    $payment_reference = 'PSTK-' . date('YmdHis') . '-' . str_pad((string)random_int(1, 9999), 4, '0', STR_PAD_LEFT);

    $update_order_stmt = $db->prepare("
        UPDATE customer_orders
        SET payment_status = 'paid', status = 'completed', payment_reference = :payment_reference, updated_at = CURRENT_TIMESTAMP
        WHERE id = :order_id
    ");
    $update_order_stmt->bindParam(":payment_reference", $payment_reference);
    $update_order_stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
    $update_order_stmt->execute();

    $insert_payment_stmt = $db->prepare("
        INSERT INTO payments (order_id, payment_reference, provider, amount, status)
        VALUES (:order_id, :payment_reference, 'paystack', :amount, 'paid')
    ");
    $insert_payment_stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
    $insert_payment_stmt->bindParam(":payment_reference", $payment_reference);
    $insert_payment_stmt->bindParam(":amount", $order['total_amount']);
    $insert_payment_stmt->execute();

    $invoice_number = 'INV-' . date('Ymd') . '-' . str_pad((string)random_int(1, 9999), 4, '0', STR_PAD_LEFT);
    $insert_sale_stmt = $db->prepare("
        INSERT INTO sales
        (invoice_number, customer_name, customer_phone, customer_email, subtotal, discount, tax, total, payment_method, status, cashier_id, notes)
        VALUES
        (:invoice_number, :customer_name, :customer_phone, :customer_email, :subtotal, 0, 0, :total, 'card', 'completed', NULL, :notes)
    ");
    $insert_sale_stmt->bindParam(":invoice_number", $invoice_number);
    $insert_sale_stmt->bindParam(":customer_name", $order['customer_name']);
    $insert_sale_stmt->bindParam(":customer_phone", $order['customer_phone']);
    $insert_sale_stmt->bindParam(":customer_email", $order['customer_email']);
    $insert_sale_stmt->bindParam(":subtotal", $order['total_amount']);
    $insert_sale_stmt->bindParam(":total", $order['total_amount']);
    $notes = 'Customer checkout payment. Receipt: ' . $order['receipt_number'];
    $insert_sale_stmt->bindParam(":notes", $notes);
    $insert_sale_stmt->execute();
    $sale_id = (int)$db->lastInsertId();

    $sale_item_stmt = $db->prepare("
        INSERT INTO sale_items (sale_id, product_id, quantity, price, total)
        VALUES (:sale_id, :product_id, :quantity, :price, :total)
    ");
    $stock_update_stmt = $db->prepare("
        UPDATE products
        SET stock_quantity = GREATEST(stock_quantity - :quantity, 0), updated_at = CURRENT_TIMESTAMP
        WHERE id = :product_id
    ");

    foreach ($items as $item) {
        $quantity = (int)$item['quantity'];
        $unit_price = (float)$item['unit_price'];
        $line_total = (float)$item['line_total'];

        $sale_item_stmt->bindParam(":sale_id", $sale_id, PDO::PARAM_INT);
        $sale_item_stmt->bindParam(":product_id", $item['product_id'], PDO::PARAM_INT);
        $sale_item_stmt->bindParam(":quantity", $quantity, PDO::PARAM_INT);
        $sale_item_stmt->bindParam(":price", $unit_price);
        $sale_item_stmt->bindParam(":total", $line_total);
        $sale_item_stmt->execute();

        $stock_update_stmt->bindParam(":product_id", $item['product_id'], PDO::PARAM_INT);
        $stock_update_stmt->bindParam(":quantity", $quantity, PDO::PARAM_INT);
        $stock_update_stmt->execute();
    }

    $activity_exists = $db->query("SHOW TABLES LIKE 'activities'")->rowCount() > 0;
    if ($activity_exists) {
        $activity_stmt = $db->prepare("
            INSERT INTO activities (activity_type, message)
            VALUES ('sale', :message)
        ");
        $activity_message = "Order {$order['receipt_number']} paid successfully for NGN" . number_format((float)$order['total_amount'], 0);
        $activity_stmt->bindParam(":message", $activity_message);
        $activity_stmt->execute();
    }

    $db->commit();

    echo json_encode([
        "success" => true,
        "message" => "Payment successful",
        "receipt_number" => $order['receipt_number'],
        "payment_reference" => $payment_reference
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Payment initialization failed"]);
}

