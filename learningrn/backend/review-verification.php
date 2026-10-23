<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data['userId'] ?? null;
$action = $data['action'] ?? null; // 'approve' or 'reject'

if (!$userId || !in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid userId/action."]);
    exit();
}

$newDocStatus = $action === 'approve' ? 'Approved' : 'Rejected';

$conn->begin_transaction();

try {
    $stmt = $conn->prepare(
        "UPDATE verification_docs SET status = ? WHERE user_id = ? AND status = 'Pending'"
    );
    $stmt->bind_param("si", $newDocStatus, $userId);
    $stmt->execute();
    $stmt->close();

    if ($action === 'approve') {
        $userStmt = $conn->prepare("UPDATE users SET is_verified = TRUE WHERE user_id = ?");
        $userStmt->bind_param("i", $userId);
        $userStmt->execute();
        $userStmt->close();

        $message = "Congratulations! Your account has been verified. You can now log in and use all features.";
    } else {
        $message = "Your verification documents were not approved. Please resubmit your ID and selfie for review.";
    }

    // Notify the user either way, so they know something changed.
    $notifStmt = $conn->prepare(
        "INSERT INTO notifications (user_id, message, notification_type)
         VALUES (?, ?, 'Verification')"
    );
    $notifStmt->bind_param("is", $userId, $message);
    $notifStmt->execute();
    $notifStmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "userId" => (int) $userId,
        "action" => $action,
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => "Failed to update verification: " . $e->getMessage()]);
}

$conn->close();