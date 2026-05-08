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
    $total_products = (int)$db->query("SELECT COUNT(*) FROM products")->fetchColumn();
    $low_stock_count = (int)$db->query("SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level")->fetchColumn();

    $today_stmt = $db->query("
        SELECT COUNT(*) AS total_sales, COALESCE(SUM(total), 0) AS total_revenue
        FROM sales
        WHERE status = 'completed' AND DATE(created_at) = CURDATE()
    ");
    $today_data = $today_stmt->fetch(PDO::FETCH_ASSOC);
    $today_sales = (int)$today_data['total_sales'];
    $today_revenue = (float)$today_data['total_revenue'];

    $inventory_value = (float)$db->query("SELECT COALESCE(SUM(stock_quantity * cost_price), 0) FROM products")->fetchColumn();
    $expected_profit = (float)$db->query("SELECT COALESCE(SUM(stock_quantity * (price - cost_price)), 0) FROM products")->fetchColumn();

    $profit_earned_stmt = $db->query("
        SELECT COALESCE(SUM((si.price - p.cost_price) * si.quantity), 0) AS profit_earned
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        INNER JOIN products p ON p.id = si.product_id
        WHERE s.status = 'completed'
    ");
    $profit_earned = (float)$profit_earned_stmt->fetchColumn();

    $monthly_revenue = (float)$db->query("
        SELECT COALESCE(SUM(total), 0)
        FROM sales
        WHERE status = 'completed'
          AND YEAR(created_at) = YEAR(CURDATE())
          AND MONTH(created_at) = MONTH(CURDATE())
    ")->fetchColumn();

    $weekly_sales = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    $weekly_stmt = $db->query("
        SELECT WEEKDAY(created_at) AS weekday_index, COUNT(*) AS count_sales
        FROM sales
        WHERE status = 'completed'
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY WEEKDAY(created_at)
    ");
    $weekly_rows = $weekly_stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($weekly_rows as $row) {
        $index = (int)$row['weekday_index']; // 0=Mon ... 6=Sun
        if ($index >= 0 && $index <= 6) {
            $weekly_sales[$index] = (int)$row['count_sales'];
        }
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "total_products" => $total_products,
            "low_stock_count" => $low_stock_count,
            "today_sales" => $today_sales,
            "today_revenue" => $today_revenue,
            "inventory_value" => $inventory_value,
            "expected_profit" => $expected_profit,
            "profit_earned" => $profit_earned,
            "weekly_sales" => $weekly_sales,
            "monthly_revenue" => $monthly_revenue
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to fetch dashboard summary"]);
}

