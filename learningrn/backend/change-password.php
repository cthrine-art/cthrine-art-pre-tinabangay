<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data['userId'] ?? null;
$currentPassword = $data['currentPassword'] ?? '';
$newPassword = $data['newPassword'] ?? '';

/*
|--------------------------------------------------------------------------
| Validate required fields
|--------------------------------------------------------------------------
*/

if ($userId === null || $currentPassword === '' || $newPassword === '') {
    http_response_code(400);

    echo json_encode([
        "error" => "User ID, current password, and new password are required."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| Built-in admin account
|--------------------------------------------------------------------------
*/

if ((int)$userId === 0) {
    http_response_code(400);

    echo json_encode([
        "error" => "The built-in admin account cannot change its password here."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| Validate new password length
|--------------------------------------------------------------------------
*/

if (strlen($newPassword) < 6) {
    http_response_code(400);

    echo json_encode([
        "error" => "New password must be at least 6 characters long."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| Get current password hash
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare(
    "SELECT password_hash
     FROM users
     WHERE user_id = ?"
);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "error" => "Failed to prepare password query."
    ]);

    exit();
}

$stmt->bind_param("i", $userId);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();

    http_response_code(404);

    echo json_encode([
        "error" => "User not found."
    ]);

    exit();
}

$row = $result->fetch_assoc();

$stmt->close();

$currentPasswordHash = $row['password_hash'];

/*
|--------------------------------------------------------------------------
| Verify current password
|--------------------------------------------------------------------------
*/

if (!password_verify($currentPassword, $currentPasswordHash)) {
    http_response_code(401);

    echo json_encode([
        "error" => "Current password is incorrect."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| Make sure new password is different
|--------------------------------------------------------------------------
*/

if (password_verify($newPassword, $currentPasswordHash)) {
    http_response_code(400);

    echo json_encode([
        "error" => "New password must be different from your current password."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| Hash new password
|--------------------------------------------------------------------------
*/

$newPasswordHash = password_hash(
    $newPassword,
    PASSWORD_DEFAULT
);

/*
|--------------------------------------------------------------------------
| Update password
|--------------------------------------------------------------------------
*/

$update = $conn->prepare(
    "UPDATE users
     SET password_hash = ?
     WHERE user_id = ?"
);

if (!$update) {
    http_response_code(500);

    echo json_encode([
        "error" => "Failed to prepare password update."
    ]);

    exit();
}

$update->bind_param(
    "si",
    $newPasswordHash,
    $userId
);

if (!$update->execute()) {
    $update->close();

    http_response_code(500);

    echo json_encode([
        "error" => "Failed to update password."
    ]);

    exit();
}

$update->close();

/*
|--------------------------------------------------------------------------
| Success
|--------------------------------------------------------------------------
*/

echo json_encode([
    "success" => true,
    "message" => "Password changed successfully."
]);

$conn->close();

?>