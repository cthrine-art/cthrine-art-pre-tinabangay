<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once 'db.php';

try {

    $stmt = $conn->prepare(
        "SELECT category_id, category_name
         FROM service_category
         ORDER BY category_id ASC"
    );

    if (!$stmt) {
        throw new Exception("Failed to prepare category query.");
    }

    if (!$stmt->execute()) {
        throw new Exception("Failed to load service categories.");
    }

    $result = $stmt->get_result();

    $categories = [];

    while ($row = $result->fetch_assoc()) {
        $categories[] = [
            "id" => (int)$row["category_id"],
            "name" => $row["category_name"]
        ];
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "categories" => $categories
    ]);

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);

    if (isset($conn)) {
        $conn->close();
    }
}
?>