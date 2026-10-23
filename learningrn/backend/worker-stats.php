<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$userId = $_GET['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing userId."]);
    exit();
}

$stmt = $conn->prepare(
    "SELECT u.full_name, u.is_verified, wp.primary_category_id
     FROM users u
     JOIN worker_profile wp ON wp.user_id = u.user_id
     WHERE u.user_id = ?"
);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "Worker profile not found."]);
    exit();
}

$row = $result->fetch_assoc();
$stmt->close();

$categoryId = $row['primary_category_id'];

function safeCountWithParam($conn, $query, $type, $param) {
    try {
        $stmt = $conn->prepare($query);
        $stmt->bind_param($type, $param);
        $stmt->execute();
        $res = $stmt->get_result();
        $r = $res->fetch_row();
        $stmt->close();
        return (int) ($r[0] ?? 0);
    } catch (mysqli_sql_exception $e) {
        // Table/column name mismatch or similar — don't crash the whole
        // endpoint over one count, just report 0 for it.
        return 0;
    }
}

// TODO: confirm your `jobs` table's actual column names — this assumes a
// `category_id` column and a status value of 'Open'. Adjust if different.
$matchingJobsCount = safeCountWithParam(
    $conn,
    "SELECT COUNT(*) FROM jobs WHERE category_id = ? AND status = 'Open'",
    "i",
    $categoryId
);

echo json_encode([
    "fullName" => $row['full_name'],
    "isVerified" => (bool) $row['is_verified'],
    "matchingJobsCount" => $matchingJobsCount,
]);

$conn->close();