<?php

header('Content-Type: application/json');

require_once 'db.php';

$userId = isset($_GET['userId'])
    ? (int) $_GET['userId']
    : 0;

$employerId = isset($_GET['employerId'])
    ? (int) $_GET['employerId']
    : 0;


/*
|--------------------------------------------------------------------------
| GET EMPLOYER ID
|--------------------------------------------------------------------------
| If employerId was not provided, use the logged-in user's userId
| to find the corresponding employer profile.
*/

if ($employerId <= 0 && $userId > 0) {

    $profileStmt = $conn->prepare("
        SELECT employer_id
        FROM EMPLOYER_PROFILE
        WHERE user_id = ?
        LIMIT 1
    ");

    if (!$profileStmt) {
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "error" => "Failed to find employer profile.",
            "details" => $conn->error
        ]);

        exit();
    }

    $profileStmt->bind_param("i", $userId);
    $profileStmt->execute();

    $profileResult = $profileStmt->get_result();

    if ($profileResult->num_rows > 0) {

        $profileRow = $profileResult->fetch_assoc();

        $employerId = (int) $profileRow["employer_id"];

    }

    $profileStmt->close();
}


/*
|--------------------------------------------------------------------------
| INVALID EMPLOYER
|--------------------------------------------------------------------------
*/

if ($employerId <= 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Employer profile not found."
    ]);

    $conn->close();

    exit();
}


/*
|--------------------------------------------------------------------------
| GET JOB REQUESTS
|--------------------------------------------------------------------------
*/

$sql = "
    SELECT
        jr.request_id,
        jr.job_id,
        jr.employer_id,
        jr.worker_id,
        jr.request_note,
        jr.status,
        jr.requested_at,

        u.full_name AS worker_name,
        u.email AS worker_email,

        j.title AS job_title

    FROM job_requests jr

    INNER JOIN worker_profile wp
        ON jr.worker_id = wp.worker_id

    INNER JOIN users u
        ON wp.user_id = u.user_id

    INNER JOIN jobs j
        ON jr.job_id = j.job_id

    WHERE jr.employer_id = ?

    ORDER BY jr.requested_at DESC
";


$stmt = $conn->prepare($sql);

if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to prepare database query.",
        "details" => $conn->error
    ]);

    $conn->close();

    exit();
}


$stmt->bind_param("i", $employerId);


if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to retrieve job requests.",
        "details" => $stmt->error
    ]);

    $stmt->close();
    $conn->close();

    exit();
}


$result = $stmt->get_result();

$requests = [];


/*
|--------------------------------------------------------------------------
| BUILD REQUEST LIST
|--------------------------------------------------------------------------
*/

while ($row = $result->fetch_assoc()) {

    $requests[] = [

        "requestId" => (int) $row["request_id"],

        "jobId" => (int) $row["job_id"],

        "workerId" => (int) $row["worker_id"],

        "workerName" => $row["worker_name"] ?? "",

        "workerEmail" => $row["worker_email"] ?? "",

        "jobTitle" => $row["job_title"] ?? "",

        "message" => $row["request_note"] ?? "",

        "status" => $row["status"] ?? "Pending",

        "requestedAt" => $row["requested_at"] ?? ""
    ];
}


$stmt->close();
$conn->close();


/*
|--------------------------------------------------------------------------
| RETURN RESULT
|--------------------------------------------------------------------------
|
| If there are NO requests:
|
| {
|   "success": true,
|   "requests": []
| }
|
| This is NOT an error.
|
*/

echo json_encode([
    "success" => true,
    "requests" => $requests
]);

?>