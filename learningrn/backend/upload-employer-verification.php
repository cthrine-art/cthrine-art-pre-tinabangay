<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode([
        "success" => true
    ]);
    exit();
}

require_once __DIR__ . "/db.php";

try {

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);

        echo json_encode([
            "success" => false,
            "error" => "Only POST requests are allowed."
        ]);

        exit();
    }

    // -----------------------------------------
    // GET FORM DATA
    // -----------------------------------------

    $userId = $_POST['userId'] ?? '';

    $employerName = trim(
        $_POST['employerName'] ?? ''
    );

    $address = trim(
        $_POST['address'] ?? ''
    );

    // -----------------------------------------
    // VALIDATE BASIC INFORMATION
    // -----------------------------------------

    if ($userId === '') {
        throw new Exception(
            "User ID is required."
        );
    }

    if ($employerName === '') {
        throw new Exception(
            "Employer name is required."
        );
    }

    if ($address === '') {
        throw new Exception(
            "Address is required."
        );
    }

    // -----------------------------------------
    // CHECK ID IMAGE
    // -----------------------------------------

    if (
        !isset($_FILES['idImage']) ||
        $_FILES['idImage']['error'] !== UPLOAD_ERR_OK
    ) {
        throw new Exception(
            "Valid ID image is required."
        );
    }

    // -----------------------------------------
    // CHECK SELFIE
    // -----------------------------------------

    if (
        !isset($_FILES['selfieImage']) ||
        $_FILES['selfieImage']['error'] !== UPLOAD_ERR_OK
    ) {
        throw new Exception(
            "Selfie image is required."
        );
    }

    // -----------------------------------------
    // CREATE UPLOAD DIRECTORY
    // -----------------------------------------

    $uploadDir =
        __DIR__ . "/uploads/verification/";

    if (!is_dir($uploadDir)) {

        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception(
                "Could not create verification upload directory."
            );
        }
    }

    // -----------------------------------------
    // GENERATE UNIQUE FILENAMES
    // -----------------------------------------

    $timestamp = time();

    $idFileName =
        "user" . $userId .
        "_employer_id_" .
        $timestamp .
        ".jpg";

    $selfieFileName =
        "user" . $userId .
        "_employer_selfie_" .
        $timestamp .
        ".jpg";

    $idPath =
        $uploadDir . $idFileName;

    $selfiePath =
        $uploadDir . $selfieFileName;

    // -----------------------------------------
    // SAVE ID
    // -----------------------------------------

    if (
        !move_uploaded_file(
            $_FILES['idImage']['tmp_name'],
            $idPath
        )
    ) {

        throw new Exception(
            "Failed to save valid ID image."
        );
    }

    // -----------------------------------------
    // SAVE SELFIE
    // -----------------------------------------

    if (
        !move_uploaded_file(
            $_FILES['selfieImage']['tmp_name'],
            $selfiePath
        )
    ) {

        if (file_exists($idPath)) {
            unlink($idPath);
        }

        throw new Exception(
            "Failed to save selfie image."
        );
    }

    // -----------------------------------------
    // DATABASE PATHS
    // -----------------------------------------

    $idFilePath =
        "uploads/verification/" .
        $idFileName;

    $selfieFilePath =
        "uploads/verification/" .
        $selfieFileName;

    // -----------------------------------------
    // CHECK DATABASE CONNECTION
    // -----------------------------------------

    if (!isset($conn)) {
        throw new Exception(
            "Database connection was not found."
        );
    }

    // -----------------------------------------
    // INSERT VALID ID
    // -----------------------------------------

    $stmt = $conn->prepare("
        INSERT INTO verification_docs
        (
            user_id,
            doc_type,
            file_path,
            status
        )
        VALUES
        (
            ?,
            'Valid ID',
            ?,
            'Pending'
        )
    ");

    if (!$stmt) {

        throw new Exception(
            "Database prepare failed: " .
            $conn->error
        );
    }

    $stmt->bind_param(
        "is",
        $userId,
        $idFilePath
    );

    if (!$stmt->execute()) {

        $stmt->close();

        throw new Exception(
            "Failed to save ID verification: " .
            $stmt->error
        );
    }

    $stmt->close();

    // -----------------------------------------
    // INSERT SELFIE
    // -----------------------------------------

    $stmt = $conn->prepare("
        INSERT INTO verification_docs
        (
            user_id,
            doc_type,
            file_path,
            status
        )
        VALUES
        (
            ?,
            'Selfie',
            ?,
            'Pending'
        )
    ");

    if (!$stmt) {

        throw new Exception(
            "Database prepare failed: " .
            $conn->error
        );
    }

    $stmt->bind_param(
        "is",
        $userId,
        $selfieFilePath
    );

    if (!$stmt->execute()) {

        $stmt->close();

        throw new Exception(
            "Failed to save selfie verification: " .
            $stmt->error
        );
    }

    $stmt->close();

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    echo json_encode([
        "success" => true,
        "message" => "Employer verification submitted successfully.",
        "verification_status" => "Pending",
        "user_id" => $userId,
        "documents" => [
            [
                "type" => "Valid ID",
                "file_path" => $idFilePath,
                "status" => "Pending"
            ],
            [
                "type" => "Selfie",
                "file_path" => $selfieFilePath,
                "status" => "Pending"
            ]
        ]
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>