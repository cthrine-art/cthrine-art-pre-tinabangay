<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$fullName = trim($data['fullName'] ?? '');
$email = trim($data['email'] ?? '');
$mobileNumber = trim($data['mobileNumber'] ?? '');
$password = $data['password'] ?? '';

$roleInput = strtoupper(trim($data['role'] ?? ''));

$barangay = trim($data['barangay'] ?? 'Not specified');


/*
|--------------------------------------------------------------------------
| VALIDATE REQUIRED FIELDS
|--------------------------------------------------------------------------
*/

if (!$fullName || !$email || !$mobileNumber || !$password || !$roleInput) {

    http_response_code(400);

    echo json_encode([
        "error" => "Missing required fields."
    ]);

    exit();
}


/*
|--------------------------------------------------------------------------
| VALIDATE EMAIL
|--------------------------------------------------------------------------
*/

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    http_response_code(400);

    echo json_encode([
        "error" => "Please enter a valid email address."
    ]);

    exit();
}


/*
|--------------------------------------------------------------------------
| VALIDATE ROLE
|--------------------------------------------------------------------------
*/

$roleMap = [
    'WORKER' => 'Worker',
    'EMPLOYER' => 'Employer',
    'NGO' => 'NGO Staff'
];

if (!isset($roleMap[$roleInput])) {

    http_response_code(400);

    echo json_encode([
        "error" => "Invalid account type."
    ]);

    exit();
}

$roleName = $roleMap[$roleInput];


/*
|--------------------------------------------------------------------------
| CHECK EXISTING ACCOUNT
|--------------------------------------------------------------------------
*/

$check = $conn->prepare(
    "SELECT user_id
     FROM USERS
     WHERE mobile_no = ? OR email = ?"
);

if (!$check) {

    http_response_code(500);

    echo json_encode([
        "error" => "Unable to check existing account."
    ]);

    exit();
}

$check->bind_param(
    "ss",
    $mobileNumber,
    $email
);

$check->execute();
$check->store_result();

if ($check->num_rows > 0) {

    http_response_code(409);

    echo json_encode([
        "error" => "An account with this mobile number or email already exists."
    ]);

    $check->close();
    $conn->close();

    exit();
}

$check->close();


/*
|--------------------------------------------------------------------------
| GET ROLE ID
|--------------------------------------------------------------------------
*/

$roleStmt = $conn->prepare(
    "SELECT role_id
     FROM ROLE
     WHERE role_name = ?"
);

if (!$roleStmt) {

    http_response_code(500);

    echo json_encode([
        "error" => "Unable to find account role."
    ]);

    $conn->close();

    exit();
}

$roleStmt->bind_param(
    "s",
    $roleName
);

$roleStmt->execute();

$roleResult = $roleStmt->get_result();

if ($roleResult->num_rows === 0) {

    http_response_code(500);

    echo json_encode([
        "error" => "Role '$roleName' was not found in the ROLE table."
    ]);

    $roleStmt->close();
    $conn->close();

    exit();
}

$roleRow = $roleResult->fetch_assoc();

$roleId = (int) $roleRow['role_id'];

$roleStmt->close();


/*
|--------------------------------------------------------------------------
| HASH PASSWORD
|--------------------------------------------------------------------------
*/

$hashedPassword = password_hash(
    $password,
    PASSWORD_BCRYPT
);


/*
|--------------------------------------------------------------------------
| CREATE ACCOUNT
|--------------------------------------------------------------------------
*/

$conn->begin_transaction();

try {

    /*
    |--------------------------------------------------------------------------
    | INSERT USER
    |--------------------------------------------------------------------------
    */

    $stmt = $conn->prepare(
        "INSERT INTO USERS
        (
            role_id,
            full_name,
            email,
            mobile_no,
            password_hash,
            barangay,
            is_verified,
            status
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            FALSE,
            'Active'
        )"
    );

    if (!$stmt) {
        throw new Exception("Unable to prepare user registration.");
    }

    $stmt->bind_param(
        "isssss",
        $roleId,
        $fullName,
        $email,
        $mobileNumber,
        $hashedPassword,
        $barangay
    );

    $stmt->execute();

    $userId = $stmt->insert_id;

    $stmt->close();


    /*
    |--------------------------------------------------------------------------
    | CREATE EMPLOYER PROFILE
    |--------------------------------------------------------------------------
    */

    if ($roleName === 'Employer') {

        $subStmt = $conn->prepare(
            "INSERT INTO EMPLOYER_PROFILE
            (
                employer_id,
                user_id
            )
            VALUES (?, ?)"
        );

        if (!$subStmt) {
            throw new Exception("Unable to create employer profile.");
        }

        $subStmt->bind_param(
            "ii",
            $userId,
            $userId
        );

        $subStmt->execute();

        $subStmt->close();
    }


    /*
    |--------------------------------------------------------------------------
    | NGO
    |--------------------------------------------------------------------------
    |
    | NGO profile creation will be added once the NGO_PROFILE
    | table and NGO profile fields are confirmed.
    |
    */

    if ($roleName === 'NGO') {

        // NGO profile will be created after the NGO profile
        // database structure is confirmed.
    }


    /*
    |--------------------------------------------------------------------------
    | WORKER
    |--------------------------------------------------------------------------
    |
    | We DO NOT assign a job category here.
    |
    | The worker will choose their category later from
    | the Worker Profile using the job_category table.
    |
    */

    if ($roleName === 'Worker') {

        // Worker category will be selected later
        // from the Worker Profile.
    }


    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    $conn->commit();

    echo json_encode([
        "success" => true,
        "userId" => $userId,
        "role" => $roleName,
        "message" => "Account created successfully."
    ]);

} catch (Exception $e) {

    $conn->rollback();

    http_response_code(500);

    echo json_encode([
        "error" => "Failed to create account: " . $e->getMessage()
    ]);
}

$conn->close();

?>