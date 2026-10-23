<?php
require_once 'ngo-common.php';

$d = ngo_body();
$userId = (int) ($d['userId'] ?? 0);
$ngoId = ngo_require($conn, $userId);

$action = $d['action'] ?? 'create'; // create | update | delete
$programId = (int) ($d['programId'] ?? 0);

if (in_array($action, ['update', 'delete'])) {
    if (!$programId) ngo_fail(400, "Missing programId.");
    $o = $conn->prepare("SELECT program_name FROM ngo_program WHERE program_id=? AND ngo_id=?");
    $o->bind_param("ii", $programId, $ngoId);
    $o->execute();
    $existing = $o->get_result()->fetch_assoc();
    $o->close();
    if (!$existing) ngo_fail(404, "Program not found.");
}

if ($action === 'delete') {
    $s = $conn->prepare("DELETE FROM ngo_program WHERE program_id=? AND ngo_id=?");
    $s->bind_param("ii", $programId, $ngoId);
    $s->execute();
    $s->close();
    ngo_audit($conn, $userId, "Deleted program: " . $existing['program_name'], $programId);
    echo json_encode(["success" => true]);
    exit();
}

if (!in_array($action, ['create', 'update'])) ngo_fail(400, "Invalid action.");

$name = trim($d['programName'] ?? '');
$desc = trim($d['description'] ?? '');
$start = trim($d['startDate'] ?? '');
$end = trim($d['endDate'] ?? '');
$status = $d['status'] ?? 'Active';

if (!$name) ngo_fail(400, "Program name is required.");
if (!ngo_valid_date($start)) ngo_fail(400, "Start date must be in YYYY-MM-DD format.");
if ($end !== '' && !ngo_valid_date($end)) ngo_fail(400, "End date must be in YYYY-MM-DD format.");
if ($end !== '' && $end < $start) ngo_fail(400, "End date can't be before the start date.");
if (!in_array($status, ['Active', 'Completed', 'Cancelled'])) ngo_fail(400, "Invalid status.");
$endVal = $end === '' ? null : $end;

if ($action === 'create') {
    $s = $conn->prepare("INSERT INTO ngo_program (ngo_id, program_name, description, start_date, end_date, status) VALUES (?,?,?,?,?,?)");
    $s->bind_param("isssss", $ngoId, $name, $desc, $start, $endVal, $status);
    $s->execute();
    $programId = $s->insert_id;
    $s->close();
    ngo_audit($conn, $userId, "Created program: $name", $programId);
} else {
    $s = $conn->prepare("UPDATE ngo_program SET program_name=?, description=?, start_date=?, end_date=?, status=? WHERE program_id=? AND ngo_id=?");
    $s->bind_param("sssssii", $name, $desc, $start, $endVal, $status, $programId, $ngoId);
    $s->execute();
    $s->close();
    ngo_audit($conn, $userId, "Updated program: $name ($status)", $programId);
}
echo json_encode(["success" => true, "programId" => (int) $programId]);
$conn->close();
