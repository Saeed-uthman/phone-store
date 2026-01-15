<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $email;
    public $password;
    public $role;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Login user
    public function login($username, $password) {
        $query = "SELECT id, username, email, password, role FROM " . $this->table_name . " 
                  WHERE username = :username OR email = :username LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($password, $row['password'])) {
                return [
                    'id' => $row['id'],
                    'username' => $row['username'],
                    'email' => $row['email'],
                    'role' => $row['role']
                ];
            }
        }
        return false;
    }

    // Register new user
    public function signup($username, $email, $password) {
        // Check if username exists
        $check_query = "SELECT id FROM " . $this->table_name . " WHERE username = :username";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(":username", $username);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            return ["success" => false, "message" => "Username already exists"];
        }

        // Check if email exists
        $check_query = "SELECT id FROM " . $this->table_name . " WHERE email = :email";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(":email", $email);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            return ["success" => false, "message" => "Email already registered"];
        }

        // Insert new user
        $query = "INSERT INTO " . $this->table_name . " (username, email, password, role) 
                  VALUES (:username, :email, :password, 'staff')";
        
        $stmt = $this->conn->prepare($query);
        
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password", $hashed_password);
        
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Account created successfully"];
        }
        
        return ["success" => false, "message" => "Unable to create account"];
    }

    // Get user by email for password reset
    public function getByEmail($email) {
        $query = "SELECT id, username, email FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Update password
    public function updatePassword($email, $password) {
        $query = "UPDATE " . $this->table_name . " SET password = :password WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":email", $email);
        
        return $stmt->execute();
    }
}
