<?php
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$fullName = trim($data['fullName'] ?? '');
$email = trim($data['email'] ?? '');
$mobileNumber = trim($data['mobileNumber'] ?? '');
$password = $data['password'] ?? '';
$roleName = ucfirst(strtolower($data['role'] ?? 'worker')); // 'Worker' or 'Employer'
$barangay = trim($data['barangay'] ?? 'Not specified');

if (!$fullName || !$email || !$mobileNumber || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Please enter a valid email address."]);
    exit();
}

if (!in_array($roleName, ['Worker', 'Employer'])) {
    $roleName = 'Worker';
}

// Check if mobile number or email already exists
$check = $conn->prepare("SELECT user_id FROM USERS WHERE mobile_no = ? OR email = ?");
$check->bind_param("ss", $mobileNumber, $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["error" => "An account with this mobile number or email already exists."]);
    exit();
}
$check->close();

// Look up the role_id for this role name
$roleStmt = $conn->prepare("SELECT role_id FROM ROLE WHERE role_name = ?");
$roleStmt->bind_param("s", $roleName);
$roleStmt->execute();
$roleResult = $roleStmt->get_result();

if ($roleResult->num_rows === 0) {
    http_response_code(500);
    echo json_encode(["error" => "Role '$roleName' not found. Did you run seed.sql?"]);
    exit();
}
$roleRow = $roleResult->fetch_assoc();
$roleId = $roleRow['role_id'];
$roleStmt->close();

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$conn->begin_transaction();

try {
    // Insert into USERS (the parent table)
    $stmt = $conn->prepare(
        "INSERT INTO USERS (role_id, full_name, email, mobile_no, password_hash, barangay, is_verified, status)
         VALUES (?, ?, ?, ?, ?, ?, FALSE, 'Active')"
    );
    $stmt->bind_param("isssss", $roleId, $fullName, $email, $mobileNumber, $hashedPassword, $barangay);
    $stmt->execute();
    $userId = $stmt->insert_id;
    $stmt->close();

    // Insert into the correct subtype table
    if ($roleName === 'Worker') {
        // Default to the seeded "General Labor" category for now
        $catResult = $conn->query("SELECT category_id FROM SERVICE_CATEGORY LIMIT 1");
        $catRow = $catResult->fetch_assoc();
        $categoryId = $catRow['category_id'] ?? null;

        if (!$categoryId) {
            throw new Exception("No SERVICE_CATEGORY found. Did you run seed.sql?");
        }

        $subStmt = $conn->prepare(
            "INSERT INTO WORKER_PROFILE (worker_id, user_id, primary_category_id) VALUES (?, ?, ?)"
        );
        $subStmt->bind_param("iii", $userId, $userId, $categoryId);
        $subStmt->execute();
        $subStmt->close();
    } else {
        $subStmt = $conn->prepare(
            "INSERT INTO EMPLOYER_PROFILE (employer_id, user_id) VALUES (?, ?)"
        );
        $subStmt->bind_param("ii", $userId, $userId);
        $subStmt->execute();
        $subStmt->close();
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "userId" => $userId,
        "role" => $roleName,
        "message" => "Account created. Pending verification."
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => "Failed to create account: " . $e->getMessage()]);
}

$conn->close();