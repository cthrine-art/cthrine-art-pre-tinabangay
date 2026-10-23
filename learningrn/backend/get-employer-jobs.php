get-employer-jobs.php


<?php

header('Content-Type: application/json');

require_once 'db.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;

if ($userId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid employer user ID."
    ]);

    exit();
}

$sql = "
    SELECT
        j.job_id,
        j.title,
        j.description,
        j.budget,
        j.location,
        j.latitude,
        j.longitude,
        j.job_type,
        j.status,
        j.created_at,
        j.expires_at,
        jc.category_name,

        (
            SELECT COUNT(*)
            FROM job_applications ja
            WHERE ja.job_id = j.job_id
        ) AS applicant_count

    FROM jobs j

    LEFT JOIN job_category jc
        ON j.category_id = jc.job_category_id

    WHERE j.employer_id = ?

    ORDER BY j.created_at DESC
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to prepare database query."
    ]);

    exit();
}

$stmt->bind_param("i", $userId);

$stmt->execute();

$result = $stmt->get_result();

$jobs = [];

while ($row = $result->fetch_assoc()) {
    $jobs[] = [
        "id" => (int) $row["job_id"],
        "title" => $row["title"],
        "description" => $row["description"],
        "budget" => (float) $row["budget"],
        "location" => $row["location"],
        "latitude" => $row["latitude"] !== null
            ? (float) $row["latitude"]
            : null,
        "longitude" => $row["longitude"] !== null
            ? (float) $row["longitude"]
            : null,
        "jobType" => $row["job_type"],
        "status" => $row["status"],
        "categoryName" => $row["category_name"] ?? "",
        "applicants" => (int) $row["applicant_count"],
        "createdAt" => $row["created_at"],
        "expiresAt" => $row["expires_at"]
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "jobs" => $jobs
]);
?>