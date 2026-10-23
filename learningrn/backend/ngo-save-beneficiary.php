<?php
require_once 'ngo-common.php';

$d = ngo_body();
$userId = (int) ($d['userId'] ?? 0);
$ngoId = ngo_require($conn, $userId);

$action = $d['action'] ?? 'add'; // add | update | remove
$benId = (int) ($d['beneficiaryId'] ?? 0);

function load_ben($conn, $benId, $ngoId) {
    $s = $conn->prepare(
        "SELECT b.beneficiary_id, u.full_name FROM ngo_beneficiaries b
         JOIN users u ON b.user_id = u.user_id WHERE b.beneficiary_id=? AND b.ngo_id=?"
    );
    $s->bind_param("ii", $benId, $ngoId);
    $s->execute();
    $r = $s->get_result()->fetch_assoc();
    $s->close();
    return $r;
}

if ($action === 'remove') {
    $ben = load_ben($conn, $benId, $ngoId);
    if (!$ben) ngo_fail(404, "Beneficiary not found.");
    $s = $conn->prepare("DELETE FROM ngo_beneficiaries WHERE beneficiary_id=? AND ngo_id=?");
    $s->bind_param("ii", $benId, $ngoId);
    $s->execute();
    $s->close();
    ngo_audit($conn, $userId, "Removed beneficiary: " . $ben['full_name'], $benId);
    echo json_encode(["success" => true]);
    exit();
}

$status = $d['status'] ?? 'Active';
$notes = trim($d['notes'] ?? '');
if (!in_array($status, ['Active', 'Inactive', 'Completed'])) ngo_fail(400, "Invalid status.");

if ($action === 'update') {
    $ben = load_ben($conn, $benId, $ngoId);
    if (!$ben) ngo_fail(404, "Beneficiary not found.");
    $s = $conn->prepare("UPDATE ngo_beneficiaries SET status=?, notes=? WHERE beneficiary_id=? AND ngo_id=?");
    $s->bind_param("ssii", $status, $notes, $benId, $ngoId);
    $s->execute();
    $s->close();
    ngo_audit($conn, $userId, "Updated beneficiary: " . $ben['full_name'] . " ($status)", $benId);
    echo json_encode(["success" => true]);
    exit();
}

if ($action !== 'add') ngo_fail(400, "Invalid action.");

$targetId = (int) ($d['beneficiaryUserId'] ?? 0);
$programId = (int) ($d['programId'] ?? 0);
$enroll = trim($d['enrollmentDate'] ?? date('Y-m-d'));
if (!$targetId || !$programId) ngo_fail(400, "Choose a worker and a program.");
if (!ngo_valid_date($enroll)) ngo_fail(400, "Enrollment date must be in YYYY-MM-DD format.");

$p = $conn->prepare("SELECT program_name FROM ngo_program WHERE program_id=? AND ngo_id=?");
$p->bind_param("ii", $programId, $ngoId);
$p->execute();
if (!$p->get_result()->fetch_assoc()) ngo_fail(404, "Program not found.");
$p->close();

$w = $conn->prepare("SELECT u.full_name FROM users u JOIN role r ON u.role_id=r.role_id WHERE u.user_id=? AND r.role_name='Worker'");
$w->bind_param("i", $targetId);
$w->execute();
$worker = $w->get_result()->fetch_assoc();
$w->close();
if (!$worker) ngo_fail(404, "Worker not found.");

$dup = $conn->prepare("SELECT 1 FROM ngo_beneficiaries WHERE user_id=? AND program_id=?");
$dup->bind_param("ii", $targetId, $programId);
$dup->execute();
if ($dup->get_result()->fetch_assoc()) ngo_fail(409, "This worker is already enrolled in that program.");
$dup->close();

$s = $conn->prepare("INSERT INTO ngo_beneficiaries (ngo_id, user_id, program_id, enrollment_date, status, notes) VALUES (?,?,?,?,?,?)");
$s->bind_param("iiisss", $ngoId, $targetId, $programId, $enroll, $status, $notes);
$s->execute();
$newId = $s->insert_id;
$s->close();

$msg = "You were enrolled in a livelihood program by your NGO partner.";
$n = $conn->prepare("INSERT INTO notifications (user_id, message, notification_type) VALUES (?,?,'System')");
$n->bind_param("is", $targetId, $msg);
$n->execute();
$n->close();

ngo_audit($conn, $userId, "Enrolled beneficiary: " . $worker['full_name'], $newId);
echo json_encode(["success" => true, "beneficiaryId" => (int) $newId]);
$conn->close();
