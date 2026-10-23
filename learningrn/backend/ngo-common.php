<?php
// Shared helpers for the NGO Management endpoints (ngo-*.php).
ini_set('display_errors', '0');
error_reporting(E_ALL);
header('Content-Type: application/json');
require_once 'db.php';

function ngo_body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function ngo_fail($code, $message) {
    http_response_code($code);
    echo json_encode(["error" => $message]);
    exit();
}

// Returns the ngo_id the staff member belongs to, or null if no profile yet.
function ngo_id_for($conn, $userId) {
    $stmt = $conn->prepare("SELECT ngo_id FROM ngo_staff_profile WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ? (int) $row['ngo_id'] : null;
}

// Every NGO endpoint needs a valid NGO Staff user with a completed profile.
function ngo_require($conn, $userId) {
    if (!$userId) ngo_fail(400, "Missing userId.");
    $stmt = $conn->prepare(
        "SELECT r.role_name FROM users u JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row || $row['role_name'] !== 'NGO Staff') ngo_fail(403, "Only NGO staff can use this feature.");

    $ngoId = ngo_id_for($conn, $userId);
    if (!$ngoId) ngo_fail(403, "Please complete your NGO profile first.");
    return $ngoId;
}

// Writes to the existing audit_trail table (used by Activity Monitoring).
function ngo_audit($conn, $userId, $action, $recordId = null) {
    $module = 'NGO';
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $action = mb_substr($action, 0, 100);
    $stmt = $conn->prepare(
        "INSERT INTO audit_trail (user_id, action, module, record_id, ip_address) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("issis", $userId, $action, $module, $recordId, $ip);
    $stmt->execute();
    $stmt->close();
}

function ngo_valid_date($d) {
    $dt = DateTime::createFromFormat('Y-m-d', $d);
    return $dt && $dt->format('Y-m-d') === $d;
}
