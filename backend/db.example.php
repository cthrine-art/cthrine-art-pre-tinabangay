<?php

// Copy this file to db.php and update the values for your local environment.

$host = "localhost";
$db_name = "tinabangay_db";
$username = "root";
$password = "";

$conn = new mysqli($host, $username, $password, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}
?>
