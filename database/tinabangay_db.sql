-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 19, 2026 at 06:13 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tinabangay_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_profile`
--

CREATE TABLE `admin_profile` (
  `admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_trail`
--

CREATE TABLE `audit_trail` (
  `audit_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `availability_schedule`
--

CREATE TABLE `availability_schedule` (
  `schedule_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employer_profile`
--

CREATE TABLE `employer_profile` (
  `employer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_name` varchar(150) DEFAULT NULL,
  `business_permit_no` varchar(50) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `company_address` varchar(255) DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `generated_reports`
--

CREATE TABLE `generated_reports` (
  `report_id` int(11) NOT NULL,
  `report_type` enum('User Activity','Job Postings','Hiring Summary','Verification Summary') NOT NULL,
  `generated_by` int(11) NOT NULL,
  `generate_date` datetime NOT NULL DEFAULT current_timestamp(),
  `file_path` varchar(255) DEFAULT NULL,
  `parameters` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hiring`
--

CREATE TABLE `hiring` (
  `hiring_id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `employer_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `application_id` int(11) DEFAULT NULL,
  `request_id` int(11) DEFAULT NULL,
  `status` enum('Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Ongoing',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `agreed_rate` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `job_id` int(11) NOT NULL,
  `employer_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `budget` decimal(10,2) NOT NULL,
  `location` varchar(255) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `job_type` enum('One-time','Recurring') NOT NULL,
  `status` enum('Open','Filled','Closed','Expired') NOT NULL DEFAULT 'Open',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

CREATE TABLE `job_applications` (
  `application_id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `cover_letter` text DEFAULT NULL,
  `proposed_rate` decimal(10,2) DEFAULT NULL,
  `available_date` date DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected') NOT NULL DEFAULT 'Pending',
  `applied_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_category`
--

CREATE TABLE `job_category` (
  `job_category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_completion`
--

CREATE TABLE `job_completion` (
  `completion_id` int(11) NOT NULL,
  `hiring_id` int(11) NOT NULL,
  `completed_by` int(11) NOT NULL,
  `completion_date` date NOT NULL,
  `employer_confirmed` tinyint(1) NOT NULL DEFAULT 0,
  `worker_confirmed` tinyint(1) NOT NULL DEFAULT 0,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_requests`
--

CREATE TABLE `job_requests` (
  `request_id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `employer_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `request_note` text DEFAULT NULL,
  `status` enum('Pending','Accepted','Declined') NOT NULL DEFAULT 'Pending',
  `requested_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_requirements`
--

CREATE TABLE `job_requirements` (
  `requirement_id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `requirement_text` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `job_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `read_status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ngo`
--

CREATE TABLE `ngo` (
  `ngo_id` int(11) NOT NULL,
  `organization_name` varchar(150) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ngo_beneficiaries`
--

CREATE TABLE `ngo_beneficiaries` (
  `beneficiary_id` int(11) NOT NULL,
  `ngo_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `enrollment_date` date NOT NULL,
  `status` enum('Active','Inactive','Completed') NOT NULL DEFAULT 'Active',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ngo_program`
--

CREATE TABLE `ngo_program` (
  `program_id` int(11) NOT NULL,
  `ngo_id` int(11) NOT NULL,
  `program_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ngo_staff_profile`
--

CREATE TABLE `ngo_staff_profile` (
  `ngo_staff_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ngo_id` int(11) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `job_id` int(11) DEFAULT NULL,
  `message` varchar(255) NOT NULL,
  `notification_type` enum('Application','Request','Message','Verification','System') NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`role_id`, `role_name`, `description`) VALUES
(1, 'Worker', 'Informal worker seeking jobs'),
(2, 'Employer', 'Individual or business hiring workers'),
(3, 'NGO Staff', 'Staff member of a partner NGO'),
(4, 'Admin', 'System administrator');

-- --------------------------------------------------------

--
-- Table structure for table `service_category`
--

CREATE TABLE `service_category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service_category`
--

INSERT INTO `service_category` (`category_id`, `category_name`, `description`) VALUES
(1, 'General Labor', 'Default category for newly registered workers');

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `skill_id` int(11) NOT NULL,
  `skill_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile_no` varchar(15) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `barangay` varchar(50) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_badge` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('Active','Suspended','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `full_name`, `email`, `mobile_no`, `password_hash`, `profile_image`, `barangay`, `is_verified`, `verification_badge`, `created_at`, `status`) VALUES
(3, 1, 'Julia Kraysha Tiongson', '09239105964@tinabangay.local', '09239105964', '$2y$10$3Hfftr7tZxCHdxAYY7I37.dJcpJmSpkFlyRy97CHIigobByr3Lr42', NULL, 'Not specified', 0, NULL, '2026-09-14 14:50:51', 'Active'),
(4, 1, 'Julis tt', '0999999@tinabangay.local', '0999999', '$2y$10$t2M7WmE6ljviPC8Kl2R2de2WkeKmkWc1ZF2Egyf8va2u29eC/z2NG', NULL, 'Not specified', 0, NULL, '2026-09-14 15:39:13', 'Active'),
(5, 1, 'julia krays', '09231@tinabangay.local', '09231', '$2y$10$8OKG.PmOT7JbrpD5Pa.fqucocxkQ0JgdkXnVCMhHHtnTriPduzKAS', NULL, 'Not specified', 0, NULL, '2026-09-14 15:47:29', 'Active'),
(6, 1, 'adasdsa', '0923232@tinabangay.local', '0923232', '$2y$10$HhtJWIciIbZh.z3ejZDGfeHXRCushPo3ZIgxFFm1GTquw9sBBp4X2', NULL, 'Not specified', 0, NULL, '2026-09-14 15:50:08', 'Active'),
(7, 1, 'sdadads', '09090@tinabangay.local', '09090', '$2y$10$QKYMXw.mvdAz47fFBalGQu7ZbLutSpkO1l8NW0o6BO9mMGGlb8J1W', NULL, 'Not specified', 1, NULL, '2026-09-14 15:59:52', 'Active'),
(8, 1, 'sdadadsddddd2', '0909022@tinabangay.local', '0909022', '$2y$10$il.t/qqp/jX2vqYSEv.OpeFZwtlKNHMbyQ/dSrwPLwxfIVK30gNgq', NULL, 'Not specified', 0, NULL, '2026-09-14 16:07:46', 'Active'),
(9, 1, 'sddddddd', '099999@tinabangay.local', '099999', '$2y$10$XLW9o0EaL0fXA9FoHWjBve6e6zO1ihJuTODzg/h8yQrS0JbApVo6C', NULL, 'Not specified', 0, NULL, '2026-09-14 16:14:04', 'Active'),
(11, 1, 'james carl nipaya', 'james@gmail.com', '09991', '$2y$10$sg.E.7ipQvbRqAyHb30Dee2QuC7yTcclb4oVUL5/NAUcS55TzbAUy', NULL, 'Not specified', 1, NULL, '2026-09-14 18:35:19', 'Active'),
(12, 1, 'kendrick amistoso', 'kendrick@gmail.com', '099999999', '$2y$10$hDZaLPQciZb/uFsUUWnOH.AOZCYUM9X7/J/P2XpS6O2uNgV80Zne6', NULL, 'Not specified', 1, NULL, '2026-09-14 19:27:19', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `verification_docs`
--

CREATE TABLE `verification_docs` (
  `doc_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `doc_type` enum('Valid ID','Selfie','Barangay Clearance','NBI Clearance','Business Permit') NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `verification_docs`
--

INSERT INTO `verification_docs` (`doc_id`, `user_id`, `doc_type`, `file_path`, `status`, `uploaded_at`) VALUES
(1, 7, 'Valid ID', 'uploads/verification/user7_id_1789373106.jpg', 'Approved', '2026-09-14 16:05:06'),
(2, 7, 'Selfie', 'uploads/verification/user7_selfie_1789373106.jpg', 'Approved', '2026-09-14 16:05:06'),
(3, 8, 'Valid ID', 'uploads/verification/user8_id_1789373334.jpg', 'Rejected', '2026-09-14 16:08:54'),
(4, 8, 'Selfie', 'uploads/verification/user8_selfie_1789373334.jpg', 'Rejected', '2026-09-14 16:08:54'),
(5, 9, 'Valid ID', 'uploads/verification/user9_id_1789373682.jpg', 'Pending', '2026-09-14 16:14:42'),
(6, 9, 'Selfie', 'uploads/verification/user9_selfie_1789373682.jpg', 'Pending', '2026-09-14 16:14:42'),
(9, 11, 'Valid ID', 'uploads/verification/user11_id_1789382181.jpg', 'Approved', '2026-09-14 18:36:21'),
(10, 11, 'Selfie', 'uploads/verification/user11_selfie_1789382181.jpg', 'Approved', '2026-09-14 18:36:21'),
(11, 12, 'Valid ID', 'uploads/verification/user12_id_1789385250.jpg', 'Approved', '2026-09-14 19:27:31'),
(12, 12, 'Selfie', 'uploads/verification/user12_selfie_1789385250.jpg', 'Approved', '2026-09-14 19:27:31');

-- --------------------------------------------------------

--
-- Table structure for table `verification_history`
--

CREATE TABLE `verification_history` (
  `history_id` int(11) NOT NULL,
  `doc_id` int(11) NOT NULL,
  `reviewed_by` int(11) NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL,
  `remarks` text DEFAULT NULL,
  `reviewed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `worker_profile`
--

CREATE TABLE `worker_profile` (
  `worker_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `primary_category_id` int(11) NOT NULL,
  `about_me` text DEFAULT NULL,
  `average_rating` decimal(3,2) DEFAULT 0.00,
  `total_jobs_completed` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE notification_preferences (
    user_id INT PRIMARY KEY,
    job_matches TINYINT(1) NOT NULL DEFAULT 1,
    request_updates TINYINT(1) NOT NULL DEFAULT 1,
    messages TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
--
-- Dumping data for table `worker_profile`
--

INSERT INTO `worker_profile` (`worker_id`, `user_id`, `primary_category_id`, `about_me`, `average_rating`, `total_jobs_completed`, `created_at`) VALUES
(3, 3, 1, NULL, 0.00, 0, '2026-09-14 14:50:51'),
(4, 4, 1, NULL, 0.00, 0, '2026-09-14 15:39:13'),
(5, 5, 1, NULL, 0.00, 0, '2026-09-14 15:47:29'),
(6, 6, 1, NULL, 0.00, 0, '2026-09-14 15:50:08'),
(7, 7, 1, NULL, 0.00, 0, '2026-09-14 15:59:52'),
(8, 8, 1, NULL, 0.00, 0, '2026-09-14 16:07:46'),
(9, 9, 1, NULL, 0.00, 0, '2026-09-14 16:14:04'),
(11, 11, 1, NULL, 0.00, 0, '2026-09-14 18:35:19'),
(12, 12, 1, NULL, 0.00, 0, '2026-09-14 19:27:19');

-- --------------------------------------------------------

--
-- Table structure for table `worker_skills`
--

CREATE TABLE `worker_skills` (
  `worker_skill_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `years_experience` decimal(3,1) DEFAULT 0.0,
  `certification` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_profile`
--
ALTER TABLE `admin_profile`
  ADD PRIMARY KEY (`admin_id`),
  ADD KEY `fk_adminprofile_user` (`user_id`);

--
-- Indexes for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `fk_audit_user` (`user_id`);

--
-- Indexes for table `availability_schedule`
--
ALTER TABLE `availability_schedule`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `fk_availsched_worker` (`worker_id`);

--
-- Indexes for table `employer_profile`
--
ALTER TABLE `employer_profile`
  ADD PRIMARY KEY (`employer_id`),
  ADD KEY `fk_employerprofile_user` (`user_id`);

--
-- Indexes for table `generated_reports`
--
ALTER TABLE `generated_reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `fk_reports_user` (`generated_by`);

--
-- Indexes for table `hiring`
--
ALTER TABLE `hiring`
  ADD PRIMARY KEY (`hiring_id`),
  ADD KEY `fk_hiring_job` (`job_id`),
  ADD KEY `fk_hiring_employer` (`employer_id`),
  ADD KEY `fk_hiring_worker` (`worker_id`),
  ADD KEY `fk_hiring_application` (`application_id`),
  ADD KEY `fk_hiring_request` (`request_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`job_id`),
  ADD KEY `fk_jobs_employer` (`employer_id`),
  ADD KEY `fk_jobs_category` (`category_id`);

--
-- Indexes for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `fk_jobapp_job` (`job_id`),
  ADD KEY `fk_jobapp_worker` (`worker_id`);

--
-- Indexes for table `job_category`
--
ALTER TABLE `job_category`
  ADD PRIMARY KEY (`job_category_id`);

--
-- Indexes for table `job_completion`
--
ALTER TABLE `job_completion`
  ADD PRIMARY KEY (`completion_id`),
  ADD KEY `fk_jobcompletion_hiring` (`hiring_id`),
  ADD KEY `fk_jobcompletion_user` (`completed_by`);

--
-- Indexes for table `job_requests`
--
ALTER TABLE `job_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `fk_jobreqst_job` (`job_id`),
  ADD KEY `fk_jobreqst_employer` (`employer_id`),
  ADD KEY `fk_jobreqst_worker` (`worker_id`);

--
-- Indexes for table `job_requirements`
--
ALTER TABLE `job_requirements`
  ADD PRIMARY KEY (`requirement_id`),
  ADD KEY `fk_jobreq_job` (`job_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `fk_messages_sender` (`sender_id`),
  ADD KEY `fk_messages_receiver` (`receiver_id`),
  ADD KEY `fk_messages_job` (`job_id`);

--
-- Indexes for table `ngo`
--
ALTER TABLE `ngo`
  ADD PRIMARY KEY (`ngo_id`);

--
-- Indexes for table `ngo_beneficiaries`
--
ALTER TABLE `ngo_beneficiaries`
  ADD PRIMARY KEY (`beneficiary_id`),
  ADD KEY `fk_ngobenef_ngo` (`ngo_id`),
  ADD KEY `fk_ngobenef_user` (`user_id`),
  ADD KEY `fk_ngobenef_program` (`program_id`);

--
-- Indexes for table `ngo_program`
--
ALTER TABLE `ngo_program`
  ADD PRIMARY KEY (`program_id`),
  ADD KEY `fk_ngoprogram_ngo` (`ngo_id`);

--
-- Indexes for table `ngo_staff_profile`
--
ALTER TABLE `ngo_staff_profile`
  ADD PRIMARY KEY (`ngo_staff_id`),
  ADD KEY `fk_ngostaffprofile_user` (`user_id`),
  ADD KEY `fk_ngostaffprofile_ngo` (`ngo_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notif_user` (`user_id`),
  ADD KEY `fk_notif_job` (`job_id`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `service_category`
--
ALTER TABLE `service_category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`skill_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- Indexes for table `verification_docs`
--
ALTER TABLE `verification_docs`
  ADD PRIMARY KEY (`doc_id`),
  ADD KEY `fk_verdocs_user` (`user_id`);

--
-- Indexes for table `verification_history`
--
ALTER TABLE `verification_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `fk_verhist_doc` (`doc_id`),
  ADD KEY `fk_verhist_reviewer` (`reviewed_by`);

--
-- Indexes for table `worker_profile`
--
ALTER TABLE `worker_profile`
  ADD PRIMARY KEY (`worker_id`),
  ADD KEY `fk_workerprofile_user` (`user_id`),
  ADD KEY `fk_workerprofile_category` (`primary_category_id`);

--
-- Indexes for table `worker_skills`
--
ALTER TABLE `worker_skills`
  ADD PRIMARY KEY (`worker_skill_id`),
  ADD KEY `fk_workerskills_worker` (`worker_id`),
  ADD KEY `fk_workerskills_skill` (`skill_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_trail`
--
ALTER TABLE `audit_trail`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `availability_schedule`
--
ALTER TABLE `availability_schedule`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `generated_reports`
--
ALTER TABLE `generated_reports`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hiring`
--
ALTER TABLE `hiring`
  MODIFY `hiring_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `job_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `application_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_category`
--
ALTER TABLE `job_category`
  MODIFY `job_category_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_completion`
--
ALTER TABLE `job_completion`
  MODIFY `completion_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_requests`
--
ALTER TABLE `job_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_requirements`
--
ALTER TABLE `job_requirements`
  MODIFY `requirement_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ngo`
--
ALTER TABLE `ngo`
  MODIFY `ngo_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ngo_beneficiaries`
--
ALTER TABLE `ngo_beneficiaries`
  MODIFY `beneficiary_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ngo_program`
--
ALTER TABLE `ngo_program`
  MODIFY `program_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `service_category`
--
ALTER TABLE `service_category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `skill_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `verification_docs`
--
ALTER TABLE `verification_docs`
  MODIFY `doc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `verification_history`
--
ALTER TABLE `verification_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `worker_skills`
--
ALTER TABLE `worker_skills`
  MODIFY `worker_skill_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_profile`
--
ALTER TABLE `admin_profile`
  ADD CONSTRAINT `fk_adminprofile_id` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_adminprofile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `availability_schedule`
--
ALTER TABLE `availability_schedule`
  ADD CONSTRAINT `fk_availsched_worker` FOREIGN KEY (`worker_id`) REFERENCES `worker_profile` (`worker_id`) ON DELETE CASCADE;

--
-- Constraints for table `employer_profile`
--
ALTER TABLE `employer_profile`
  ADD CONSTRAINT `fk_employerprofile_id` FOREIGN KEY (`employer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_employerprofile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `generated_reports`
--
ALTER TABLE `generated_reports`
  ADD CONSTRAINT `fk_reports_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `hiring`
--
ALTER TABLE `hiring`
  ADD CONSTRAINT `fk_hiring_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications` (`application_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_hiring_employer` FOREIGN KEY (`employer_id`) REFERENCES `employer_profile` (`employer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hiring_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hiring_request` FOREIGN KEY (`request_id`) REFERENCES `job_requests` (`request_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_hiring_worker` FOREIGN KEY (`worker_id`) REFERENCES `worker_profile` (`worker_id`) ON DELETE CASCADE;

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `fk_jobs_category` FOREIGN KEY (`category_id`) REFERENCES `job_category` (`job_category_id`),
  ADD CONSTRAINT `fk_jobs_employer` FOREIGN KEY (`employer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD CONSTRAINT `fk_jobapp_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_jobapp_worker` FOREIGN KEY (`worker_id`) REFERENCES `worker_profile` (`worker_id`) ON DELETE CASCADE;

--
-- Constraints for table `job_completion`
--
ALTER TABLE `job_completion`
  ADD CONSTRAINT `fk_jobcompletion_hiring` FOREIGN KEY (`hiring_id`) REFERENCES `hiring` (`hiring_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_jobcompletion_user` FOREIGN KEY (`completed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `job_requests`
--
ALTER TABLE `job_requests`
  ADD CONSTRAINT `fk_jobreqst_employer` FOREIGN KEY (`employer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_jobreqst_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_jobreqst_worker` FOREIGN KEY (`worker_id`) REFERENCES `worker_profile` (`worker_id`) ON DELETE CASCADE;

--
-- Constraints for table `job_requirements`
--
ALTER TABLE `job_requirements`
  ADD CONSTRAINT `fk_jobreq_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `ngo_beneficiaries`
--
ALTER TABLE `ngo_beneficiaries`
  ADD CONSTRAINT `fk_ngobenef_ngo` FOREIGN KEY (`ngo_id`) REFERENCES `ngo` (`ngo_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ngobenef_program` FOREIGN KEY (`program_id`) REFERENCES `ngo_program` (`program_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ngobenef_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `ngo_program`
--
ALTER TABLE `ngo_program`
  ADD CONSTRAINT `fk_ngoprogram_ngo` FOREIGN KEY (`ngo_id`) REFERENCES `ngo` (`ngo_id`) ON DELETE CASCADE;

--
-- Constraints for table `ngo_staff_profile`
--
ALTER TABLE `ngo_staff_profile`
  ADD CONSTRAINT `fk_ngostaffprofile_id` FOREIGN KEY (`ngo_staff_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ngostaffprofile_ngo` FOREIGN KEY (`ngo_id`) REFERENCES `ngo` (`ngo_id`),
  ADD CONSTRAINT `fk_ngostaffprofile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`);

--
-- Constraints for table `verification_docs`
--
ALTER TABLE `verification_docs`
  ADD CONSTRAINT `fk_verdocs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `verification_history`
--
ALTER TABLE `verification_history`
  ADD CONSTRAINT `fk_verhist_doc` FOREIGN KEY (`doc_id`) REFERENCES `verification_docs` (`doc_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_verhist_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `worker_profile`
--
ALTER TABLE `worker_profile`
  ADD CONSTRAINT `fk_workerprofile_category` FOREIGN KEY (`primary_category_id`) REFERENCES `service_category` (`category_id`),
  ADD CONSTRAINT `fk_workerprofile_id` FOREIGN KEY (`worker_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_workerprofile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `worker_skills`
--
ALTER TABLE `worker_skills`
  ADD CONSTRAINT `fk_workerskills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_workerskills_worker` FOREIGN KEY (`worker_id`) REFERENCES `worker_profile` (`worker_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
