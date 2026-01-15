<?php
/**
 * JWT Token Handler
 * Simple JWT implementation for authentication
 */

class JWT {
    private static $secret_key = "your_secret_key_change_this_in_production";
    private static $algorithm = "HS256";

    // Generate JWT token
    public static function generate($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);
        $payload['iat'] = time();
        $payload['exp'] = time() + (60 * 60 * 24); // 24 hours expiry
        $payload = json_encode($payload);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    // Validate JWT token
    public static function validate($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $parts;

        $validSignature = hash_hmac('sha256', $header . "." . $payload, self::$secret_key, true);
        $validSignature = self::base64UrlEncode($validSignature);

        if ($signature !== $validSignature) {
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($payload), true);
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    // Get token from Authorization header
    public static function getTokenFromHeader() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $matches = [];
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

// Middleware to check authentication
function requireAuth() {
    $token = JWT::getTokenFromHeader();
    if (!$token) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Access denied. No token provided."]);
        exit();
    }

    $payload = JWT::validate($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid or expired token."]);
        exit();
    }

    return $payload;
}
