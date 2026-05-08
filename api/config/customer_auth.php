<?php
require_once __DIR__ . '/jwt.php';

function requireCustomerAuth() {
    $payload = requireAuth();
    $role = isset($payload['role']) ? strtolower((string)$payload['role']) : '';
    $customer_id = isset($payload['customer_id']) ? (int)$payload['customer_id'] : 0;

    if ($role !== 'customer' || $customer_id <= 0) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized customer token"]);
        exit();
    }

    return $payload;
}

function getOptionalCustomerAuth() {
    $token = JWT::getTokenFromHeader();
    if (!$token) {
        return null;
    }

    $payload = JWT::validate($token);
    if (!$payload) {
        return null;
    }

    $role = isset($payload['role']) ? strtolower((string)$payload['role']) : '';
    $customer_id = isset($payload['customer_id']) ? (int)$payload['customer_id'] : 0;
    if ($role !== 'customer' || $customer_id <= 0) {
        return null;
    }

    return $payload;
}
