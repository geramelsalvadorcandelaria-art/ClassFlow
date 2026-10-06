-- ============================================================
-- BASE DE DATOS PARA BANAHOSTING (cPanel / MySQL / phpMyAdmin)
-- Sistema de Horarios, Calificaciones y Asistencia (ClassFlow)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `grades`;
DROP TABLE IF EXISTS `evaluations`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `class_schedules`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `academic_periods`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla de Usuarios (Administrador y Profesores)
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'TEACHER') NOT NULL DEFAULT 'TEACHER',
  `photo` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `department` VARCHAR(100) NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Periodos Académicos
CREATE TABLE `academic_periods` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Cursos / Materias
CREATE TABLE `courses` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `group` VARCHAR(50) NOT NULL,
  `room` VARCHAR(50) NOT NULL,
  `schedule` VARCHAR(150) NOT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE NOT NULL,
  `status` ENUM('ACTIVE', 'COMPLETED', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
  `teacherId` VARCHAR(50) NOT NULL,
  `periodId` VARCHAR(50) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`teacherId`),
  CONSTRAINT `fk_course_teacher` FOREIGN KEY (`teacherId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_course_period` FOREIGN KEY (`periodId`) REFERENCES `academic_periods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Estudiantes
CREATE TABLE `students` (
  `id` VARCHAR(50) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `studentId` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `photo` TEXT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'WITHDRAWN') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Inscripciones (Relación Estudiante - Curso)
CREATE TABLE `enrollments` (
  `id` VARCHAR(50) NOT NULL,
  `studentId` VARCHAR(50) NOT NULL,
  `courseId` VARCHAR(50) NOT NULL,
  `enrolledAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_course` (`studentId`, `courseId`),
  INDEX (`courseId`),
  CONSTRAINT `fk_enrollment_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enrollment_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Horarios de Clases Detallados
CREATE TABLE `class_schedules` (
  `id` VARCHAR(50) NOT NULL,
  `courseId` VARCHAR(50) NOT NULL,
  `dayOfWeek` INT NOT NULL COMMENT '0=Lunes, 6=Domingo',
  `startTime` VARCHAR(20) NOT NULL,
  `endTime` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX (`courseId`),
  CONSTRAINT `fk_schedule_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla de Asistencia Diaria
CREATE TABLE `attendance` (
  `id` VARCHAR(50) NOT NULL,
  `studentId` VARCHAR(50) NOT NULL,
  `courseId` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'JUSTIFIED') NOT NULL DEFAULT 'PRESENT',
  `note` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_date` (`studentId`, `courseId`, `date`),
  INDEX `idx_attendance_course_date` (`courseId`, `date`),
  CONSTRAINT `fk_att_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabla de Evaluaciones (Exámenes, Tareas, etc.)
CREATE TABLE `evaluations` (
  `id` VARCHAR(50) NOT NULL,
  `courseId` VARCHAR(50) NOT NULL,
  `period` VARCHAR(20) NOT NULL DEFAULT 'P1',
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('EXAM', 'TASK', 'QUIZ', 'PROJECT', 'PARTICIPATION', 'WORK', 'OTHER') NOT NULL DEFAULT 'EXAM',
  `date` DATE NOT NULL,
  `description` TEXT NULL,
  `maxScore` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  `weight` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`courseId`),
  CONSTRAINT `fk_eval_course` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabla de Calificaciones / Notas
CREATE TABLE `grades` (
  `id` VARCHAR(50) NOT NULL,
  `studentId` VARCHAR(50) NOT NULL,
  `evaluationId` VARCHAR(50) NOT NULL,
  `score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_grade_student_eval` (`studentId`, `evaluationId`),
  INDEX (`evaluationId`),
  CONSTRAINT `fk_grade_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grade_eval` FOREIGN KEY (`evaluationId`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS INICIALES (Usuario Administrador por Defecto)
-- Contraseña temporal: Admin123!
-- Hash bcrypt para "Admin123!"
-- ============================================================
INSERT INTO `users` (`id`, `name`, `email`, `passwordHash`, `role`, `department`, `active`) 
VALUES (
  'usr_admin_principal', 
  'Administrador General', 
  'admin@classflow.com', 
  '$2a$10$w6M6YgGzQvV95XF0M0j5xOxj55.kE26Gk1E7M0l2Y5.g9hQ2Z2F1O', 
  'ADMIN', 
  'Dirección Académica', 
  TRUE
);
