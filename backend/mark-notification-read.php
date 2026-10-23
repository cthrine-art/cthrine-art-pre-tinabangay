<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);
$notificationId = $data['notificationId'] ?? null;

if (!$notificationId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing notificationId."]);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ?");
    $stmt->bind_param("i", $notificationId);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true]);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Could not update notification. Details: " . $e->getMessage()]);
}

$conn->close();