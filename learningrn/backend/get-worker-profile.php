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

    if (!isset($_GET['userId']) || !is_numeric($_GET['userId'])) {
        throw new Exception('Invalid or missing user ID.');
    }

    $userId = (int) $_GET['userId'];

    /*
    |--------------------------------------------------------------------------
    | GET USER + WORKER PROFILE
    |--------------------------------------------------------------------------
    | The account information comes from users.
    | The work information comes from worker_profile.
    | The category name comes from service_category.
    */

    $sql = "
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.mobile_no,
            u.profile_image,
            u.barangay,
            u.is_verified,
            u.verification_badge,
            u.status,

            wp.worker_id,
            wp.primary_category_id,
            wp.years_experience,
            wp.about_me,
            wp.average_rating,
            wp.total_jobs_completed,

            sc.category_name,
            sc.description AS category_description

        FROM users u

        LEFT JOIN worker_profile wp
            ON wp.user_id = u.user_id

        LEFT JOIN service_category sc
            ON sc.category_id = wp.primary_category_id

        WHERE u.user_id = ?
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception(
            'Failed to prepare worker profile query: ' .
            $conn->error
        );
    }

    $stmt->bind_param("i", $userId);

    if (!$stmt->execute()) {
        throw new Exception(
            'Failed to execute worker profile query: ' .
            $stmt->error
        );
    }

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('User account not found.');
    }

    $row = $result->fetch_assoc();

    /*
    |--------------------------------------------------------------------------
    | RETURN DATA USING THE EXACT NAMES EXPECTED BY React Native
    |--------------------------------------------------------------------------
    */

    echo json_encode([
        'success' => true,

        'userId' => (int) $row['user_id'],

        // CREATE ACCOUNT INFORMATION
        'fullName' => $row['full_name'] ?? '',
        'email' => $row['email'] ?? '',
        'mobileNo' => $row['mobile_no'] ?? '',
        'profileImage' => $row['profile_image'] ?? null,
        'barangay' => $row['barangay'] ?? '',

        // VERIFICATION
        'isVerified' => (
            (int) $row['is_verified'] === 1
        ),
        'verificationBadge' =>
            $row['verification_badge'] ?? null,

        // WORKER PROFILE
        'workerId' =>
            $row['worker_id'] !== null
                ? (int) $row['worker_id']
                : null,

        'primaryCategoryId' =>
            $row['primary_category_id'] !== null
                ? (int) $row['primary_category_id']
                : null,

        'categoryName' =>
            $row['category_name'] ?? '',

        'categoryDescription' =>
            $row['category_description'] ?? '',

        'yearsExperience' =>
            $row['years_experience'] !== null
                ? (float) $row['years_experience']
                : 0,

        'aboutMe' =>
            $row['about_me'] ?? '',

        'averageRating' =>
            $row['average_rating'] !== null
                ? (float) $row['average_rating']
                : 0,

        'totalJobsCompleted' =>
            $row['total_jobs_completed'] !== null
                ? (int) $row['total_jobs_completed']
                : 0,

        'status' =>
            $row['status'] ?? 'Active'
    ]);

    $stmt->close();
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