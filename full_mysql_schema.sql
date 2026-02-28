-- Full MySQL schema for the Moses app
-- Engine: MySQL 8+

CREATE DATABASE IF NOT EXISTS `mose` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mose`;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `membership_registrations` (
  `id` CHAR(36) NOT NULL,
  `tns_number` VARCHAR(50) NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `alternative_phone` VARCHAR(30) NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `zip_code` VARCHAR(30) NOT NULL,
  `country` VARCHAR(100) NULL,
  `id_number` VARCHAR(50) NULL,
  `sex` VARCHAR(20) NULL,
  `marital_status` VARCHAR(30) NULL,
  `emergency_contact_name` VARCHAR(200) NOT NULL,
  `emergency_contact_phone` VARCHAR(30) NOT NULL,
  `membership_type` VARCHAR(50) NOT NULL,
  `registration_status` VARCHAR(30) NULL DEFAULT 'pending',
  `payment_status` VARCHAR(30) NULL DEFAULT 'pending',
  `maturity_status` VARCHAR(30) NULL,
  `days_to_maturity` INT NULL,
  `registration_date` DATETIME NULL,
  `probation_end_date` DATETIME NULL,
  `profile_picture_url` TEXT NULL,
  `mpesa_payment_reference` VARCHAR(100) NULL,
  `user_id` CHAR(36) NULL,
  `children_data` JSON NULL,
  `spouse_name` VARCHAR(200) NULL,
  `spouse_phone` VARCHAR(30) NULL,
  `spouse_alt_phone` VARCHAR(30) NULL,
  `spouse_id_number` VARCHAR(50) NULL,
  `spouse_sex` VARCHAR(20) NULL,
  `spouse_area_of_residence` VARCHAR(150) NULL,
  `spouse_photo_url` TEXT NULL,
  `parent1_name` VARCHAR(200) NULL,
  `parent1_phone` VARCHAR(30) NULL,
  `parent1_alt_phone` VARCHAR(30) NULL,
  `parent1_id_number` VARCHAR(50) NULL,
  `parent1_area` VARCHAR(150) NULL,
  `parent2_name` VARCHAR(200) NULL,
  `parent2_phone` VARCHAR(30) NULL,
  `parent2_alt_phone` VARCHAR(30) NULL,
  `parent2_id_number` VARCHAR(50) NULL,
  `parent2_area` VARCHAR(150) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_membership_tns_number` (`tns_number`),
  KEY `idx_membership_email` (`email`),
  KEY `idx_membership_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_registrations` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `staff_role` VARCHAR(50) NOT NULL,
  `assigned_area` VARCHAR(150) NULL,
  `portal_password` VARCHAR(255) NULL,
  `pending` VARCHAR(30) NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_staff_email` (`email`),
  KEY `idx_staff_role` (`staff_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `phone` VARCHAR(30) NULL,
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `zip_code` VARCHAR(30) NULL,
  `emergency_contact_name` VARCHAR(200) NULL,
  `emergency_contact_phone` VARCHAR(30) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profiles_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `member_balances` (
  `id` CHAR(36) NOT NULL,
  `member_id` CHAR(36) NOT NULL,
  `current_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_contributions` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_disbursements` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `last_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_member_balances_member_id` (`member_id`),
  CONSTRAINT `fk_member_balances_member_id`
    FOREIGN KEY (`member_id`) REFERENCES `membership_registrations` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contributions` (
  `id` CHAR(36) NOT NULL,
  `member_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `contribution_type` VARCHAR(50) NOT NULL DEFAULT 'monthly',
  `status` VARCHAR(30) NOT NULL DEFAULT 'completed',
  `contribution_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contributions_member_id` (`member_id`),
  KEY `idx_contributions_date` (`contribution_date`),
  CONSTRAINT `fk_contributions_member_id`
    FOREIGN KEY (`member_id`) REFERENCES `membership_registrations` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `disbursements` (
  `id` CHAR(36) NOT NULL,
  `member_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `reason` TEXT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `disbursement_type` VARCHAR(50) NULL,
  `disbursement_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` CHAR(36) NULL,
  `bereavement_form_url` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_disbursements_member_id` (`member_id`),
  KEY `idx_disbursements_date` (`disbursement_date`),
  CONSTRAINT `fk_disbursements_member_id`
    FOREIGN KEY (`member_id`) REFERENCES `membership_registrations` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `disbursement_documents` (
  `id` CHAR(36) NOT NULL,
  `disbursement_id` CHAR(36) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(100) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `file_data` LONGTEXT NOT NULL,
  `uploaded_by` CHAR(36) NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_disbursement_documents_disbursement_id` (`disbursement_id`),
  CONSTRAINT `fk_disbursement_documents_disbursement_id`
    FOREIGN KEY (`disbursement_id`) REFERENCES `disbursements` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `documents` (
  `id` CHAR(36) NOT NULL,
  `disbursement_id` CHAR(36) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(100) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `file_data` LONGTEXT NOT NULL,
  `uploaded_by` CHAR(36) NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_documents_disbursement_id` (`disbursement_id`),
  CONSTRAINT `fk_documents_disbursement_id`
    FOREIGN KEY (`disbursement_id`) REFERENCES `disbursements` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `monthly_expenses` (
  `id` CHAR(36) NOT NULL,
  `expense_category` VARCHAR(80) NOT NULL,
  `description` TEXT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `expense_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `month_year` VARCHAR(7) NOT NULL,
  `approved_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_monthly_expenses_month_year` (`month_year`),
  KEY `idx_monthly_expenses_expense_date` (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mpesa_payments` (
  `id` CHAR(36) NOT NULL,
  `member_id` CHAR(36) NOT NULL,
  `phone_number` VARCHAR(30) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `merchant_request_id` VARCHAR(120) NULL,
  `checkout_request_id` VARCHAR(120) NULL,
  `mpesa_receipt_number` VARCHAR(120) NULL,
  `result_code` VARCHAR(20) NULL,
  `result_desc` TEXT NULL,
  `transaction_date` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mpesa_payments_member_id` (`member_id`),
  KEY `idx_mpesa_payments_status` (`status`),
  CONSTRAINT `fk_mpesa_payments_member_id`
    FOREIGN KEY (`member_id`) REFERENCES `membership_registrations` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `task_type` VARCHAR(50) NOT NULL,
  `submitted_by` CHAR(36) NOT NULL,
  `submitted_to_role` VARCHAR(50) NOT NULL,
  `assigned_area` VARCHAR(150) NULL,
  `priority` VARCHAR(20) NULL DEFAULT 'normal',
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_status` (`status`),
  KEY `idx_tasks_submitted_to_role` (`submitted_to_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(30) NULL DEFAULT 'new',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_submissions_status` (`status`),
  KEY `idx_contact_submissions_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional seed-safe helper view for quick balances
CREATE OR REPLACE VIEW `v_member_financial_summary` AS
SELECT
  m.id AS member_id,
  m.first_name,
  m.last_name,
  COALESCE(b.current_balance, 0) AS current_balance,
  COALESCE(b.total_contributions, 0) AS total_contributions,
  COALESCE(b.total_disbursements, 0) AS total_disbursements
FROM membership_registrations m
LEFT JOIN member_balances b ON b.member_id = m.id;
