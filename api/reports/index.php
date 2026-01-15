<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';
require_once '../models/Sale.php';
require_once '../models/Product.php';

// Require authentication
$auth = requireAuth();

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Initialize database and models
$database = new Database();
$db = $database->getConnection();
$sale = new Sale($db);
$product = new Product($db);

// Get date range from query params
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01'); // First day of current month
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d'); // Today
$report_type = isset($_GET['type']) ? $_GET['type'] : 'summary';

switch ($report_type) {
    case 'summary':
        // Get sales statistics
        $stats = $sale->getStats($start_date, $end_date);
        
        // Get low stock count
        $low_stock = $product->getLowStock();
        
        // Get all products for total count
        $all_products = $product->getAll();
        
        echo json_encode([
            "success" => true,
            "data" => [
                "period" => [
                    "start_date" => $start_date,
                    "end_date" => $end_date
                ],
                "sales" => [
                    "total_transactions" => (int)$stats['total_sales'],
                    "total_revenue" => (float)$stats['total_revenue'],
                    "gross_revenue" => (float)$stats['gross_revenue'],
                    "total_discounts" => (float)$stats['total_discounts'],
                    "total_tax" => (float)$stats['total_tax'],
                    "average_sale" => (float)$stats['average_sale']
                ],
                "inventory" => [
                    "total_products" => count($all_products),
                    "low_stock_count" => count($low_stock)
                ]
            ]
        ]);
        break;

    case 'daily':
        // Get daily sales data
        $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
        $daily_sales = $sale->getDailySales($days);
        
        echo json_encode([
            "success" => true,
            "data" => $daily_sales
        ]);
        break;

    case 'products':
        // Get top selling products
        $query = "SELECT p.id, p.name, p.brand, p.model, 
                         SUM(si.quantity) as total_sold,
                         SUM(si.total) as total_revenue
                  FROM sale_items si
                  JOIN products p ON si.product_id = p.id
                  JOIN sales s ON si.sale_id = s.id
                  WHERE s.status = 'completed'";
        
        if (!empty($start_date)) {
            $query .= " AND DATE(s.created_at) >= '$start_date'";
        }
        if (!empty($end_date)) {
            $query .= " AND DATE(s.created_at) <= '$end_date'";
        }
        
        $query .= " GROUP BY p.id ORDER BY total_sold DESC LIMIT 10";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $top_products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "data" => $top_products
        ]);
        break;

    case 'categories':
        // Get sales by category
        $query = "SELECT p.category, 
                         COUNT(DISTINCT s.id) as total_sales,
                         SUM(si.quantity) as total_items,
                         SUM(si.total) as total_revenue
                  FROM sale_items si
                  JOIN products p ON si.product_id = p.id
                  JOIN sales s ON si.sale_id = s.id
                  WHERE s.status = 'completed'";
        
        if (!empty($start_date)) {
            $query .= " AND DATE(s.created_at) >= '$start_date'";
        }
        if (!empty($end_date)) {
            $query .= " AND DATE(s.created_at) <= '$end_date'";
        }
        
        $query .= " GROUP BY p.category ORDER BY total_revenue DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "data" => $categories
        ]);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid report type"]);
}
