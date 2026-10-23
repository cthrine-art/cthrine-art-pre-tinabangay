<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once 'db.php';

try {

    // --------------------------------------------------
    // GET BASIC DATA
    // --------------------------------------------------

    $userId = $_POST['userId'] ?? null;
    $categoryId = $_POST['categoryId'] ?? null;
    $yearsExperience = $_POST['yearsExperience'] ?? null;

    if (!$userId) {
        throw new Exception("Missing userId.");
    }

    if (!$categoryId) {
        throw new Exception("Missing work category.");
    }

    if ($yearsExperience === null || $yearsExperience === '') {
        throw new Exception("Missing years of experience.");
    }

    $userId = (int) $userId;
    $categoryId = (int) $categoryId;
    $yearsExperience = (float) $yearsExperience;

    if ($userId <= 0) {
        throw new Exception("Invalid user ID.");
    }

    if ($categoryId <= 0) {
        throw new Exception("Invalid work category.");
    }

    if ($yearsExperience < 0 || $yearsExperience > 99) {
        throw new Exception("Invalid years of experience.");
    }

    // --------------------------------------------------
    // DEBUG FILE CHECK
    // --------------------------------------------------

    if (
        !isset($_FILES['idImage']) ||
        !isset($_FILES['selfieImage']) ||
        !isset($_FILES['proofOfWork'])
    ) {

        $receivedFiles = array_keys($_FILES);

        throw new Exception(
            "Valid ID, selfie, and proof of work are required. " .
            "Files received: " .
            (!empty($receivedFiles)
                ? implode(', ', $receivedFiles)
                : 'none')
        );
    }

    // --------------------------------------------------
    // UPLOAD DIRECTORY
    // --------------------------------------------------

    $uploadDir = __DIR__ . '/uploads/verification/';

    if (!is_dir($uploadDir)) {

        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception(
                "Could not create upload directory."
            );
        }
    }

    // --------------------------------------------------
    // SAVE UPLOADED FILE
    // --------------------------------------------------

    function saveUploadedFile(
        $fileKey,
        $uploadDir,
        $userId,
        $label
    ) {

        if (!isset($_FILES[$fileKey])) {
            throw new Exception(
                "Missing uploaded file for $label."
            );
        }

        $file = $_FILES[$fileKey];

        if (!isset($file['error'])) {
            throw new Exception(
                "Invalid upload data for $label."
            );
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception(
                "Upload failed for $label. Error code: " .
                $file['error']
            );
        }

        if (
            !isset($file['tmp_name']) ||
            !is_uploaded_file($file['tmp_name'])
        ) {
            throw new Exception(
                "Invalid uploaded file for $label."
            );
        }

        // Allowed image extensions
        $allowedExtensions = [
            'jpg',
            'jpeg',
            'png',
            'webp'
        ];

        $extension = strtolower(
            pathinfo(
                $file['name'],
                PATHINFO_EXTENSION
            )
        );

        if (!in_array($extension, $allowedExtensions, true)) {
            throw new Exception(
                "Invalid file type for $label. " .
                "Please upload JPG, PNG, or WEBP."
            );
        }

        // Create unique filename
        $filename =
            "user" .
            $userId .
            "_" .
            $label .
            "_" .
            time() .
            "_" .
            bin2hex(random_bytes(4)) .
            "." .
            $extension;

        $destination = $uploadDir . $filename;

        if (
            !move_uploaded_file(
                $file['tmp_name'],
                $destination
            )
        ) {
            throw new Exception(
                "Could not save uploaded file for $label."
            );
        }

        return 'uploads/verification/' . $filename;
    }

    // --------------------------------------------------
    // START TRANSACTION
    // --------------------------------------------------

    $conn->begin_transaction();

    // --------------------------------------------------
    // CHECK USER
    // --------------------------------------------------

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

    $userResult = $userStmt->get_result();

    if ($userResult->num_rows === 0) {
        throw new Exception(
            "User account not found."
        );
    }

    $user = $userResult->fetch_assoc();

    $userStmt->close();

    // Role 1 = Worker
    if ((int)$user['role_id'] !== 1) {
        throw new Exception(
            "This verification endpoint is only for worker accounts."
        );
    }

    // --------------------------------------------------
    // CHECK SERVICE CATEGORY
    // --------------------------------------------------

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

    $categoryResult = $categoryStmt->get_result();

    if ($categoryResult->num_rows === 0) {
        throw new Exception(
            "Selected work category does not exist."
        );
    }

    $categoryStmt->close();

    // --------------------------------------------------
    // SAVE FILES
    // --------------------------------------------------

    $idImagePath = saveUploadedFile(
        'idImage',
        $uploadDir,
        $userId,
        'id'
    );

    $selfieImagePath = saveUploadedFile(
        'selfieImage',
        $uploadDir,
        $userId,
        'selfie'
    );

    $proofOfWorkPath = saveUploadedFile(
        'proofOfWork',
        $uploadDir,
        $userId,
        'proof'
    );

    // --------------------------------------------------
    // WORKER PROFILE
    // --------------------------------------------------

    $profileCheck = $conn->prepare(
        "SELECT worker_id
         FROM worker_profile
         WHERE user_id = ?
         LIMIT 1"
    );

    if (!$profileCheck) {
        throw new Exception(
            "Failed to prepare worker profile query."
        );
    }

    $profileCheck->bind_param(
        "i",
        $userId
    );

    if (!$profileCheck->execute()) {
        throw new Exception(
            "Failed to check worker profile."
        );
    }

    $profileResult = $profileCheck->get_result();

    $profileCheck->close();

    if ($profileResult->num_rows > 0) {

        // Existing profile
        $profileStmt = $conn->prepare(
            "UPDATE worker_profile
             SET primary_category_id = ?,
                 years_experience = ?
             WHERE user_id = ?"
        );

        if (!$profileStmt) {
            throw new Exception(
                "Failed to prepare worker profile update."
            );
        }

        $profileStmt->bind_param(
            "idi",
            $categoryId,
            $yearsExperience,
            $userId
        );

    } else {

        // New profile
        $profileStmt = $conn->prepare(
            "INSERT INTO worker_profile
            (
                worker_id,
                user_id,
                primary_category_id,
                years_experience
            )
            VALUES (?, ?, ?, ?)"
        );

        if (!$profileStmt) {
            throw new Exception(
                "Failed to prepare worker profile insert."
            );
        }

        $profileStmt->bind_param(
            "iiid",
            $userId,
            $userId,
            $categoryId,
            $yearsExperience
        );
    }

    if (!$profileStmt->execute()) {
        throw new Exception(
            "Failed to save worker information: " .
            $profileStmt->error
        );
    }

    $profileStmt->close();

    // --------------------------------------------------
    // SAVE VERIFICATION DOCUMENTS
    // --------------------------------------------------

    $docStmt = $conn->prepare(
        "INSERT INTO verification_docs
        (
            user_id,
            doc_type,
            file_path,
            status
        )
        VALUES (?, ?, ?, 'Pending')"
    );

    if (!$docStmt) {
        throw new Exception(
            "Failed to prepare verification document query."
        );
    }

    // VALID ID
    $docType = 'Valid ID';

    $docStmt->bind_param(
        "iss",
        $userId,
        $docType,
        $idImagePath
    );

    if (!$docStmt->execute()) {
        throw new Exception(
            "Failed to save Valid ID: " .
            $docStmt->error
        );
    }

    // SELFIE
    $docType = 'Selfie';

    $docStmt->bind_param(
        "iss",
        $userId,
        $docType,
        $selfieImagePath
    );

    if (!$docStmt->execute()) {
        throw new Exception(
            "Failed to save Selfie: " .
            $docStmt->error
        );
    }

    // PROOF OF WORK
    $docType = 'Proof of Work';

    $docStmt->bind_param(
        "iss",
        $userId,
        $docType,
        $proofOfWorkPath
    );

    if (!$docStmt->execute()) {
        throw new Exception(
            "Failed to save Proof of Work: " .
            $docStmt->error
        );
    }

    $docStmt->close();

    // --------------------------------------------------
    // KEEP USER UNVERIFIED UNTIL ADMIN/NGO REVIEW
    // --------------------------------------------------

    $verifyStmt = $conn->prepare(
        "UPDATE users
         SET is_verified = 0,
             verification_badge = NULL
         WHERE user_id = ?"
    );

    if (!$verifyStmt) {
        throw new Exception(
            "Failed to prepare verification status query."
        );
    }

    $verifyStmt->bind_param(
        "i",
        $userId
    );

    if (!$verifyStmt->execute()) {
        throw new Exception(
            "Failed to update verification status."
        );
    }

    $verifyStmt->close();

    // --------------------------------------------------
    // COMMIT
    // --------------------------------------------------

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Worker verification submitted successfully.",
        "userId" => $userId
    ]);

} catch (Exception $e) {

    if (isset($conn)) {
        $conn->rollback();
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Failed to submit worker verification: " .
                   $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}

?>