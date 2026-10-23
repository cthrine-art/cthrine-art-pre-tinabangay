
<?php

header('Content-Type: application/json');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);

    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$applicationId = isset($input['applicationId'])
    ? intval($input['applicationId'])
    : 0;

$employerId = isset($input['employerId'])
    ? intval($input['employerId'])
    : 0;

$status = isset($input['status'])
    ? trim($input['status'])
    : '';

if ($applicationId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid application ID."
    ]);

    exit();
}

if ($employerId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid employer ID."
    ]);

    exit();
}

if (!in_array($status, ['Accepted', 'Rejected'], true)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid application status."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| Verify employer
|--------------------------------------------------------------------------
*/

$employerStmt = $conn->prepare("
    SELECT user_id
    FROM users
    WHERE user_id = ?
      AND role_id = 2
      AND status = 'Active'
    LIMIT 1
");

if (!$employerStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare employer verification."
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
        "message" => "Employer account was not found or is inactive."
    ]);

    exit();
}

$employerStmt->close();

/*
|--------------------------------------------------------------------------
| Get application and verify job ownership
|--------------------------------------------------------------------------
*/

$applicationStmt = $conn->prepare("
    SELECT
        ja.application_id,
        ja.job_id,
        ja.worker_id,
        ja.status AS application_status,
        j.title AS job_title,
        j.status AS job_status,
        j.employer_id,
        u.full_name AS worker_name,
        u.email AS worker_email
    FROM job_applications ja
    INNER JOIN jobs j
        ON j.job_id = ja.job_id
    INNER JOIN users u
        ON u.user_id = ja.worker_id
    WHERE ja.application_id = ?
      AND j.employer_id = ?
    LIMIT 1
");

if (!$applicationStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare application query."
    ]);

    exit();
}

$applicationStmt->bind_param(
    "ii",
    $applicationId,
    $employerId
);

$applicationStmt->execute();

$applicationResult = $applicationStmt->get_result();

if ($applicationResult->num_rows === 0) {
    $applicationStmt->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Application not found or does not belong to this employer."
    ]);

    exit();
}

$application = $applicationResult->fetch_assoc();

$applicationStmt->close();

$currentStatus = $application['application_status'];
$jobId = intval($application['job_id']);
$workerId = intval($application['worker_id']);
$jobTitle = $application['job_title'];
$workerName = $application['worker_name'];

/*
|--------------------------------------------------------------------------
| Prevent unnecessary status changes
|--------------------------------------------------------------------------
*/

if ($currentStatus === $status) {
    echo json_encode([
        "success" => true,
        "message" => "Application is already {$status}.",
        "applicationId" => $applicationId,
        "status" => $status
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| Start transaction
|--------------------------------------------------------------------------
*/

$conn->begin_transaction();

try {

    /*
    |--------------------------------------------------------------------------
    | If accepting an applicant
    |--------------------------------------------------------------------------
    */

    if ($status === 'Accepted') {

        if ($application['job_status'] !== 'Open') {
            throw new Exception(
                "This job is no longer open for applications."
            );
        }

        /*
        | Accept selected application
        */

        $updateStmt = $conn->prepare("
            UPDATE job_applications
            SET status = 'Accepted'
            WHERE application_id = ?
        ");

        if (!$updateStmt) {
            throw new Exception(
                "Failed to prepare application update."
            );
        }

        $updateStmt->bind_param(
            "i",
            $applicationId
        );

        if (!$updateStmt->execute()) {
            $updateStmt->close();

            throw new Exception(
                "Failed to accept application."
            );
        }

        $updateStmt->close();

        /*
        | Reject other pending applications
        | for the same job.
        */

        $rejectOthersStmt = $conn->prepare("
            UPDATE job_applications
            SET status = 'Rejected'
            WHERE job_id = ?
              AND application_id <> ?
              AND status = 'Pending'
        ");

        if (!$rejectOthersStmt) {
            throw new Exception(
                "Failed to prepare other applications update."
            );
        }

        $rejectOthersStmt->bind_param(
            "ii",
            $jobId,
            $applicationId
        );

        if (!$rejectOthersStmt->execute()) {
            $rejectOthersStmt->close();

            throw new Exception(
                "Failed to update other applications."
            );
        }

        $rejectOthersStmt->close();

        /*
        | Mark job as Filled
        */

        $jobStmt = $conn->prepare("
            UPDATE jobs
            SET status = 'Filled'
            WHERE job_id = ?
              AND employer_id = ?
        ");

        if (!$jobStmt) {
            throw new Exception(
                "Failed to prepare job update."
            );
        }

        $jobStmt->bind_param(
            "ii",
            $jobId,
            $employerId
        );

        if (!$jobStmt->execute()) {
            $jobStmt->close();

            throw new Exception(
                "Failed to update job status."
            );
        }

        $jobStmt->close();

        /*
        | Notify selected worker
        */

        $message =
            "Your application for \"" .
            $jobTitle .
            "\" has been accepted by the employer.";

        $notificationStmt = $conn->prepare("
            INSERT INTO notifications
            (
                user_id,
                job_id,
                message,
                notification_type,
                is_read
            )
            VALUES (?, ?, ?, 'Application', 0)
        ");

        if (!$notificationStmt) {
            throw new Exception(
                "Failed to prepare notification."
            );
        }

        $notificationStmt->bind_param(
            "iis",
            $workerId,
            $jobId,
            $message
        );

        if (!$notificationStmt->execute()) {
            $notificationStmt->close();

            throw new Exception(
                "Failed to create notification."
            );
        }

        $notificationStmt->close();

    } else {

        /*
        |--------------------------------------------------------------------------
        | Reject selected application
        |--------------------------------------------------------------------------
        */

        $updateStmt = $conn->prepare("
            UPDATE job_applications
            SET status = 'Rejected'
            WHERE application_id = ?
        ");

        if (!$updateStmt) {
            throw new Exception(
                "Failed to prepare application rejection."
            );
        }

        $updateStmt->bind_param(
            "i",
            $applicationId
        );

        if (!$updateStmt->execute()) {
            $updateStmt->close();

            throw new Exception(
                "Failed to reject application."
            );
        }

        $updateStmt->close();

        /*
        | Notify worker
        */

        $message =
            "Your application for \"" .
            $jobTitle .
            "\" was not accepted by the employer.";

        $notificationStmt = $conn->prepare("
            INSERT INTO notifications
            (
                user_id,
                job_id,
                message,
                notification_type,
                is_read
            )
            VALUES (?, ?, ?, 'Application', 0)
        ");

        if (!$notificationStmt) {
            throw new Exception(
                "Failed to prepare notification."
            );
        }

        $notificationStmt->bind_param(
            "iis",
            $workerId,
            $jobId,
            $message
        );

        if (!$notificationStmt->execute()) {
            $notificationStmt->close();

            throw new Exception(
                "Failed to create notification."
            );
        }

        $notificationStmt->close();
    }

    /*
    |--------------------------------------------------------------------------
    | Commit transaction
    |--------------------------------------------------------------------------
    */

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" =>
            $status === 'Accepted'
                ? "Application accepted successfully."
                : "Application rejected successfully.",
        "applicationId" => $applicationId,
        "jobId" => $jobId,
        "workerId" => $workerId,
        "workerName" => $workerName,
        "status" => $status
    ]);

} catch (Exception $e) {

    $conn->rollback();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>