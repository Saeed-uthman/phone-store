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
if (empty($data->email)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit();
}

// Validate email format
if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit();
}

// Initialize database and user model
$database = new Database();
$db = $database->getConnection();
$user = new User($db);

// Check if email exists
$result = $user->getByEmail($data->email);

if ($result) {
    // Generate reset token (in production, store this in database with expiry)
    $reset_token = bin2hex(random_bytes(32));
    
    // TODO: Store reset token in database
    // TODO: Send email with reset link
    // For now, we'll just return success
    
    // In production, you would:
    // 1. Store the token in a password_resets table with user_id and expiry
    // 2. Send an email with a link like: https://yoursite.com/reset-password?token=xxx
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "If an account exists with this email, you will receive password reset instructions."
    ]);
} else {
    // Return same message for security (don't reveal if email exists)
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "If an account exists with this email, you will receive password reset instructions."
    ]);
}
