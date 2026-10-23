<?php
require_once 'ngo-common.php';

$d = ngo_body();
$userId = (int) ($d['userId'] ?? 0);
$org = trim($d['organizationName'] ?? '');
$address = trim($d['address'] ?? '');
$contact = trim($d['contactPerson'] ?? '');
$email = trim($d['email'] ?? '');
$phone = trim($d['phone'] ?? '');
$position = trim($d['position'] ?? '');

if (!$userId || !$org) ngo_fail(400, "Organization name is required.");
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) ngo_fail(400, "Please enter a valid organization email.");

$chk = $conn->prepare("SELECT r.role_name FROM users u JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?");
$chk->bind_param("i", $userId);
$chk->execute();
$u = $chk->get_result()->fetch_assoc();
$chk->close();
if (!$u || $u['role_name'] !== 'NGO Staff') ngo_fail(403, "Only NGO staff accounts can create an NGO profile.");

$conn->begin_transaction();
try {
    $ngoId = ngo_id_for($conn, $userId);

    if ($ngoId) {
        $s = $conn->prepare("UPDATE ngo SET organization_name=?, address=?, contact_person=?, email=?, phone=? WHERE ngo_id=?");
        $s->bind_param("sssssi", $org, $address, $contact, $email, $phone, $ngoId);
        $s->execute();
        $s->close();
        $p = $conn->prepare("UPDATE ngo_staff_profile SET position=? WHERE user_id=?");
        $p->bind_param("si", $position, $userId);
        $p->execute();
        $p->close();
    } else {
        $s = $conn->prepare("INSERT INTO ngo (organization_name, address, contact_person, email, phone) VALUES (?,?,?,?,?)");
        $s->bind_param("sssss", $org, $address, $contact, $email, $phone);
        $s->execute();
        $ngoId = $s->insert_id;
        $s->close();
        // ngo_staff_id mirrors user_id (same pattern as employer_profile).
        $p = $conn->prepare("INSERT INTO ngo_staff_profile (ngo_staff_id, user_id, ngo_id, position) VALUES (?,?,?,?)");
        $p->bind_param("iiis", $userId, $userId, $ngoId, $position);
        $p->execute();
        $p->close();
    }
    ngo_audit($conn, $userId, "Saved NGO profile: $org", $ngoId);
    $conn->commit();
    echo json_encode(["success" => true, "ngoId" => (int) $ngoId]);
} catch (Exception $e) {
    $conn->rollback();
    ngo_fail(500, "Failed to save NGO profile: " . $e->getMessage());
}
$conn->close();
