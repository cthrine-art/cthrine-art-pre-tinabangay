<?php
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$identifier = trim($data['identifier'] ?? ''); // mobile number, or "admin"
$password = $data['password'] ?? '';

if (!$identifier || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username/mobile number or password."]);
    exit();
}

// Fixed admin account for the platform administrator, per project spec.
// This account is not stored in the USERS table — it's a single hardcoded
// login used for demoing/testing the admin dashboard.
if (strtolower($identifier) === 'admin' && $password === 'admin123') {
    echo json_encode([
        "success" => true,
        "userId" => 0,
        "fullName" => "System Admin",
        "role" => "Admin",
        "isVerified" => true,
    ]);
    exit();
}

// Everyone else logs in with their email (see register.php).
$stmt = $conn->prepare(
    "SELECT u.user_id, u.full_name, u.password_hash, u.is_verified, u.status, r.role_name
     FROM USERS u
     JOIN ROLE r ON u.role_id = r.role_id
     WHERE LOWER(u.email) = LOWER(?)"
);
$stmt->bind_param("s", $identifier);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["error" => "No account found with that email."]);
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();

if (!password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(["error" => "Incorrect password."]);
    exit();
}

if ($user['status'] !== 'Active') {
    http_response_code(403);
    echo json_encode(["error" => "This account is not active."]);
    exit();
}

echo json_encode([
    "success" => true,
    "userId" => (int) $user['user_id'],
    "fullName" => $user['full_name'],
    "role" => $user['role_name'],
    "isVerified" => (bool) $user['is_verified'],
]);

$conn->close();