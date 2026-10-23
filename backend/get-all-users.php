<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once 'db.php';

$sql = "
    SELECT u.user_id, u.full_name, u.mobile_no, u.email, u.barangay,
           u.is_verified, u.status, r.role_name
    FROM users u
    JOIN role r ON u.role_id = r.role_id
    ORDER BY u.user_id DESC
";
$result = $conn->query($sql);

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = [
        "userId" => (int) $row['user_id'],
        "fullName" => $row['full_name'],
        "mobileNo" => $row['mobile_no'],
        "email" => $row['email'],
        "barangay" => $row['barangay'],
        "isVerified" => (bool) $row['is_verified'],
        "status" => $row['status'],
        "role" => $row['role_name'],
    ];
}

echo json_encode(["users" => $users]);
$conn->close();