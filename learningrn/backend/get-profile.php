<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$userId = $_GET['userId'] ?? null;

if ($userId === null) {
    http_response_code(400);
    echo json_encode(["error" => "Missing userId."]);
    exit();
}

// The hardcoded admin account (see login.php) has no row in `users`, so
// there's nothing in the database to fetch — return a static, read-only
// profile instead of querying.
if ((int) $userId === 0) {
    echo json_encode([
        "userId" => 0,
        "fullName" => "System Admin",
        "email" => null,
        "mobileNo" => null,
        "barangay" => null,
        "role" => "Admin",
        "isVerified" => true,
        "editable" => false,
    ]);
    exit();
}

$stmt = $conn->prepare(
    "SELECT u.full_name, u.email, u.mobile_no, u.barangay, u.is_verified, r.role_name
     FROM users u
     JOIN role r ON u.role_id = r.role_id
     WHERE u.user_id = ?"
);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "User not found."]);
    exit();
}

$row = $result->fetch_assoc();
$stmt->close();

echo json_encode([
    "userId" => (int) $userId,
    "fullName" => $row['full_name'],
    "email" => $row['email'],
    "mobileNo" => $row['mobile_no'],
    "barangay" => $row['barangay'],
    "role" => $row['role_name'],
    "isVerified" => (bool) $row['is_verified'],
    "editable" => true,
]);

$conn->close();