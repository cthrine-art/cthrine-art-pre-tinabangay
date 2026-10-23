create-job-request.php


<?php

header('Content-Type: application/json');

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$employerId = isset($data['employerId'])
    ? (int) $data['employerId']
    : 0;

$workerId = isset($data['workerId'])
    ? (int) $data['workerId']
    : 0;

$jobId = isset($data['jobId'])
    ? (int) $data['jobId']
    : 0;

$requestNote = trim($data['requestNote'] ?? '');


// ---------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------

if ($employerId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid employer ID."
    ]);

    exit();
}

if ($workerId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid worker ID."
    ]);

    exit();
}

if ($jobId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid job ID."
    ]);

    exit();
}

if ($requestNote === '') {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Please provide a message or schedule details."
    ]);

    exit();
}


// ---------------------------------------------------------
// VERIFY EMPLOYER
// ---------------------------------------------------------

$sqlEmployer = "
    SELECT
        u.user_id,
        u.full_name,
        u.status,
        r.role_name
    FROM users u
    INNER JOIN role r
        ON u.role_id = r.role_id
    WHERE u.user_id = ?
    LIMIT 1
";

$stmtEmployer = $conn->prepare($sqlEmployer);

if (!$stmtEmployer) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to prepare employer query."
    ]);

    exit();
}

$stmtEmployer->bind_param("i", $employerId);
$stmtEmployer->execute();

$resultEmployer = $stmtEmployer->get_result();

if ($resultEmployer->num_rows === 0) {
    $stmtEmployer->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "error" => "Employer account was not found."
    ]);

    exit();
}

$employer = $resultEmployer->fetch_assoc();

$stmtEmployer->close();

if ($employer['role_name'] !== 'Employer') {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "error" => "Only employer accounts can send job requests."
    ]);

    exit();
}

if ($employer['status'] !== 'Active') {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "error" => "The employer account is not active."
    ]);

    exit();
}


// ---------------------------------------------------------
// VERIFY WORKER
// workerId is worker_profile.worker_id
// ---------------------------------------------------------

$sqlWorker = "
    SELECT
        wp.worker_id,
        wp.user_id,
        u.full_name AS worker_name,
        u.status AS worker_status
    FROM worker_profile wp
    INNER JOIN users u
        ON wp.user_id = u.user_id
    WHERE wp.worker_id = ?
    LIMIT 1
";

$stmtWorker = $conn->prepare($sqlWorker);

if (!$stmtWorker) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to prepare worker query."
    ]);

    exit();
}

$stmtWorker->bind_param("i", $workerId);
$stmtWorker->execute();

$resultWorker = $stmtWorker->get_result();

if ($resultWorker->num_rows === 0) {
    $stmtWorker->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "error" => "Worker was not found."
    ]);

    exit();
}

$worker = $resultWorker->fetch_assoc();

$stmtWorker->close();

if ($worker['worker_status'] !== 'Active') {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "error" => "This worker account is not active."
    ]);

    exit();
}


// ---------------------------------------------------------
// VERIFY JOB
// The job must belong to the employer
// ---------------------------------------------------------

$sqlJob = "
    SELECT
        job_id,
        title,
        status
    FROM jobs
    WHERE job_id = ?
      AND employer_id = ?
    LIMIT 1
";

$stmtJob = $conn->prepare($sqlJob);

if (!$stmtJob) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to prepare job query."
    ]);

    exit();
}

$stmtJob->bind_param(
    "ii",
    $jobId,
    $employerId
);

$stmtJob->execute();

$resultJob = $stmtJob->get_result();

if ($resultJob->num_rows === 0) {
    $stmtJob->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "error" => "The selected job does not belong to this employer."
    ]);

    exit();
}

$job = $resultJob->fetch_assoc();

$stmtJob->close();

if ($job['status'] !== 'Open') {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Only open jobs can be used for a direct job request."
    ]);

    exit();
}


// ---------------------------------------------------------
// CHECK EXISTING PENDING REQUEST
// ---------------------------------------------------------

$sqlExisting = "
    SELECT request_id
    FROM job_requests
    WHERE job_id = ?
      AND employer_id = ?
      AND worker_id = ?
      AND status = 'Pending'
    LIMIT 1
";

$stmtExisting = $conn->prepare($sqlExisting);

if (!$stmtExisting) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to check existing requests."
    ]);

    exit();
}

$stmtExisting->bind_param(
    "iii",
    $jobId,
    $employerId,
    $workerId
);

$stmtExisting->execute();

$resultExisting = $stmtExisting->get_result();

if ($resultExisting->num_rows > 0) {
    $stmtExisting->close();

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "error" => "A pending job request for this worker and job already exists."
    ]);

    exit();
}

$stmtExisting->close();


// ---------------------------------------------------------
// START TRANSACTION
// ---------------------------------------------------------

$conn->begin_transaction();

try {

    // -----------------------------------------------------
    // INSERT JOB REQUEST
    // -----------------------------------------------------

    $sqlRequest = "
        INSERT INTO job_requests
        (
            job_id,
            employer_id,
            worker_id,
            request_note,
            status
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            'Pending'
        )
    ";

    $stmtRequest = $conn->prepare($sqlRequest);

    if (!$stmtRequest) {
        throw new Exception(
            "Failed to prepare job request insertion."
        );
    }

    $stmtRequest->bind_param(
        "iiis",
        $jobId,
        $employerId,
        $workerId,
        $requestNote
    );

    if (!$stmtRequest->execute()) {
        throw new Exception(
            "Failed to create job request."
        );
    }

    $requestId = $stmtRequest->insert_id;

    $stmtRequest->close();


    // -----------------------------------------------------
    // CREATE WORKER NOTIFICATION
    // -----------------------------------------------------

    $notificationMessage =
        "You received a direct job request for \"" .
        $job['title'] .
        "\" from " .
        $employer['full_name'] .
        ".";

    $sqlNotification = "
        INSERT INTO notifications
        (
            user_id,
            job_id,
            message,
            notification_type,
            is_read
        )
        VALUES
        (
            ?,
            ?,
            ?,
            'Request',
            0
        )
    ";

    $stmtNotification =
        $conn->prepare($sqlNotification);

    if (!$stmtNotification) {
        throw new Exception(
            "Failed to prepare notification."
        );
    }

    $stmtNotification->bind_param(
        "iis",
        $worker['user_id'],
        $jobId,
        $notificationMessage
    );

    if (!$stmtNotification->execute()) {
        throw new Exception(
            "Failed to create notification."
        );
    }

    $stmtNotification->close();


    // -----------------------------------------------------
    // COMMIT
    // -----------------------------------------------------

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Job request sent successfully.",
        "requestId" => (int) $requestId
    ]);

} catch (Exception $e) {

    $conn->rollback();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

$conn->close();

?>