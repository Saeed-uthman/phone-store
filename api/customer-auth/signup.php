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

$full_name = trim((string)($payload['full_name'] ?? ''));
$email = strtolower(trim((string)($payload['email'] ?? '')));
$phone = trim((string)($payload['phone'] ?? ''));
$password = (string)($payload['password'] ?? '');

if ($full_name === '' || $email === '' || $phone === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Full name, email, phone, and password are required"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters"]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $check_stmt = $db->prepare("SELECT id FROM customer_accounts WHERE email = :email LIMIT 1");
    $check_stmt->bindParam(':email', $email);
    $check_stmt->execute();

    if ($check_stmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Email already registered"]);
        exit();
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $insert_stmt = $db->prepare("
        INSERT INTO customer_accounts (full_name, email, phone, password_hash)
        VALUES (:full_name, :email, :phone, :password_hash)
    ");
    $insert_stmt->bindParam(':full_name', $full_name);
    $insert_stmt->bindParam(':email', $email);
    $insert_stmt->bindParam(':phone', $phone);
    $insert_stmt->bindParam(':password_hash', $password_hash);
    $insert_stmt->execute();

    $customer_id = (int)$db->lastInsertId();
    $token = JWT::generate([
        'customer_id' => $customer_id,
        'email' => $email,
        'role' => 'customer'
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Customer account created successfully",
        "token" => $token,
        "user" => [
            "id" => $customer_id,
            "full_name" => $full_name,
            "email" => $email,
            "phone" => $phone
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to create customer account"]);
}
