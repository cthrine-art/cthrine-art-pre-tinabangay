<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

/*
|--------------------------------------------------------------------------
| READ JSON REQUEST
|--------------------------------------------------------------------------
*/

$rawInput = file_get_contents("php://input");

$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON request."
    ]);

    exit();
}

/*
|--------------------------------------------------------------------------
| GET DATA
|--------------------------------------------------------------------------
*/

$userId = $data['userId'] ?? null;
$categoryId = $data['categoryId'] ?? null;

$title = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');

$budget = $data['budget'] ?? null;

$location = trim($data['location'] ?? '');

$latitude = $data['latitude'] ?? null;
$longitude = $data['longitude'] ?? null;

$jobType = trim($data['jobType'] ?? '');

$requiredSkills = $data['requiredSkills'] ?? [];


/*
|--------------------------------------------------------------------------
| BASIC VALIDATION
|--------------------------------------------------------------------------
*/

if ($userId === null || $userId === '') {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Missing userId."
    ]);

    exit();
}

if (!is_numeric($userId)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid userId."
    ]);

    exit();
}

$userId = (int) $userId;


if ($categoryId === null || $categoryId === '') {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Please select a job category."
    ]);

    exit();
}

if (!is_numeric($categoryId)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid category ID."
    ]);

    exit();
}

$categoryId = (int) $categoryId;


if ($title === '') {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Job title is required."
    ]);

    exit();
}


if ($description === '') {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Job description is required."
    ]);

    exit();
}


if ($budget === null || $budget === '' || !is_numeric($budget)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Please enter a valid budget."
    ]);

    exit();
}

$budget = (float) $budget;


if ($budget < 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Budget cannot be negative."
    ]);

    exit();
}


if ($location === '') {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Job location is required."
    ]);

    exit();
}


if ($jobType === '') {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Please select a job type."
    ]);

    exit();
}


/*
|--------------------------------------------------------------------------
| VALID JOB TYPE
|--------------------------------------------------------------------------
*/

$allowedJobTypes = [
    "One-time",
    "Recurring"
];

if (!in_array($jobType, $allowedJobTypes, true)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Invalid job type."
    ]);

    exit();
}


/*
|--------------------------------------------------------------------------
| NORMALIZE COORDINATES
|--------------------------------------------------------------------------
*/

if (
    $latitude === null ||
    $latitude === '' ||
    !is_numeric($latitude)
) {

    $latitude = null;

} else {

    $latitude = (float) $latitude;
}


if (
    $longitude === null ||
    $longitude === '' ||
    !is_numeric($longitude)
) {

    $longitude = null;

} else {

    $longitude = (float) $longitude;
}


/*
|--------------------------------------------------------------------------
| CHECK EMPLOYER ACCOUNT
|--------------------------------------------------------------------------
*/

$checkUser = $conn->prepare(
    "SELECT user_id
     FROM users
     WHERE user_id = ?
     LIMIT 1"
);

if (!$checkUser) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Unable to verify employer account.",
        "details" => $conn->error
    ]);

    exit();
}


$checkUser->bind_param(
    "i",
    $userId
);


if (!$checkUser->execute()) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Unable to check employer account."
    ]);

    $checkUser->close();

    exit();
}


$userResult = $checkUser->get_result();


if ($userResult->num_rows === 0) {

    $checkUser->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "error" => "Employer account not found."
    ]);

    exit();
}


$checkUser->close();


/*
|--------------------------------------------------------------------------
| CHECK JOB CATEGORY
|--------------------------------------------------------------------------
*/

$checkCategory = $conn->prepare(
    "SELECT job_category_id
     FROM job_category
     WHERE job_category_id = ?
     LIMIT 1"
);

if (!$checkCategory) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Unable to verify job category.",
        "details" => $conn->error
    ]);

    exit();
}


$checkCategory->bind_param(
    "i",
    $categoryId
);


if (!$checkCategory->execute()) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "Unable to check job category."
    ]);

    $checkCategory->close();

    exit();
}


$categoryResult = $checkCategory->get_result();


if ($categoryResult->num_rows === 0) {

    $checkCategory->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "error" => "Selected job category does not exist."
    ]);

    exit();
}


$checkCategory->close();


/*
|--------------------------------------------------------------------------
| BEGIN DATABASE TRANSACTION
|--------------------------------------------------------------------------
|
| The job and its requirements should be saved together.
|
*/

$conn->begin_transaction();


try {

    /*
    |--------------------------------------------------------------------------
    | CREATE JOB
    |--------------------------------------------------------------------------
    */

    $stmt = $conn->prepare(
        "INSERT INTO jobs
        (
            employer_id,
            category_id,
            title,
            description,
            budget,
            location,
            latitude,
            longitude,
            job_type,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')"
    );


    if (!$stmt) {

        throw new Exception(
            "Unable to prepare job creation: " . $conn->error
        );
    }


    /*
    |--------------------------------------------------------------------------
    | BIND PARAMETERS
    |--------------------------------------------------------------------------
    |
    | i = integer
    | s = string
    | d = double/decimal
    |
    | employer_id  = i
    | category_id  = i
    | title        = s
    | description  = s
    | budget       = d
    | location     = s
    | latitude     = d
    | longitude    = d
    | job_type     = s
    |
    */

    $stmt->bind_param(
        "iissdsdds",
        $userId,
        $categoryId,
        $title,
        $description,
        $budget,
        $location,
        $latitude,
        $longitude,
        $jobType
    );


    /*
    |--------------------------------------------------------------------------
    | EXECUTE JOB INSERT
    |--------------------------------------------------------------------------
    */

    if (!$stmt->execute()) {

        throw new Exception(
            "Unable to create job: " . $stmt->error
        );
    }


    /*
    |--------------------------------------------------------------------------
    | GET NEW JOB ID
    |--------------------------------------------------------------------------
    */

    $jobId = $stmt->insert_id;


    $stmt->close();


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE REQUIRED SKILLS
    |--------------------------------------------------------------------------
    */

    if (is_string($requiredSkills)) {

        $requiredSkills = explode(
            ",",
            $requiredSkills
        );
    }


    if (!is_array($requiredSkills)) {

        $requiredSkills = [];
    }


    /*
    |--------------------------------------------------------------------------
    | SAVE REQUIRED SKILLS
    |--------------------------------------------------------------------------
    */

    if (count($requiredSkills) > 0) {

        $requirementStmt = $conn->prepare(
            "INSERT INTO job_requirements
            (
                job_id,
                requirement_text
            )
            VALUES (?, ?)"
        );


        if (!$requirementStmt) {

            throw new Exception(
                "Unable to prepare job requirements: " .
                $conn->error
            );
        }


        foreach ($requiredSkills as $skill) {

            $skill = trim((string) $skill);


            if ($skill === '') {
                continue;
            }


            $requirementStmt->bind_param(
                "is",
                $jobId,
                $skill
            );


            if (!$requirementStmt->execute()) {

                throw new Exception(
                    "Unable to save job requirement: " .
                    $requirementStmt->error
                );
            }
        }


        $requirementStmt->close();
    }


    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    $conn->commit();


    /*
    |--------------------------------------------------------------------------
    | SUCCESS RESPONSE
    |--------------------------------------------------------------------------
    */

    $conn->close();


    echo json_encode([
        "success" => true,
        "message" => "Job posted successfully.",
        "jobId" => (int) $jobId,
        "status" => "Open"
    ]);

    exit();


} catch (Exception $e) {

    /*
    |--------------------------------------------------------------------------
    | ROLLBACK
    |--------------------------------------------------------------------------
    */

    $conn->rollback();


    http_response_code(500);


    echo json_encode([
        "success" => false,
        "error" => "Unable to create job.",
        "details" => $e->getMessage()
    ]);


    $conn->close();

    exit();
}

?>