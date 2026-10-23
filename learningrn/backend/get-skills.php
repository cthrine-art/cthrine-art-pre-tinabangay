<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

$stmt = $conn->prepare(
    "SELECT skill_id, skill_name, description
     FROM skills
     ORDER BY skill_name ASC"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Unable to prepare skills query."
    ]);
    exit();
}

$stmt->execute();

$result = $stmt->get_result();

$skills = [];

while ($row = $result->fetch_assoc()) {
    $skills[] = [
        "skillId" => (int) $row["skill_id"],
        "skillName" => $row["skill_name"],
        "description" => $row["description"]
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "skills" => $skills
]);
?>