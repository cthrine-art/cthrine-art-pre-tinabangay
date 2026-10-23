<?php

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db.php';

$userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid user ID."
    ]);
    exit();
}

/*
|--------------------------------------------------------------------------
| GET WORKER PROFILE
|--------------------------------------------------------------------------
*/

$sql = "
    SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.mobile_no,
        u.is_verified,

        wp.worker_id,
        wp.primary_category_id,
        wp.about_me,

        jc.category_name

    FROM users u

    LEFT JOIN worker_profile wp
        ON u.user_id = wp.user_id

    LEFT JOIN job_category jc
        ON wp.primary_category_id = jc.job_category_id

    WHERE u.user_id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Unable to prepare profile query."
    ]);
    exit();
}

$stmt->bind_param("i", $userId);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    $conn->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "error" => "Worker profile not found."
    ]);

    exit();
}

$profile = $result->fetch_assoc();

$stmt->close();

/*
|--------------------------------------------------------------------------
| GET WORKER SKILLS
|--------------------------------------------------------------------------
*/

$skills = [];

if (!empty($profile["worker_id"])) {

    $skillSql = "
        SELECT
            s.skill_id,
            s.skill_name,
            ws.years_experience,
            ws.certification

        FROM worker_skills ws

        INNER JOIN skills s
            ON ws.skill_id = s.skill_id

        WHERE ws.worker_id = ?

        ORDER BY s.skill_name ASC
    ";

    $skillStmt = $conn->prepare($skillSql);

    if ($skillStmt) {

        $workerId = intval($profile["worker_id"]);

        $skillStmt->bind_param("i", $workerId);
        $skillStmt->execute();

        $skillResult = $skillStmt->get_result();

        while ($skill = $skillResult->fetch_assoc()) {

            $skills[] = [
                "skillId" => (int) $skill["skill_id"],
                "skillName" => $skill["skill_name"],
                "yearsExperience" => $skill["years_experience"] !== null
                    ? (float) $skill["years_experience"]
                    : 0,
                "certification" => $skill["certification"] ?? ""
            ];
        }

        $skillStmt->close();
    }
}

$conn->close();

/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

echo json_encode([
    "success" => true,

    "userId" => (int) $profile["user_id"],
    "workerId" => !empty($profile["worker_id"])
        ? (int) $profile["worker_id"]
        : null,

    "fullName" => $profile["full_name"] ?? "",
    "email" => $profile["email"] ?? "",
    "mobileNo" => $profile["mobile_no"] ?? "",

    "isVerified" =>
        $profile["is_verified"] == 1,

    "primaryCategoryId" =>
        !empty($profile["primary_category_id"])
            ? (int) $profile["primary_category_id"]
            : null,

    "categoryName" =>
        $profile["category_name"] ?? "",

    "aboutMe" =>
        $profile["about_me"] ?? "",

    "skills" => $skills
]);

?>