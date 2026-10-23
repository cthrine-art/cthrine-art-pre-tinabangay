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
    |--------------------------------------------------------------------------
    | VALIDATE EMPLOYER ID
    |--------------------------------------------------------------------------
    */

    if (
        !isset($_GET['employerId']) ||
        !is_numeric($_GET['employerId'])
    ) {
        throw new Exception(
            'Employer ID is required.'
        );
    }

    $employerId = (int) $_GET['employerId'];

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL JOB ID
    |--------------------------------------------------------------------------
    |
    | If jobId is provided:
    |   → return applicants for that specific job.
    |
    | If jobId is NOT provided:
    |   → return applicants for ALL jobs owned by employer.
    |
    |--------------------------------------------------------------------------
    */

    $jobId = null;

    if (
        isset($_GET['jobId']) &&
        is_numeric($_GET['jobId'])
    ) {
        $jobId = (int) $_GET['jobId'];
    }

    /*
    |--------------------------------------------------------------------------
    | SPECIFIC JOB
    |--------------------------------------------------------------------------
    */

    if ($jobId !== null) {

        $jobSql = "
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

                sc.category_name

            FROM jobs j

            LEFT JOIN service_category sc
                ON sc.category_id = j.category_id

            WHERE j.job_id = ?
              AND j.employer_id = ?

            LIMIT 1
        ";

        $jobStmt = $conn->prepare($jobSql);

        if (!$jobStmt) {
            throw new Exception(
                'Failed to prepare job query: ' .
                $conn->error
            );
        }

        $jobStmt->bind_param(
            "ii",
            $jobId,
            $employerId
        );

        if (!$jobStmt->execute()) {
            throw new Exception(
                'Failed to execute job query: ' .
                $jobStmt->error
            );
        }

        $jobResult =
            $jobStmt->get_result();

        if ($jobResult->num_rows === 0) {
            throw new Exception(
                'Job not found or does not belong to this employer.'
            );
        }

        $jobRow =
            $jobResult->fetch_assoc();

        $jobStmt->close();

        /*
        |--------------------------------------------------------------------------
        | GET APPLICANTS FOR SPECIFIC JOB
        |--------------------------------------------------------------------------
        */

        $applicantSql = "
            SELECT
                ja.application_id,
                ja.job_id,
                ja.worker_id,
                ja.cover_letter,
                ja.proposed_rate,
                ja.available_date,
                ja.status,
                ja.applied_at,

                u.full_name,
                u.email,
                u.mobile_no,
                u.profile_image,
                u.is_verified,
                u.verification_badge,
                u.status AS user_status,
                u.barangay

            FROM job_applications ja

            INNER JOIN users u
                ON u.user_id = ja.worker_id

            WHERE ja.job_id = ?

            ORDER BY ja.applied_at DESC
        ";

        $applicantStmt =
            $conn->prepare($applicantSql);

        if (!$applicantStmt) {
            throw new Exception(
                'Failed to prepare applicant query: ' .
                $conn->error
            );
        }

        $applicantStmt->bind_param(
            "i",
            $jobId
        );

        if (!$applicantStmt->execute()) {
            throw new Exception(
                'Failed to execute applicant query: ' .
                $applicantStmt->error
            );
        }

        $result =
            $applicantStmt->get_result();

        $applicants = [];

        while (
            $row = $result->fetch_assoc()
        ) {

            $applicants[] = [
                'applicationId' =>
                    (int) $row['application_id'],

                'jobId' =>
                    (int) $row['job_id'],

                'workerId' =>
                    (int) $row['worker_id'],

                'fullName' =>
                    $row['full_name'] ?? '',

                'email' =>
                    $row['email'] ?? '',

                'mobileNumber' =>
                    $row['mobile_no'] ?? '',

                'profileImage' =>
                    $row['profile_image'] ?? null,

                'isVerified' =>
                    ((int) $row['is_verified'] === 1),

                'verificationBadge' =>
                    $row['verification_badge'] ?? null,

                'userStatus' =>
                    $row['user_status'] ?? 'Active',

                'barangay' =>
                    $row['barangay'] ?? 'Not specified',

                'coverLetter' =>
                    $row['cover_letter'] ?? '',

                'proposedRate' =>
                    $row['proposed_rate'] !== null
                        ? (float) $row['proposed_rate']
                        : null,

                'availableDate' =>
                    $row['available_date'] ?? null,

                'status' =>
                    $row['status'] ?? 'Pending',

                'appliedAt' =>
                    $row['applied_at'] ?? null,
            ];
        }

        $applicantStmt->close();

        echo json_encode([
            'success' => true,

            'job' => [
                'id' =>
                    (int) $jobRow['job_id'],

                'jobId' =>
                    (int) $jobRow['job_id'],

                'employerId' =>
                    (int) $jobRow['employer_id'],

                'categoryId' =>
                    $jobRow['category_id'] !== null
                        ? (int) $jobRow['category_id']
                        : null,

                'categoryName' =>
                    $jobRow['category_name'] ?? '',

                'title' =>
                    $jobRow['title'] ?? '',

                'description' =>
                    $jobRow['description'] ?? '',

                'budget' =>
                    $jobRow['budget'] !== null
                        ? (float) $jobRow['budget']
                        : 0,

                'location' =>
                    $jobRow['location'] ?? '',

                'latitude' =>
                    $jobRow['latitude'] !== null
                        ? (float) $jobRow['latitude']
                        : null,

                'longitude' =>
                    $jobRow['longitude'] !== null
                        ? (float) $jobRow['longitude']
                        : null,

                'jobType' =>
                    $jobRow['job_type'] ?? '',

                'status' =>
                    $jobRow['status'] ?? 'Open',

                'createdAt' =>
                    $jobRow['created_at'] ?? null,

                'expiresAt' =>
                    $jobRow['expires_at'] ?? null,
            ],

            'applicants' =>
                $applicants,

            'totalApplicants' =>
                count($applicants)
        ]);

        $conn->close();
        exit();
    }

    /*
    |--------------------------------------------------------------------------
    | ALL JOBS / ALL APPLICANTS FOR EMPLOYER
    |--------------------------------------------------------------------------
    */

    $sql = "
        SELECT

            j.job_id,
            j.employer_id,
            j.category_id,
            j.title AS job_title,
            j.description,
            j.budget,
            j.location,
            j.job_type,
            j.status AS job_status,
            j.created_at AS job_created_at,

            ja.application_id,
            ja.worker_id,
            ja.cover_letter,
            ja.proposed_rate,
            ja.available_date,
            ja.status AS application_status,
            ja.applied_at,

            u.full_name,
            u.email,
            u.mobile_no,
            u.profile_image,
            u.is_verified,
            u.verification_badge,
            u.status AS user_status,
            u.barangay,

            sc.category_name

        FROM jobs j

        INNER JOIN job_applications ja
            ON ja.job_id = j.job_id

        INNER JOIN users u
            ON u.user_id = ja.worker_id

        LEFT JOIN service_category sc
            ON sc.category_id = j.category_id

        WHERE j.employer_id = ?

        ORDER BY ja.applied_at DESC
    ";

    $stmt =
        $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception(
            'Failed to prepare all applicants query: ' .
            $conn->error
        );
    }

    $stmt->bind_param(
        "i",
        $employerId
    );

    if (!$stmt->execute()) {
        throw new Exception(
            'Failed to execute all applicants query: ' .
            $stmt->error
        );
    }

    $result =
        $stmt->get_result();

    $applicants = [];

    while (
        $row = $result->fetch_assoc()
    ) {

        $applicants[] = [
            'applicationId' =>
                (int) $row['application_id'],

            'jobId' =>
                (int) $row['job_id'],

            'jobTitle' =>
                $row['job_title'] ?? '',

            'workerId' =>
                (int) $row['worker_id'],

            'fullName' =>
                $row['full_name'] ?? '',

            'email' =>
                $row['email'] ?? '',

            'mobileNumber' =>
                $row['mobile_no'] ?? '',

            'profileImage' =>
                $row['profile_image'] ?? null,

            'isVerified' =>
                ((int) $row['is_verified'] === 1),

            'verificationBadge' =>
                $row['verification_badge'] ?? null,

            'userStatus' =>
                $row['user_status'] ?? 'Active',

            'barangay' =>
                $row['barangay'] ?? 'Not specified',

            'coverLetter' =>
                $row['cover_letter'] ?? '',

            'proposedRate' =>
                $row['proposed_rate'] !== null
                    ? (float) $row['proposed_rate']
                    : null,

            'availableDate' =>
                $row['available_date'] ?? null,

            'status' =>
                $row['application_status'] ?? 'Pending',

            'appliedAt' =>
                $row['applied_at'] ?? null,

            'categoryId' =>
                $row['category_id'] !== null
                    ? (int) $row['category_id']
                    : null,

            'categoryName' =>
                $row['category_name'] ?? '',

            'jobStatus' =>
                $row['job_status'] ?? 'Open',

            'jobType' =>
                $row['job_type'] ?? '',

            'budget' =>
                $row['budget'] !== null
                    ? (float) $row['budget']
                    : 0,

            'location' =>
                $row['location'] ?? '',
        ];
    }

    $stmt->close();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE FOR EMPLOYER HOME → APPLICANTS
    |--------------------------------------------------------------------------
    */

    echo json_encode([
        'success' => true,

        'employerId' =>
            $employerId,

        'job' => null,

        'applicants' =>
            $applicants,

        'totalApplicants' =>
            count($applicants)
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