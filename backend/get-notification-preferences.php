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

$stmt = $conn->prepare(
    "SELECT job_matches, request_updates, messages FROM notification_preferences WHERE user_id = ?"
);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {

    echo json_encode([
        "jobMatches" => true,
        "requestUpdates" => true,
        "messages" => true,
    ]);
    exit();
}

$row = $result->fetch_assoc();
$stmt->close();

echo json_encode([
    "jobMatches" => (bool) $row['job_matches'],
    "requestUpdates" => (bool) $row['request_updates'],
    "messages" => (bool) $row['messages'],
]);

$conn->close();