<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {

    /*
     * ---------------------------------------------------------
     * GET PARAMETERS
     * ---------------------------------------------------------
     */

    if (
        !isset($_GET['jobId']) ||
        !is_numeric($_GET['jobId'])
    ) {
        throw new Exception(
            'Invalid or missing job ID.'
        );
    }

    $jobId = (int) $_GET['jobId'];

    $userId = null;

    if (
        isset($_GET['userId']) &&
        is_numeric($_GET['userId'])
    ) {
        $userId = (int) $_GET['userId'];
    }


    /*
     * ---------------------------------------------------------
     * GET JOB DETAILS
     * ---------------------------------------------------------
     */

    $sql = "
        SELECT
            j.job_id,
            j.employer_id,
            j.category_id,
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

            sc.category_name,

            u.full_name AS employer_name,
            u.profile_image AS employer_profile_image,
            u.is_verified AS employer_verified

        FROM jobs j

        LEFT JOIN service_category sc
            ON sc.category_id = j.category_id

        LEFT JOIN users u
            ON u.user_id = j.employer_id

        WHERE j.job_id = ?

        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception(
            'Failed to prepare job query: ' .
            $conn->error
        );
    }

    $stmt->bind_param(
        "i",
        $jobId
    );

    if (!$stmt->execute()) {
        throw new Exception(
            'Failed to execute job query: ' .
            $stmt->error
        );
    }

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception(
            'Job not found.'
        );
    }

    $row = $result->fetch_assoc();

    $stmt->close();


    /*
     * ---------------------------------------------------------
     * CHECK IF WORKER ALREADY APPLIED
     * ---------------------------------------------------------
     */

    $alreadyApplied = false;
    $applicationId = null;
    $applicationStatus = null;

    if ($userId !== null) {

        $applicationSql = "
            SELECT
                application_id,
                status
            FROM job_applications
            WHERE job_id = ?
              AND worker_id = ?
            LIMIT 1
        ";

        $applicationStmt =
            $conn->prepare(
                $applicationSql
            );

        if (!$applicationStmt) {
            throw new Exception(
                'Failed to prepare application query: ' .
                $conn->error
            );
        }

        $applicationStmt->bind_param(
            "ii",
            $jobId,
            $userId
        );

        if (
            !$applicationStmt->execute()
        ) {
            throw new Exception(
                'Failed to check application status: ' .
                $applicationStmt->error
            );
        }

        $applicationResult =
            $applicationStmt->get_result();

        if (
            $applicationResult->num_rows > 0
        ) {

            $applicationRow =
                $applicationResult->fetch_assoc();

            $alreadyApplied = true;

            $applicationId =
                (int) $applicationRow[
                    'application_id'
                ];

            $applicationStatus =
                $applicationRow[
                    'status'
                ];
        }

        $applicationStmt->close();
    }


    /*
     * ---------------------------------------------------------
     * RETURN JOB DETAILS
     * ---------------------------------------------------------
     *
     * Your current jobs table contains:
     * - job_id
     * - employer_id
     * - category_id
     * - title
     * - description
     * - budget
     * - location
     * - latitude
     * - longitude
     * - job_type
     * - status
     * - created_at
     * - expires_at
     *
     * It does NOT currently contain:
     * - required_skills
     * - schedule
     *
     * Those are therefore returned as empty/null for now.
     */

    echo json_encode([
        'success' => true,

        'job' => [

            'id' =>
                (int) $row['job_id'],

            'title' =>
                $row['title'] ?? '',

            'description' =>
                $row['description'] ?? '',

            'location' =>
                $row['location'] ?? '',

            'latitude' =>
                $row['latitude'] !== null
                    ? (float) $row['latitude']
                    : null,

            'longitude' =>
                $row['longitude'] !== null
                    ? (float) $row['longitude']
                    : null,

            'budget' =>
                $row['budget'] !== null
                    ? (float) $row['budget']
                    : 0,

            'price' =>
                $row['budget'] !== null
                    ? (float) $row['budget']
                    : 0,

            'jobType' =>
                $row['job_type'] ?? '',

            'categoryId' =>
                $row['category_id'] !== null
                    ? (int) $row['category_id']
                    : null,

            'categoryName' =>
                $row['category_name'] ?? '',

            'status' =>
                $row['status'] ?? 'Open',

            'createdAt' =>
                $row['created_at'] ?? null,

            'expiresAt' =>
                $row['expires_at'] ?? null,

            'employerId' =>
                $row['employer_id'] !== null
                    ? (int) $row['employer_id']
                    : null,

            'employerName' =>
                $row['employer_name'] ?? '',

            'employerProfileImage' =>
                $row['employer_profile_image']
                    ?? null,

            'employerVerified' =>
                ((int) $row['employer_verified'] === 1),

            /*
             * These fields are not stored in the
             * current jobs table yet.
             */
            'requiredSkills' => '',

            'schedule' => null,

            /*
             * Application information
             */
            'alreadyApplied' =>
                $alreadyApplied,

            'applicationId' =>
                $applicationId,

            'applicationStatus' =>
                $applicationStatus
        ]
    ]);

    $conn->close();

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);

    if (isset($conn)) {
        $conn->close();
    }
}

?>

