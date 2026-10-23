<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

$userId = $_GET['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode([
        "error" => "Missing userId."
    ]);
    exit();
}

try {

    $stmt = $conn->prepare("
        SELECT
            jc.completion_id,
            jc.hiring_id,
            jc.completed_by,
            jc.completion_date,
            jc.employer_confirmed,
            jc.worker_confirmed,
            jc.remarks,

            j.job_id,
            j.title,
            j.description,
            j.location,
            j.budget,
            j.job_type

        FROM job_completion jc

        INNER JOIN hiring h
            ON jc.hiring_id = h.hiring_id

        INNER JOIN jobs j
            ON h.job_id = j.job_id

        WHERE h.worker_id = ?

        ORDER BY jc.completion_date DESC
    ");

    $stmt->bind_param("i", $userId);
    $stmt->execute();

    $result = $stmt->get_result();

    $history = [];

    while ($row = $result->fetch_assoc()) {

        $history[] = [
            "completionId" => (int)$row["completion_id"],
            "hiringId" => (int)$row["hiring_id"],
            "jobId" => (int)$row["job_id"],

            "title" => $row["title"],
            "description" => $row["description"],
            "location" => $row["location"],
            "budget" => $row["budget"],
            "jobType" => $row["job_type"],

            "completionDate" => $row["completion_date"],

            "employerConfirmed" => (bool)$row["employer_confirmed"],
            "workerConfirmed" => (bool)$row["worker_confirmed"],

            "remarks" => $row["remarks"]
        ];
    }

    echo json_encode([
        "success" => true,
        "history" => $history
    ]);

    $stmt->close();

} catch (mysqli_sql_exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Could not load history.",
        "details" => $e->getMessage()
    ]);
}

$conn->close();

?>