<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once 'db.php';

try {

    // =========================================================
    // READ JSON
    // =========================================================

    $rawInput = file_get_contents("php://input");

    $data = json_decode($rawInput, true);

    if (!is_array($data)) {
        throw new Exception("Invalid request data.");
    }

    // =========================================================
    // GET VALUES
    // =========================================================

    $userId = $data['userId'] ?? null;
    $fullName = $data['fullName'] ?? null;
    $email = $data['email'] ?? null;
    $mobileNo = $data['mobileNo'] ?? null;
    $categoryId = $data['categoryId'] ?? null;
    $yearsExperience = $data['yearsExperience'] ?? null;
    $aboutMe = $data['aboutMe'] ?? '';

    // =========================================================
    // VALIDATION
    // =========================================================

    if (!$userId) {
        throw new Exception("Missing user ID.");
    }

    if (!$fullName || trim($fullName) === '') {
        throw new Exception("Full name is required.");
    }

    if (!$email || trim($email) === '') {
        throw new Exception("Email address is required.");
    }

    if (!$mobileNo || trim($mobileNo) === '') {
        throw new Exception("Mobile number is required.");
    }

    if (!$categoryId) {
        throw new Exception("Work category is required.");
    }

    if (
        $yearsExperience === null ||
        $yearsExperience === ''
    ) {
        throw new Exception("Years of experience is required.");
    }

    $userId = (int) $userId;
    $categoryId = (int) $categoryId;
    $yearsExperience = (float) $yearsExperience;

    $fullName = trim($fullName);
    $email = trim($email);
    $mobileNo = trim($mobileNo);
    $aboutMe = trim($aboutMe);

    if ($userId <= 0) {
        throw new Exception("Invalid user ID.");
    }

    if ($categoryId <= 0) {
        throw new Exception("Invalid work category.");
    }

    if (
        $yearsExperience < 0 ||
        $yearsExperience > 99
    ) {
        throw new Exception(
            "Years of experience must be between 0 and 99."
        );
    }

    // =========================================================
    // CHECK USER
    // =========================================================

    $userStmt = $conn->prepare(
        "SELECT user_id, role_id
         FROM users
         WHERE user_id = ?
         LIMIT 1"
    );

    if (!$userStmt) {
        throw new Exception(
            "Failed to prepare user query."
        );
    }

    $userStmt->bind_param(
        "i",
        $userId
    );

    if (!$userStmt->execute()) {
        throw new Exception(
            "Failed to check user."
        );
    }

    $userResult =
        $userStmt->get_result();

    if ($userResult->num_rows === 0) {
        throw new Exception(
            "User account not found."
        );
    }

    $user = $userResult->fetch_assoc();

    $userStmt->close();

    // Worker role must be 1
    if ((int)$user['role_id'] !== 1) {
        throw new Exception(
            "This profile belongs to a non-worker account."
        );
    }

    // =========================================================
    // CHECK SERVICE CATEGORY
    //
    // IMPORTANT:
    // worker_profile.primary_category_id references
    // service_category.category_id
    // =========================================================

    $categoryStmt = $conn->prepare(
        "SELECT category_id, category_name
         FROM service_category
         WHERE category_id = ?
         LIMIT 1"
    );

    if (!$categoryStmt) {
        throw new Exception(
            "Failed to prepare category query."
        );
    }

    $categoryStmt->bind_param(
        "i",
        $categoryId
    );

    if (!$categoryStmt->execute()) {
        throw new Exception(
            "Failed to check work category."
        );
    }

    $categoryResult =
        $categoryStmt->get_result();

    if ($categoryResult->num_rows === 0) {
        throw new Exception(
            "The selected work category does not exist in service_category."
        );
    }

    $categoryStmt->close();

    // =========================================================
    // START TRANSACTION
    // =========================================================

    $conn->begin_transaction();

    // =========================================================
    // UPDATE USER INFORMATION
    // =========================================================

    $userUpdateStmt = $conn->prepare(
        "UPDATE users
         SET full_name = ?,
             email = ?,
             mobile_no = ?
         WHERE user_id = ?"
    );

    if (!$userUpdateStmt) {
        throw new Exception(
            "Failed to prepare user update."
        );
    }

    $userUpdateStmt->bind_param(
        "sssi",
        $fullName,
        $email,
        $mobileNo,
        $userId
    );

    if (!$userUpdateStmt->execute()) {
        throw new Exception(
            "Failed to update personal information: " .
            $userUpdateStmt->error
        );
    }

    $userUpdateStmt->close();

    // =========================================================
    // CHECK WORKER PROFILE
    // =========================================================

    $profileCheckStmt = $conn->prepare(
        "SELECT worker_id
         FROM worker_profile
         WHERE user_id = ?
         LIMIT 1"
    );

    if (!$profileCheckStmt) {
        throw new Exception(
            "Failed to prepare worker profile query."
        );
    }

    $profileCheckStmt->bind_param(
        "i",
        $userId
    );

    if (!$profileCheckStmt->execute()) {
        throw new Exception(
            "Failed to check worker profile."
        );
    }

    $profileResult =
        $profileCheckStmt->get_result();

    $profileCheckStmt->close();

    // =========================================================
    // UPDATE EXISTING WORKER PROFILE
    // =========================================================

    if ($profileResult->num_rows > 0) {

        $profileStmt = $conn->prepare(
            "UPDATE worker_profile
             SET primary_category_id = ?,
                 years_experience = ?,
                 about_me = ?
             WHERE user_id = ?"
        );

        if (!$profileStmt) {
            throw new Exception(
                "Failed to prepare worker profile update."
            );
        }

        $profileStmt->bind_param(
            "idsi",
            $categoryId,
            $yearsExperience,
            $aboutMe,
            $userId
        );

    } else {

        // =====================================================
        // CREATE WORKER PROFILE
        // =====================================================

        $profileStmt = $conn->prepare(
            "INSERT INTO worker_profile
             (
                 worker_id,
                 user_id,
                 primary_category_id,
                 years_experience,
                 about_me
             )
             VALUES (?, ?, ?, ?, ?)"
        );

        if (!$profileStmt) {
            throw new Exception(
                "Failed to prepare worker profile insert."
            );
        }

        $profileStmt->bind_param(
            "iiids",
            $userId,
            $userId,
            $categoryId,
            $yearsExperience,
            $aboutMe
        );
    }

    if (!$profileStmt->execute()) {

        throw new Exception(
            "Failed to save worker profile: " .
            $profileStmt->error
        );
    }

    $profileStmt->close();

    // =========================================================
    // COMMIT
    // =========================================================

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" =>
            "Worker profile updated successfully.",
        "userId" => $userId,
        "categoryId" => $categoryId,
        "yearsExperience" =>
            $yearsExperience
    ]);

} catch (Exception $e) {

    if (isset($conn)) {
        $conn->rollback();
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" =>
            $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}

?>