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

// TODO: confirm your `job_completion` table's actual column names — this
// assumes completion_id, job_id, worker_id, completed_at, rating, feedback.
try {
    $stmt = $conn->prepare(
        "SELECT jc.completion_id, jc.completed_at, jc.rating, jc.feedback,
                j.title, j.barangay, j.price
         FROM job_completion jc
         JOIN jobs j ON jc.job_id = j.job_id
         WHERE jc.worker_id = ?
         ORDER BY jc.completed_at DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $history = [];
    while ($row = $result->fetch_assoc()) {
        $history[] = [
            "completionId" => (int) $row['completion_id'],
            "completedAt" => $row['completed_at'],
            "rating" => $row['rating'] !== null ? (float) $row['rating'] : null,
            "feedback" => $row['feedback'],
            "jobTitle" => $row['title'],
            "barangay" => $row['barangay'],
            "price" => $row['price'],
        ];
    }

    echo json_encode(["history" => $history]);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Could not load history — check that `job_completion` has columns completion_id, job_id, worker_id, completed_at, rating, feedback. Details: " . $e->getMessage()
    ]);
}

$conn->close();