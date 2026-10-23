<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data['userId'] ?? null;
$action = $data['action'] ?? null; // 'activate' | 'suspend' | 'delete'

if (!$userId || !in_array($action, ['activate', 'suspend', 'delete'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid userId/action."]);
    exit();
}

if ($action === 'delete') {
    try {
        $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "userId" => (int) $userId, "action" => "delete"]);
    } catch (mysqli_sql_exception $e) {
        // Most likely a foreign key constraint from worker_profile,
        // employer_profile, jobs, verification_docs, etc.
        http_response_code(500);
        echo json_encode([
            "error" => "Could not delete this account — it likely has related records (jobs, verification docs, etc.) blocking deletion. Try suspending instead."
        ]);
    }
    $conn->close();
    exit();
}

$newStatus = $action === 'activate' ? 'Active' : 'Suspended';

$stmt = $conn->prepare("UPDATE users SET status = ? WHERE user_id = ?");
$stmt->bind_param("si", $newStatus, $userId);
$stmt->execute();
$stmt->close();

echo json_encode([
    "success" => true,
    "userId" => (int) $userId,
    "status" => $newStatus,
]);

$conn->close();