<?php
require_once 'ngo-common.php';

$d = ngo_body();
$reviewerId = (int) ($d['userId'] ?? 0);
$targetId = (int) ($d['targetUserId'] ?? 0);
$action = $d['action'] ?? '';
$remarks = trim($d['remarks'] ?? '');

ngo_require($conn, $reviewerId);
if (!$targetId || !in_array($action, ['approve', 'reject'])) ngo_fail(400, "Missing or invalid targetUserId/action.");
if ($action === 'reject' && !$remarks) ngo_fail(400, "Please give a reason so the user knows what to fix.");

$t = $conn->prepare("SELECT u.full_name, r.role_name FROM users u JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?");
$t->bind_param("i", $targetId);
$t->execute();
$target = $t->get_result()->fetch_assoc();
$t->close();
if (!$target || !in_array($target['role_name'], ['Worker', 'Employer'])) {
    ngo_fail(403, "NGO staff can only review Worker and Employer accounts.");
}

$newStatus = $action === 'approve' ? 'Approved' : 'Rejected';
$conn->begin_transaction();
try {
    $q = $conn->prepare("SELECT doc_id FROM verification_docs WHERE user_id=? AND status='Pending'");
    $q->bind_param("i", $targetId);
    $q->execute();
    $docIds = array_column($q->get_result()->fetch_all(MYSQLI_ASSOC), 'doc_id');
    $q->close();
    if (!$docIds) throw new Exception("No pending documents for this user.");

    foreach ($docIds as $docId) {
        $u = $conn->prepare("UPDATE verification_docs SET status=? WHERE doc_id=?");
        $u->bind_param("si", $newStatus, $docId);
        $u->execute();
        $u->close();
        $h = $conn->prepare("INSERT INTO verification_history (doc_id, reviewed_by, status, remarks) VALUES (?,?,?,?)");
        $h->bind_param("iiss", $docId, $reviewerId, $newStatus, $remarks);
        $h->execute();
        $h->close();
    }

    if ($action === 'approve') {
        $v = $conn->prepare("UPDATE users SET is_verified = TRUE WHERE user_id=?");
        $v->bind_param("i", $targetId);
        $v->execute();
        $v->close();
        $msg = "Congratulations! Your account has been verified. You can now log in and use all features.";
    } else {
        $msg = mb_substr("Your verification documents were not approved: $remarks. Please resubmit.", 0, 255);
    }
    $n = $conn->prepare("INSERT INTO notifications (user_id, message, notification_type) VALUES (?,?,'Verification')");
    $n->bind_param("is", $targetId, $msg);
    $n->execute();
    $n->close();

    ngo_audit($conn, $reviewerId, ($action === 'approve' ? "Approved" : "Rejected") . " verification: " . $target['full_name'], $targetId);
    $conn->commit();
    echo json_encode(["success" => true, "userId" => $targetId, "action" => $action]);
} catch (Exception $e) {
    $conn->rollback();
    ngo_fail(500, $e->getMessage());
}
$conn->close();
