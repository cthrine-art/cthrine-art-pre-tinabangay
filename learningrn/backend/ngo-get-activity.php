<?php
require_once 'ngo-common.php';

$userId = (int) ($_GET['userId'] ?? 0);
$ngoId = ngo_require($conn, $userId);

// Per-program progress.
$s = $conn->prepare(
    "SELECT p.program_id, p.program_name, p.status, p.start_date, p.end_date,
            COUNT(b.beneficiary_id) AS total,
            COALESCE(SUM(b.status='Active'),0) AS active,
            COALESCE(SUM(b.status='Inactive'),0) AS inactive,
            COALESCE(SUM(b.status='Completed'),0) AS completed
     FROM ngo_program p LEFT JOIN ngo_beneficiaries b ON b.program_id = p.program_id
     WHERE p.ngo_id = ? GROUP BY p.program_id ORDER BY p.start_date DESC"
);
$s->bind_param("i", $ngoId);
$s->execute();
$programs = [];
foreach ($s->get_result()->fetch_all(MYSQLI_ASSOC) as $r) {
    $programs[] = [
        "programId" => (int) $r['program_id'],
        "programName" => $r['program_name'],
        "status" => $r['status'],
        "startDate" => $r['start_date'],
        "endDate" => $r['end_date'],
        "total" => (int) $r['total'],
        "active" => (int) $r['active'],
        "inactive" => (int) $r['inactive'],
        "completed" => (int) $r['completed'],
    ];
}
$s->close();

// Recent activity by anyone on this NGO's staff.
$l = $conn->prepare(
    "SELECT a.action, a.timestamp, u.full_name
     FROM audit_trail a
     JOIN users u ON a.user_id = u.user_id
     JOIN ngo_staff_profile sp ON sp.user_id = a.user_id
     WHERE a.module = 'NGO' AND sp.ngo_id = ?
     ORDER BY a.timestamp DESC, a.audit_id DESC LIMIT 40"
);
$l->bind_param("i", $ngoId);
$l->execute();
$log = [];
foreach ($l->get_result()->fetch_all(MYSQLI_ASSOC) as $r) {
    $log[] = ["action" => $r['action'], "timestamp" => $r['timestamp'], "staffName" => $r['full_name']];
}
echo json_encode(["programs" => $programs, "log" => $log]);
$conn->close();
