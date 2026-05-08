<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
if (!$payload) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request payload"]);
    exit();
}

$email = strtolower(trim((string)($payload['email'] ?? '')));
$password = (string)($payload['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and password are required"]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("
        SELECT id, full_name, email, phone, password_hash
        FROM customer_accounts
        WHERE email = :email
        LIMIT 1
    ");
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account || !password_verify($password, $account['password_hash'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid email or password"]);
        exit();
    }

    $customer_id = (int)$account['id'];
    $token = JWT::generate([
        'customer_id' => $customer_id,
        'email' => $account['email'],
        'role' => 'customer'
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "token" => $token,
        "user" => [
            "id" => $customer_id,
            "full_name" => $account['full_name'],
            "email" => $account['email'],
            "phone" => $account['phone']
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to complete login"]);
}
