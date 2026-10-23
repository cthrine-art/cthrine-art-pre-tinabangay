<?php
require_once 'ngo-common.php';

$userId = (int) ($_GET['userId'] ?? 0);
ngo_require($conn, $userId);

// Pending: Worker/Employer accounts with documents still waiting for review.
$sql = "SELECT u.user_id, u.full_name, u.mobile_no, u.barangay, r.role_name
        FROM users u JOIN role r ON u.role_id = r.role_id
        WHERE u.is_verified = FALSE AND r.role_name IN ('Worker','Employer')
          AND EXISTS (SELECT 1 FROM verification_docs d WHERE d.user_id = u.user_id AND d.status = 'Pending')
        ORDER BY u.user_id ASC";
$res = $conn->query($sql);

$pending = [];
while ($u = $res->fetch_assoc()) {
    $s = $conn->prepare("SELECT doc_type, file_path, status FROM verification_docs WHERE user_id=? AND status='Pending'");
    $s->bind_param("i", $u['user_id']);
    $s->execute();
    $docs = $s->get_result()->fetch_all(MYSQLI_ASSOC);
    $s->close();
    $pending[] = [
        "userId" => (int) $u['user_id'],
        "fullName" => $u['full_name'],
        "mobileNo" => $u['mobile_no'],
        "barangay" => $u['barangay'],
        "role" => $u['role_name'],
        "docs" => $docs,
    ];
}

// Recent decisions made by NGO staff (from verification_history).
$h = $conn->query(
    "SELECT vh.history_id, vh.status, vh.remarks, vh.reviewed_at,
            tu.full_name AS target_name, rv.full_name AS reviewer_name, d.doc_type
     FROM verification_history vh
     JOIN verification_docs d ON vh.doc_id = d.doc_id
     JOIN users tu ON d.user_id = tu.user_id
     JOIN users rv ON vh.reviewed_by = rv.user_id
     ORDER BY vh.reviewed_at DESC, vh.history_id DESC LIMIT 20"
);
$history = [];
while ($r = $h->fetch_assoc()) {
    $history[] = [
        "historyId" => (int) $r['history_id'],
        "status" => $r['status'],
        "remarks" => $r['remarks'],
        "reviewedAt" => $r['reviewed_at'],
        "targetName" => $r['target_name'],
        "reviewerName" => $r['reviewer_name'],
        "docType" => $r['doc_type'],
    ];
}

echo json_encode(["pending" => $pending, "history" => $history]);
$conn->close();
