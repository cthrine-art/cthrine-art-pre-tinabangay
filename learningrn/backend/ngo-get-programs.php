<?php
require_once 'ngo-common.php';

$userId = (int) ($_GET['userId'] ?? 0);
$ngoId = ngo_require($conn, $userId);

$s = $conn->prepare(
    "SELECT p.program_id, p.program_name, p.description, p.start_date, p.end_date, p.status,
            (SELECT COUNT(*) FROM ngo_beneficiaries b WHERE b.program_id = p.program_id) AS beneficiary_count
     FROM ngo_program p WHERE p.ngo_id = ? ORDER BY p.start_date DESC, p.program_id DESC"
);
$s->bind_param("i", $ngoId);
$s->execute();
$programs = [];
foreach ($s->get_result()->fetch_all(MYSQLI_ASSOC) as $r) {
    $programs[] = [
        "programId" => (int) $r['program_id'],
        "programName" => $r['program_name'],
        "description" => $r['description'],
        "startDate" => $r['start_date'],
        "endDate" => $r['end_date'],
        "status" => $r['status'],
        "beneficiaryCount" => (int) $r['beneficiary_count'],
    ];
}
echo json_encode(["programs" => $programs]);
$conn->close();
