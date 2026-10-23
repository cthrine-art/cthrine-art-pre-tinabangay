<?php

header('Content-Type: application/json');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);

    exit();
}

$input = json_decode(
    file_get_contents("php://input"),
    true
);

$notificationId = isset($input['notificationId'])
    ? intval($input['notificationId'])
    : 0;

$userId = isset($input['userId'])
    ? intval($input['userId'])
    : 0;

if ($notificationId <= 0 || $userId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid notification or user ID."
    ]);

    exit();
}

$stmt = $conn->prepare("
    DELETE FROM notifications
    WHERE notification_id = ?
      AND user_id = ?
");

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare notification deletion."
    ]);

    exit();
}

$stmt->bind_param(
    "ii",
    $notificationId,
    $userId
);

if (!$stmt->execute()) {
    $stmt->close();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to delete notification."
    ]);

    exit();
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "message" => "Notification deleted successfully."
]);

?>