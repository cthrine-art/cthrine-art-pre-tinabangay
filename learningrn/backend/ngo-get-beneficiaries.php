<?php
require_once 'ngo-common.php';

$userId = (int) ($_GET['userId'] ?? 0);
$ngoId = ngo_require($conn, $userId);
$programId = (int) ($_GET['programId'] ?? 0);

$sql = "SELECT b.beneficiary_id, b.user_id, b.program_id, b.enrollment_date, b.status, b.notes,
               u.full_name, u.mobile_no, u.barangay, p.program_name,
               COALESCE(w.total_jobs_completed, 0) AS jobs_completed
        FROM ngo_beneficiaries b
        JOIN users u ON b.user_id = u.user_id
        JOIN ngo_program p ON b.program_id = p.program_id
        LEFT JOIN worker_profile w ON w.user_id = u.user_id
        WHERE b.ngo_id = ?" . ($programId ? " AND b.program_id = ?" : "") . "
        ORDER BY b.enrollment_date DESC, b.beneficiary_id DESC";
$s = $conn->prepare($sql);
if ($programId) $s->bind_param("ii", $ngoId, $programId); else $s->bind_param("i", $ngoId);
$s->execute();

$list = [];
foreach ($s->get_result()->fetch_all(MYSQLI_ASSOC) as $r) {
    $list[] = [
        "beneficiaryId" => (int) $r['beneficiary_id'],
        "userId" => (int) $r['user_id'],
        "programId" => (int) $r['program_id'],
        "programName" => $r['program_name'],
        "fullName" => $r['full_name'],
        "mobileNo" => $r['mobile_no'],
        "barangay" => $r['barangay'],
        "enrollmentDate" => $r['enrollment_date'],
        "status" => $r['status'],
        "notes" => $r['notes'],
        "jobsCompleted" => (int) $r['jobs_completed'],
    ];
}
echo json_encode(["beneficiaries" => $list]);
$conn->close();
