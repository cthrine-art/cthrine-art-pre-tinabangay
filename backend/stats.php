<?php
// Prevent PHP warnings/notices from leaking raw HTML into the JSON response
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

function safeCount($conn, $query) {
    try {
        $result = $conn->query($query);
        if (!$result) {
            return 0;
        }
        $row = $result->fetch_row();
        return (int) ($row[0] ?? 0);
    } catch (mysqli_sql_exception $e) {
        // Since PHP 8.1, mysqli throws instead of returning false on a bad
        // query (e.g. a table that doesn't exist yet). Don't let one bad
        // count crash the whole endpoint — just report 0 for that stat.
        return 0;
    }
}

$usersCount = safeCount($conn, "SELECT COUNT(*) FROM users");

$jobsCount = safeCount($conn, "SELECT COUNT(*) FROM jobs");

// "Pending" = users with at least one verification doc still awaiting review.
$pendingCount = safeCount(
    $conn,
    "SELECT COUNT(DISTINCT user_id) FROM verification_docs WHERE status = 'Pending'"
);

echo json_encode([
    "users" => $usersCount,
    "jobs" => $jobsCount,
    "pending" => $pendingCount,
]);

$conn->close();