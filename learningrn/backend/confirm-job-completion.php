<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

/*
|--------------------------------------------------------------------------
| GET JSON DATA
|--------------------------------------------------------------------------
*/

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$employerId = $data['employerId'] ?? null;
$jobId = $data['jobId'] ?? null;

/*
|--------------------------------------------------------------------------
| VALIDATE REQUIRED DATA
|--------------------------------------------------------------------------
*/

if ($employerId === null || $jobId === null) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Missing employerId or jobId."
    ]);

    exit();
}

$employerId = (int) $employerId;
$jobId = (int) $jobId;

if ($employerId <= 0 || $jobId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid employer or job information."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| CHECK JOB OWNERSHIP AND CURRENT STATUS
|--------------------------------------------------------------------------
|
| Only the employer who owns the job can confirm completion.
|
*/

$stmt = $conn->prepare(
    "SELECT
        j.job_id,
        j.employer_id,
        j.title,
        j.status
     FROM jobs j
     WHERE j.job_id = ?
       AND j.employer_id = ?
     LIMIT 1"
);

$stmt->bind_param(
    "ii",
    $jobId,
    $employerId
);

$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "error" => "Job not found or you are not authorized to update this job."
    ]);

    exit();
}

$job = $result->fetch_assoc();

$stmt->close();

/*
|--------------------------------------------------------------------------
| MAKE SURE JOB IS CURRENTLY FILLED
|--------------------------------------------------------------------------
|
| A job should only be confirmed as completed after
| an employer has accepted a worker.
|
*/

if ($job['status'] !== 'Filled') {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Only a filled job can be confirmed as completed."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| FIND THE ACCEPTED WORKER
|--------------------------------------------------------------------------
|
| The accepted application identifies the worker who
| completed the service.
|
*/

$stmt = $conn->prepare(
    "SELECT
        ja.worker_id,
        u.full_name
     FROM job_applications ja
     INNER JOIN users u
        ON u.user_id = ja.worker_id
     WHERE ja.job_id = ?
       AND ja.status = 'Accepted'
     LIMIT 1"
);

$stmt->bind_param(
    "i",
    $jobId
);

$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "No accepted worker was found for this job."
    ]);

    exit();
}

$worker = $result->fetch_assoc();

$stmt->close();

$workerId = (int) $worker['worker_id'];
$workerName = $worker['full_name'];
$jobTitle = $job['title'];

/*
|--------------------------------------------------------------------------
| START TRANSACTION
|--------------------------------------------------------------------------
*/

$conn->begin_transaction();

try {

    /*
    |--------------------------------------------------------------------------
    | CHANGE JOB STATUS TO CLOSED
    |--------------------------------------------------------------------------
    |
    | In the existing Tinabangay database:
    |
    | Open    = accepting applications
    | Filled  = worker has been accepted
    | Closed  = job completed
    |
    */

    $updateJob = $conn->prepare(
        "UPDATE jobs
         SET status = 'Closed'
         WHERE job_id = ?
           AND employer_id = ?
           AND status = 'Filled'"
    );

    $updateJob->bind_param(
        "ii",
        $jobId,
        $employerId
    );

    $updateJob->execute();

    if ($updateJob->affected_rows !== 1) {
        $updateJob->close();

        throw new Exception(
            "The job could not be marked as completed."
        );
    }

    $updateJob->close();

    /*
    |--------------------------------------------------------------------------
    | NOTIFY THE WORKER
    |--------------------------------------------------------------------------
    |
    | Your notifications table supports:
    | Application, Request, Message, Verification, System
    |
    | There is no "Completion" notification type,
    | so we use "Application" for compatibility
    | with the existing database enum.
    |
    */

    $message =
        "The employer has confirmed that your job \"" .
        $jobTitle .
        "\" has been completed.";

    $notificationType = 'Application';

    $notification = $conn->prepare(
        "INSERT INTO notifications
        (
            user_id,
            job_id,
            message,
            notification_type,
            is_read,
            created_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            0,
            NOW()
        )"
    );

    $notification->bind_param(
        "iiss",
        $workerId,
        $jobId,
        $message,
        $notificationType
    );

    $notification->execute();

    $notification->close();

    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Job completion confirmed successfully.",
        "jobId" => $jobId,
        "jobStatus" => "Closed",
        "workerId" => $workerId,
        "workerName" => $workerName
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