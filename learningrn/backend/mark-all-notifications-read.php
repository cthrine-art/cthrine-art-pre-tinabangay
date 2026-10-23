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

$userId = isset($input['userId'])
    ? intval($input['userId'])
    : 0;

if ($userId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid user ID."
    ]);

    exit();
}

$stmt = $conn->prepare("
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
      AND is_read = 0
");

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare notification update."
    ]);

    exit();
}

$stmt->bind_param("i", $userId);

if (!$stmt->execute()) {
    $stmt->close();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to mark notifications as read."
    ]);

    exit();
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "message" => "All notifications marked as read."
]);

?>