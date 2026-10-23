<?php
require_once 'ngo-common.php';

$userId = (int) ($_GET['userId'] ?? 0);
ngo_require($conn, $userId);

$q = '%' . trim($_GET['q'] ?? '') . '%';
$s = $conn->prepare(
    "SELECT u.user_id, u.full_name, u.mobile_no, u.barangay
     FROM users u JOIN role r ON u.role_id = r.role_id
     WHERE r.role_name = 'Worker' AND u.status = 'Active'
       AND (u.full_name LIKE ? OR u.mobile_no LIKE ? OR u.barangay LIKE ?)
     ORDER BY u.full_name ASC LIMIT 20"
);
$s->bind_param("sss", $q, $q, $q);
$s->execute();
$workers = [];
foreach ($s->get_result()->fetch_all(MYSQLI_ASSOC) as $r) {
    $workers[] = [
        "userId" => (int) $r['user_id'],
        "fullName" => $r['full_name'],
        "mobileNo" => $r['mobile_no'],
        "barangay" => $r['barangay'],
    ];
}
echo json_encode(["workers" => $workers]);
$conn->close();
