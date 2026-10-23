<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

try {

    $stmt = $conn->prepare("
        SELECT
            job_id,
            title,
            description,
            budget,
            location,
            job_type,
            status,
            created_at,
            expires_at
        FROM jobs
        WHERE UPPER(status) = 'OPEN'
        ORDER BY created_at DESC
    ");

    $stmt->execute();

    $result = $stmt->get_result();

    $jobs = [];

    while ($row = $result->fetch_assoc()) {

        $tags = [];

        /*
         * Use the real job_type from the database.
         */
        if (!empty($row['job_type'])) {
            $tags[] = strtoupper($row['job_type']);
        }

        $jobs[] = [
            "id" => (string) $row['job_id'],
            "title" => $row['title'],
            "description" => $row['description'],
            "location" => $row['location'],
            "price" => $row['budget'] !== null
                ? '₱' . number_format((float) $row['budget'], 2)
                : 'Negotiable',
            "budget" => $row['budget'],
            "jobType" => $row['job_type'],
            "status" => strtoupper($row['status']),
            "tags" => $tags,
            "createdAt" => $row['created_at'],
            "expiresAt" => $row['expires_at']
        ];
    }

    echo json_encode([
        "success" => true,
        "jobs" => $jobs
    ]);

    $stmt->close();

} catch (mysqli_sql_exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Could not load jobs.",
        "details" => $e->getMessage()
    ]);
}

$conn->close();

?>