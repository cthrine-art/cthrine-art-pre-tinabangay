<?php
require_once 'ngo-common.php';

$userId = (int) ($_GET['userId'] ?? 0);
$ngoId = ngo_require($conn, $userId);

function one($conn, $sql, $types = "", ...$params) {
    $s = $conn->prepare($sql);
    if ($types) $s->bind_param($types, ...$params);
    $s->execute();
    $r = $s->get_result()->fetch_row();
    $s->close();
    return (int) ($r[0] ?? 0);
}

echo json_encode([
    "pendingVerifications" => one($conn,
        "SELECT COUNT(DISTINCT d.user_id) FROM verification_docs d
         JOIN users u ON d.user_id = u.user_id JOIN role r ON u.role_id = r.role_id
         WHERE d.status = 'Pending' AND r.role_name IN ('Worker','Employer')"),
    "activePrograms" => one($conn, "SELECT COUNT(*) FROM ngo_program WHERE ngo_id=? AND status='Active'", "i", $ngoId),
    "totalPrograms" => one($conn, "SELECT COUNT(*) FROM ngo_program WHERE ngo_id=?", "i", $ngoId),
    "activeBeneficiaries" => one($conn, "SELECT COUNT(*) FROM ngo_beneficiaries WHERE ngo_id=? AND status='Active'", "i", $ngoId),
    "completedBeneficiaries" => one($conn, "SELECT COUNT(*) FROM ngo_beneficiaries WHERE ngo_id=? AND status='Completed'", "i", $ngoId),
]);
$conn->close();
