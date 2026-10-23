<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

$stmt = $conn->prepare(
    "SELECT job_category_id, category_name, description
     FROM job_category
     ORDER BY category_name ASC"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "error" => "Unable to prepare category query."
    ]);
    exit();
}

$stmt->execute();

$result = $stmt->get_result();

$categories = [];

while ($row = $result->fetch_assoc()) {
    $categories[] = [
        "categoryId" => (int) $row["job_category_id"],
        "categoryName" => $row["category_name"],
        "description" => $row["description"]
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "categories" => $categories
]);
?>