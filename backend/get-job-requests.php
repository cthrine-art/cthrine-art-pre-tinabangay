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

// TODO: confirm your `job_requests` table's actual column names — this
// assumes request_id, job_id, worker_id, status, created_at, joined
// against `jobs` for title/barangay/price.
try {
    $stmt = $conn->prepare(
        "SELECT jr.request_id, jr.status, jr.created_at, j.title, j.barangay, j.price
         FROM job_requests jr
         JOIN jobs j ON jr.job_id = j.job_id
         WHERE jr.worker_id = ?
         ORDER BY jr.created_at DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = [
            "requestId" => (int) $row['request_id'],
            "status" => $row['status'],
            "createdAt" => $row['created_at'],
            "jobTitle" => $row['title'],
            "barangay" => $row['barangay'],
            "price" => $row['price'],
        ];
    }

    echo json_encode(["requests" => $requests]);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Could not load requests — check that `job_requests` has columns request_id, job_id, worker_id, status, created_at, and that `jobs` has job_id, title, barangay, price. Details: " . $e->getMessage()
    ]);
}

$conn->close();