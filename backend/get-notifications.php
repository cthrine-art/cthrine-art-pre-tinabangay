<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$userId = $_GET['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing userId."]);
    exit();
}

// TODO: confirm your `notifications` table's actual column names — this
// assumes notification_id, user_id, title, message, is_read, created_at.
try {
    $stmt = $conn->prepare(
        "SELECT notification_id, title, message, is_read, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            "notificationId" => (int) $row['notification_id'],
            "title" => $row['title'],
            "message" => $row['message'],
            "isRead" => (bool) $row['is_read'],
            "createdAt" => $row['created_at'],
        ];
    }

    echo json_encode(["notifications" => $notifications]);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Could not load notifications — check that the `notifications` table has columns notification_id, user_id, title, message, is_read, created_at. Details: " . $e->getMessage()
    ]);
}

$conn->close();