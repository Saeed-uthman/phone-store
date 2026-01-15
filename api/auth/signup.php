<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../models/User.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate input
if (empty($data->username) || empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username, email, and password are required"]);
    exit();
}

// Validate email format
if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit();
}

// Validate password length
if (strlen($data->password) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters"]);
    exit();
}

// Confirm password match
if (isset($data->confirmPassword) && $data->password !== $data->confirmPassword) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Passwords do not match"]);
    exit();
}

// Initialize database and user model
$database = new Database();
$db = $database->getConnection();
$user = new User($db);

// Attempt signup
$result = $user->signup($data->username, $data->email, $data->password);

if ($result['success']) {
    http_response_code(201);
    echo json_encode($result);
} else {
    http_response_code(409);
    echo json_encode($result);
}
