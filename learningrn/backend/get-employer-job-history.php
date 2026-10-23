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

$employerId = isset($_GET['employerId'])
    ? intval($_GET['employerId'])
    : 0;

if ($employerId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid employer ID."
    ]);

    exit();
}

$stmt = $conn->prepare("
    SELECT
        j.job_id,
        j.title,
        j.description,
        j.budget,
        j.location,
        j.job_type,
        j.status,
        j.created_at,
        j.expires_at,

        jc.category_name,

        ja.worker_id,

        u.full_name AS worker_name

    FROM jobs j

    LEFT JOIN job_category jc
        ON jc.job_category_id = j.category_id

    LEFT JOIN job_applications ja
        ON ja.job_id = j.job_id
        AND ja.status = 'Accepted'

    LEFT JOIN users u
        ON u.user_id = ja.worker_id

    WHERE j.employer_id = ?
      AND j.status IN ('Filled', 'Closed', 'Expired')

    ORDER BY j.created_at DESC
");

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare job history query."
    ]);

    exit();
}

$stmt->bind_param(
    "i",
    $employerId
);

if (!$stmt->execute()) {
    $stmt->close();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve job history."
    ]);

    exit();
}

$result = $stmt->get_result();

$jobs = [];

while ($row = $result->fetch_assoc()) {

    $jobs[] = [
        "id" => intval($row["job_id"]),

        "title" => $row["title"],

        "description" =>
            $row["description"],

        "workerId" =>
            $row["worker_id"] !== null
                ? intval($row["worker_id"])
                : null,

        "worker" =>
            $row["worker_name"]
                ?? "No worker assigned",

        "service" =>
            $row["category_name"]
                ?? "General Labor",

        "location" =>
            $row["location"],

        "budget" =>
            floatval($row["budget"]),

        "jobType" =>
            $row["job_type"],

        "status" =>
            $row["status"],

        "date" =>
            $row["created_at"],

        "expiresAt" =>
            $row["expires_at"]
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "jobs" => $jobs
]);

?>