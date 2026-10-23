<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data['userId'] ?? null;
$jobMatches = !empty($data['jobMatches']) ? 1 : 0;
$requestUpdates = !empty($data['requestUpdates']) ? 1 : 0;
$messages = !empty($data['messages']) ? 1 : 0;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing userId."]);
    exit();
}

$stmt = $conn->prepare(
    "INSERT INTO notification_preferences (user_id, job_matches, request_updates, messages)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        job_matches = VALUES(job_matches),
        request_updates = VALUES(request_updates),
        messages = VALUES(messages)"
);
$stmt->bind_param("iiii", $userId, $jobMatches, $requestUpdates, $messages);
$stmt->execute();
$stmt->close();

echo json_encode(["success" => true]);

$conn->close();