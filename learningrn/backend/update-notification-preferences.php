<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$userId = isset($data['userId'])
    ? (int) $data['userId']
    : 0;

$jobMatches = !empty($data['jobMatches']) ? 1 : 0;
$requestUpdates = !empty($data['requestUpdates']) ? 1 : 0;
$messages = !empty($data['messages']) ? 1 : 0;

if ($userId <= 0) {
    http_response_code(400);

    echo json_encode([
        "error" => "Invalid user ID."
    ]);

    exit();
}

try {

    /*
     * Check whether the user already has a preference record.
     */
    $check = $conn->prepare(
        "SELECT user_id
         FROM notification_preferences
         WHERE user_id = ?
         LIMIT 1"
    );

    $check->bind_param("i", $userId);
    $check->execute();

    $result = $check->get_result();

    if ($result->num_rows === 0) {

        /*
         * First save.
         */
        $stmt = $conn->prepare(
            "INSERT INTO notification_preferences
                (user_id, job_matches, request_updates, messages)
             VALUES (?, ?, ?, ?)"
        );

        $stmt->bind_param(
            "iiii",
            $userId,
            $jobMatches,
            $requestUpdates,
            $messages
        );

    } else {

        /*
         * Update existing preferences.
         */
        $stmt = $conn->prepare(
            "UPDATE notification_preferences
             SET
                job_matches = ?,
                request_updates = ?,
                messages = ?
             WHERE user_id = ?"
        );

        $stmt->bind_param(
            "iiii",
            $jobMatches,
            $requestUpdates,
            $messages,
            $userId
        );
    }

    $check->close();

    if (!$stmt->execute()) {

        $stmt->close();

        http_response_code(500);

        echo json_encode([
            "error" => "Failed to save notification preferences."
        ]);

        exit();
    }

    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Notification preferences updated successfully."
    ]);

} catch (mysqli_sql_exception $e) {

    http_response_code(500);

    echo json_encode([
        "error" => "Could not update notification preferences.",
        "details" => $e->getMessage()
    ]);
}

$conn->close(); 
?>