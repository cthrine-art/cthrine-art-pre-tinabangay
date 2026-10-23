<?php
// Prevent PHP warnings/notices from leaking raw HTML into the JSON response
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

// This endpoint expects multipart/form-data (not JSON), because it's receiving files.
$userId = $_POST['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing userId."]);
    exit();
}

if (!isset($_FILES['idImage']) || !isset($_FILES['selfieImage'])) {
    http_response_code(400);
    echo json_encode(["error" => "Both idImage and selfieImage files are required."]);
    exit();
}

$uploadDir = __DIR__ . '/uploads/verification/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

function saveUploadedFile($fileKey, $uploadDir, $userId, $label) {
    $file = $_FILES[$fileKey];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Upload failed for $label (error code {$file['error']}).");
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $filename = "user{$userId}_{$label}_" . time() . ".$ext";
    $destination = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new Exception("Could not save uploaded file for $label.");
    }

    // Return the relative path (what gets stored in the database)
    return 'uploads/verification/' . $filename;
}

$conn->begin_transaction();

try {
    $idImagePath = saveUploadedFile('idImage', $uploadDir, $userId, 'id');
    $selfieImagePath = saveUploadedFile('selfieImage', $uploadDir, $userId, 'selfie');

    $stmt = $conn->prepare(
        "INSERT INTO VERIFICATION_DOCS (user_id, doc_type, file_path, status) VALUES (?, ?, ?, 'Pending')"
    );

    $docType1 = 'Valid ID';
    $stmt->bind_param("iss", $userId, $docType1, $idImagePath);
    $stmt->execute();

    $docType2 = 'Selfie';
    $stmt->bind_param("iss", $userId, $docType2, $selfieImagePath);
    $stmt->execute();

    $stmt->close();
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Documents submitted for review."
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => "Failed to submit documents: " . $e->getMessage()]);
}

$conn->close();