<?php
require_once 'ngo-common.php';

$userId = (int) ($_GET['userId'] ?? 0);
if (!$userId) ngo_fail(400, "Missing userId.");

$stmt = $conn->prepare(
    "SELECT n.ngo_id, n.organization_name, n.address, n.contact_person, n.email, n.phone, s.position
     FROM ngo_staff_profile s JOIN ngo n ON s.ngo_id = n.ngo_id
     WHERE s.user_id = ?"
);
$stmt->bind_param("i", $userId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

echo json_encode(["profile" => $row ? [
    "ngoId" => (int) $row['ngo_id'],
    "organizationName" => $row['organization_name'],
    "address" => $row['address'],
    "contactPerson" => $row['contact_person'],
    "email" => $row['email'],
    "phone" => $row['phone'],
    "position" => $row['position'],
] : null]);
$conn->close();
