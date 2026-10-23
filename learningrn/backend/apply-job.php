<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {

    /*
     * Read JSON request
     */
    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($input)) {
        throw new Exception('Invalid request data.');
    }

    /*
     * Validate job ID
     */
    if (
        !isset($input['jobId']) ||
        !is_numeric($input['jobId'])
    ) {
        throw new Exception('Invalid job ID.');
    }

    /*
     * Validate worker ID
     */
    if (
        !isset($input['userId']) ||
        !is_numeric($input['userId'])
    ) {
        throw new Exception('Invalid worker ID.');
    }

    $jobId = (int) $input['jobId'];
    $workerId = (int) $input['userId'];

    $coverLetter =
        isset($input['coverLetter'])
            ? trim($input['coverLetter'])
            : '';

    /*
     * Proposed rate
     */
    $proposedRate = null;

    if (
        isset($input['proposedRate']) &&
        $input['proposedRate'] !== '' &&
        is_numeric($input['proposedRate'])
    ) {
        $proposedRate = (float) $input['proposedRate'];
    }

    /*
     * Available date
     */
    $availableDate = null;

    if (
        isset($input['availableDate']) &&
        trim($input['availableDate']) !== ''
    ) {
        $availableDate = trim($input['availableDate']);
    }

    /*
     * ---------------------------------------------------------
     * GET WORKER
     * ---------------------------------------------------------
     */

    $workerStmt = $conn->prepare("
        SELECT
            user_id,
            full_name
        FROM users
        WHERE user_id = ?
        LIMIT 1
    ");

    if (!$workerStmt) {
        throw new Exception(
            'Failed to verify worker: ' . $conn->error
        );
    }

    $workerStmt->bind_param(
        "i",
        $workerId
    );

    if (!$workerStmt->execute()) {
        throw new Exception(
            'Failed to verify worker: ' .
            $workerStmt->error
        );
    }

    $workerResult = $workerStmt->get_result();

    if ($workerResult->num_rows === 0) {
        $workerStmt->close();

        throw new Exception(
            'Worker account not found.'
        );
    }

    $worker = $workerResult->fetch_assoc();

    $workerName = $worker['full_name'];

    $workerStmt->close();


    /*
     * ---------------------------------------------------------
     * GET JOB
     * ---------------------------------------------------------
     */

    $jobStmt = $conn->prepare("
        SELECT
            job_id,
            employer_id,
            title,
            status,
            expires_at
        FROM jobs
        WHERE job_id = ?
        LIMIT 1
    ");

    if (!$jobStmt) {
        throw new Exception(
            'Failed to verify job: ' . $conn->error
        );
    }

    $jobStmt->bind_param(
        "i",
        $jobId
    );

    if (!$jobStmt->execute()) {
        throw new Exception(
            'Failed to verify job: ' .
            $jobStmt->error
        );
    }

    $jobResult = $jobStmt->get_result();

    if ($jobResult->num_rows === 0) {
        $jobStmt->close();

        throw new Exception(
            'Job not found.'
        );
    }

    $job = $jobResult->fetch_assoc();

    $employerId = (int) $job['employer_id'];
    $jobTitle = $job['title'];

    $jobStmt->close();


    /*
     * ---------------------------------------------------------
     * ONLY OPEN JOBS CAN RECEIVE APPLICATIONS
     * ---------------------------------------------------------
     */

    if ($job['status'] !== 'Open') {
        throw new Exception(
            'This job is no longer accepting applications.'
        );
    }


    /*
     * ---------------------------------------------------------
     * CHECK EXPIRATION
     * ---------------------------------------------------------
     */

    if (
        !empty($job['expires_at']) &&
        strtotime($job['expires_at']) < time()
    ) {
        throw new Exception(
            'This job has already expired.'
        );
    }


    /*
     * ---------------------------------------------------------
     * PREVENT DUPLICATE APPLICATION
     * ---------------------------------------------------------
     */

    $duplicateStmt = $conn->prepare("
        SELECT application_id
        FROM job_applications
        WHERE job_id = ?
        AND worker_id = ?
        LIMIT 1
    ");

    if (!$duplicateStmt) {
        throw new Exception(
            'Failed to check existing application: ' .
            $conn->error
        );
    }

    $duplicateStmt->bind_param(
        "ii",
        $jobId,
        $workerId
    );

    if (!$duplicateStmt->execute()) {
        throw new Exception(
            'Failed to check existing application: ' .
            $duplicateStmt->error
        );
    }

    $duplicateResult =
        $duplicateStmt->get_result();

    if ($duplicateResult->num_rows > 0) {

        $duplicateStmt->close();

        throw new Exception(
            'You have already applied for this job.'
        );
    }

    $duplicateStmt->close();


    /*
     * ---------------------------------------------------------
     * START TRANSACTION
     *
     * The application and notification are created together.
     * If either one fails, neither is kept.
     * ---------------------------------------------------------
     */

    $conn->begin_transaction();


    /*
     * ---------------------------------------------------------
     * INSERT APPLICATION
     * ---------------------------------------------------------
     */

    $insertStmt = $conn->prepare("
        INSERT INTO job_applications (
            job_id,
            worker_id,
            cover_letter,
            proposed_rate,
            available_date,
            status
        )
        VALUES (?, ?, ?, ?, ?, 'Pending')
    ");

    if (!$insertStmt) {
        throw new Exception(
            'Failed to prepare application: ' .
            $conn->error
        );
    }

    $insertStmt->bind_param(
        "iisds",
        $jobId,
        $workerId,
        $coverLetter,
        $proposedRate,
        $availableDate
    );

    if (!$insertStmt->execute()) {
        throw new Exception(
            'Failed to submit application: ' .
            $insertStmt->error
        );
    }

    $applicationId =
        $insertStmt->insert_id;

    $insertStmt->close();


    /*
     * ---------------------------------------------------------
     * CREATE EMPLOYER NOTIFICATION
     * ---------------------------------------------------------
     */

    $notificationMessage =
        $workerName .
        ' applied for your job "' .
        $jobTitle .
        '".';


    $notificationStmt = $conn->prepare("
        INSERT INTO notifications (
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
            'Failed to prepare notification: ' .
            $conn->error
        );
    }

    $notificationStmt->bind_param(
        "iis",
        $employerId,
        $jobId,
        $notificationMessage
    );

    if (!$notificationStmt->execute()) {
        throw new Exception(
            'Failed to create employer notification: ' .
            $notificationStmt->error
        );
    }

    $notificationStmt->close();


    /*
     * ---------------------------------------------------------
     * COMMIT
     * ---------------------------------------------------------
     */

    $conn->commit();

    $conn->close();


    /*
     * ---------------------------------------------------------
     * SUCCESS RESPONSE
     * ---------------------------------------------------------
     */

    echo json_encode([
        'success' => true,
        'message' => 'Application submitted successfully.',
        'applicationId' => (int) $applicationId,
        'status' => 'Pending'
    ]);

} catch (Exception $e) {

    /*
     * Roll back application if notification/application failed.
     */
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Exception $rollbackError) {
            // Ignore rollback errors.
        }
    }

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);

    if (isset($conn)) {
        $conn->close();
    }
}

?>

