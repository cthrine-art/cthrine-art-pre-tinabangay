<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$sql = "
    SELECT u.user_id, u.full_name, u.mobile_no, u.barangay, r.role_name
    FROM users u
    JOIN role r ON u.role_id = r.role_id
    WHERE u.is_verified = FALSE
    ORDER BY u.user_id ASC
";
$result = $conn->query($sql);

$pending = [];

while ($user = $result->fetch_assoc()) {
    $userId = $user['user_id'];

    $docsStmt = $conn->prepare(
        "SELECT doc_type, file_path, status FROM verification_docs WHERE user_id = ? AND status = 'Pending'"
    );
    $docsStmt->bind_param("i", $userId);
    $docsStmt->execute();
    $docsResult = $docsStmt->get_result();

    $docs = [];
    while ($doc = $docsResult->fetch_assoc()) {
        $docs[] = $doc;
    }
    $docsStmt->close();

    // Only surface users who actually have pending docs waiting for review.
    if (count($docs) > 0) {
        $pending[] = [
            "userId" => (int) $userId,
            "fullName" => $user['full_name'],
            "mobileNo" => $user['mobile_no'],
            "barangay" => $user['barangay'],
            "role" => $user['role_name'],
            "docs" => $docs,
        ];
    }
}

echo json_encode(["pending" => $pending]);
$conn->close();