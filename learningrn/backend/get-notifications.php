<?php

header('Content-Type: application/json');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
    ]);

    exit();
}

$userId = isset($_GET['userId'])
    ? intval($_GET['userId'])
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
    SELECT
        notification_id,
        user_id,
        job_id,
        message,
        notification_type,
        is_read,
        created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
");

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare notification query."
    ]);

    exit();
}

$stmt->bind_param("i", $userId);

if (!$stmt->execute()) {
    $stmt->close();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve notifications."
    ]);

    exit();
}

$result = $stmt->get_result();

$notifications = [];

while ($row = $result->fetch_assoc()) {

    $notifications[] = [
        "id" => intval($row["notification_id"]),
        "userId" => intval($row["user_id"]),
        "jobId" => $row["job_id"] !== null
            ? intval($row["job_id"])
            : null,
        "message" => $row["message"],
        "notificationType" => $row["notification_type"],
        "isRead" => intval($row["is_read"]),
        "createdAt" => $row["created_at"]
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "notifications" => $notifications
]);

?>