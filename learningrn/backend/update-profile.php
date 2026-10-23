<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data['userId'] ?? null;
$fullName = trim($data['fullName'] ?? '');
$email = trim($data['email'] ?? '');
$mobileNo = trim($data['mobileNo'] ?? '');
$barangay = trim($data['barangay'] ?? '');

if ($userId === null) {
    http_response_code(400);
    echo json_encode(["error" => "Missing userId."]);
    exit();
}

if ((int) $userId === 0) {
    http_response_code(400);
    echo json_encode([
        "error" => "The built-in admin account isn't stored in the database yet, so its profile can't be edited here."
    ]);
    exit();
}

if (!$fullName || !$email || !$mobileNo) {
    http_response_code(400);
    echo json_encode(["error" => "Full name, email, and mobile number are required."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Please enter a valid email address."]);
    exit();
}

// Make sure the new email/mobile number isn't already used by someone else
$check = $conn->prepare(
    "SELECT user_id FROM users WHERE (email = ? OR mobile_no = ?) AND user_id != ?"
);
$check->bind_param("ssi", $email, $mobileNo, $userId);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["error" => "Another account already uses this email or mobile number."]);
    exit();
}
$check->close();

$stmt = $conn->prepare(
    "UPDATE users SET full_name = ?, email = ?, mobile_no = ?, barangay = ? WHERE user_id = ?"
);
$stmt->bind_param("ssssi", $fullName, $email, $mobileNo, $barangay, $userId);
$stmt->execute();
$stmt->close();

echo json_encode([
    "success" => true,
    "fullName" => $fullName,
    "email" => $email,
    "mobileNo" => $mobileNo,
    "barangay" => $barangay,
]);

$conn->close();