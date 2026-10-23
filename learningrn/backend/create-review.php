<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);

    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$jobId = isset($data["jobId"])
    ? intval($data["jobId"])
    : 0;

$employerId = isset($data["employerId"])
    ? intval($data["employerId"])
    : 0;

$workerId = isset($data["workerId"])
    ? intval($data["workerId"])
    : 0;

$rating = isset($data["rating"])
    ? intval($data["rating"])
    : 0;

$reviewText = isset($data["reviewText"])
    ? trim($data["reviewText"])
    : "";


// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

if ($jobId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Job ID is required."
    ]);

    exit();
}

if ($employerId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Employer ID is required."
    ]);

    exit();
}

if ($workerId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Worker ID is required."
    ]);

    exit();
}

if ($rating < 1 || $rating > 5) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Rating must be between 1 and 5."
    ]);

    exit();
}

if ($reviewText === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Review text is required."
    ]);

    exit();
}


// --------------------------------------------------
// VERIFY EMPLOYER
// --------------------------------------------------

$employerSql = "
    SELECT user_id
    FROM users
    WHERE user_id = ?
      AND role_id = 2
      AND status = 'Active'
    LIMIT 1
";

$employerStmt = $conn->prepare($employerSql);

if (!$employerStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to verify employer."
    ]);

    exit();
}

$employerStmt->bind_param("i", $employerId);
$employerStmt->execute();

$employerResult = $employerStmt->get_result();

if ($employerResult->num_rows === 0) {

    $employerStmt->close();

    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Invalid or inactive employer account."
    ]);

    exit();
}

$employerStmt->close();


// --------------------------------------------------
// VERIFY JOB
// --------------------------------------------------

$jobSql = "
    SELECT
        job_id,
        employer_id,
        status
    FROM jobs
    WHERE job_id = ?
      AND employer_id = ?
    LIMIT 1
";

$jobStmt = $conn->prepare($jobSql);

if (!$jobStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to verify job."
    ]);

    exit();
}

$jobStmt->bind_param("ii", $jobId, $employerId);
$jobStmt->execute();

$jobResult = $jobStmt->get_result();

if ($jobResult->num_rows === 0) {

    $jobStmt->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Job not found or does not belong to this employer."
    ]);

    exit();
}

$job = $jobResult->fetch_assoc();

$jobStmt->close();


// --------------------------------------------------
// VERIFY WORKER
// --------------------------------------------------

$workerSql = "
    SELECT
        worker_id
    FROM worker_profile
    WHERE worker_id = ?
    LIMIT 1
";

$workerStmt = $conn->prepare($workerSql);

if (!$workerStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to verify worker."
    ]);

    exit();
}

$workerStmt->bind_param("i", $workerId);
$workerStmt->execute();

$workerResult = $workerStmt->get_result();

if ($workerResult->num_rows === 0) {

    $workerStmt->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Worker not found."
    ]);

    exit();
}

$workerStmt->close();


// --------------------------------------------------
// CHECK IF REVIEW ALREADY EXISTS
// --------------------------------------------------

$checkSql = "
    SELECT rating_id
    FROM ratings_reviews
    WHERE job_id = ?
      AND employer_id = ?
      AND worker_id = ?
    LIMIT 1
";

$checkStmt = $conn->prepare($checkSql);

if (!$checkStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to check existing review."
    ]);

    exit();
}

$checkStmt->bind_param(
    "iii",
    $jobId,
    $employerId,
    $workerId
);

$checkStmt->execute();

$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {

    $checkStmt->close();

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "You have already reviewed this worker for this job."
    ]);

    exit();
}

$checkStmt->close();


// --------------------------------------------------
// INSERT REVIEW
// --------------------------------------------------

$insertSql = "
    INSERT INTO ratings_reviews
    (
        job_id,
        employer_id,
        worker_id,
        rating,
        review_text
    )
    VALUES (?, ?, ?, ?, ?)
";

$insertStmt = $conn->prepare($insertSql);

if (!$insertStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare review insertion."
    ]);

    exit();
}

$insertStmt->bind_param(
    "iiiis",
    $jobId,
    $employerId,
    $workerId,
    $rating,
    $reviewText
);

if (!$insertStmt->execute()) {

    $insertStmt->close();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to save review."
    ]);

    exit();
}

$ratingId = $insertStmt->insert_id;

$insertStmt->close();


// --------------------------------------------------
// UPDATE WORKER AVERAGE RATING
// --------------------------------------------------

$averageSql = "
    SELECT AVG(rating) AS average_rating
    FROM ratings_reviews
    WHERE worker_id = ?
";

$averageStmt = $conn->prepare($averageSql);

if ($averageStmt) {

    $averageStmt->bind_param("i", $workerId);
    $averageStmt->execute();

    $averageResult = $averageStmt->get_result();

    $averageRow = $averageResult->fetch_assoc();

    $averageRating = $averageRow["average_rating"] !== null
        ? round(floatval($averageRow["average_rating"]), 2)
        : 0;

    $averageStmt->close();

    // Update worker profile average rating
    $updateSql = "
        UPDATE worker_profile
        SET average_rating = ?
        WHERE worker_id = ?
    ";

    $updateStmt = $conn->prepare($updateSql);

    if ($updateStmt) {

        $updateStmt->bind_param(
            "di",
            $averageRating,
            $workerId
        );

        $updateStmt->execute();
        $updateStmt->close();
    }
}


// --------------------------------------------------
// SEND NOTIFICATION TO WORKER
// --------------------------------------------------

$notificationMessage =
    "You received a {$rating}-star rating and review from an employer.";

$notificationType = "Application";

$notificationSql = "
    INSERT INTO notifications
    (
        user_id,
        job_id,
        message,
        notification_type,
        is_read
    )
    VALUES (?, ?, ?, ?, 0)
";

$notificationStmt = $conn->prepare($notificationSql);

if ($notificationStmt) {

    // worker_profile.worker_id is the worker identifier.
    // Find the corresponding user_id first.

    $workerUserSql = "
        SELECT user_id
        FROM worker_profile
        WHERE worker_id = ?
        LIMIT 1
    ";

    $workerUserStmt = $conn->prepare($workerUserSql);

    if ($workerUserStmt) {

        $workerUserStmt->bind_param(
            "i",
            $workerId
        );

        $workerUserStmt->execute();

        $workerUserResult =
            $workerUserStmt->get_result();

        if ($workerUserResult->num_rows > 0) {

            $workerUser = $workerUserResult->fetch_assoc();

            $workerUserId =
                intval($workerUser["user_id"]);

            $notificationStmt->bind_param(
                "iiss",
                $workerUserId,
                $jobId,
                $notificationMessage,
                $notificationType
            );

            $notificationStmt->execute();
        }

        $workerUserStmt->close();
    }

    $notificationStmt->close();
}


// --------------------------------------------------
// RESPONSE
// --------------------------------------------------

echo json_encode([
    "success" => true,
    "message" => "Review submitted successfully.",
    "ratingId" => intval($ratingId)
]);

$conn->close();

?>