// ============================================================
// ClassFlow – Core Types
// ============================================================

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'justified';
export type EvaluationType = 'lab' | 'project' | 'exam' | 'exposition' | 'attitude' | 'task' | 'quiz' | 'participation' | 'work' | 'other';
export type StudentStatus = 'active' | 'inactive' | 'withdrawn';
export type CourseStatus = 'active' | 'completed' | 'draft';
export type AlertType = 'low_grade' | 'low_attendance' | 'consecutive_absences';

// ─── User & Permissions ─────────────────────────────────────
export type UserRole = 'admin' | 'teacher' | 'coordinator' | 'student';

export interface SystemModuleConfig {
  dashboard: boolean;
  courses: boolean;
  students: boolean;
  attendance: boolean;
  grades: boolean;
  exams: boolean;
  reports: boolean;
  settings: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  photo?: string;
  phone?: string;
  department?: string;
  active?: boolean;
  permissions?: Partial<SystemModuleConfig>;
  createdAt: string;
  /** Marca de tiempo (ms) de la última edición de ESTE usuario; sirve para fusionar sin pisar otras cuentas */
  updatedAt?: number;
}

// ─── Course ─────────────────────────────────────────────────
export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  group: string;
  room: string;
  schedule: string;
  startDate: string;
  endDate: string;
  teacherId: string;
  /** Usuario dueño del curso: solo él ve el curso y sus estudiantes, asistencia y notas */
  ownerId?: string;
  status: CourseStatus;
  studentCount?: number;
  averageGrade?: number;
  attendanceRate?: number;
}

// ─── Student ─────────────────────────────────────────────────
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;       // matrícula
  email?: string;
  phone?: string;
  photo?: string;
  status: StudentStatus;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  student?: Student;
  course?: Course;
}

export interface StudentWithStats extends Student {
  courseId?: string;
  courseName?: string;
  group?: string;
  averageGrade: number;
  attendanceRate: number;
  evaluationsCount: number;
}

// ─── Attendance ──────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  student?: Student;
}

export interface AttendanceSession {
  courseId: string;
  date: string;
  records: AttendanceRecord[];
}

export type PeriodId = 'P1' | 'P2' | 'P3' | 'P4'

export interface AcademicPeriodInfo {
  id: PeriodId
  name: string
  shortName: string
  quarter: number
}

export interface EvaluationCriteriaCategory {
  key: string
  name: string
  type: EvaluationType
  weight: number // 40, 30, 15, 15
  color: string
  badgeVariant: 'danger' | 'success' | 'primary' | 'warning' | 'info' | 'neutral'
  description: string
}

// ─── Evaluation ──────────────────────────────────────────────
export interface Evaluation {
  id: string
  courseId: string
  period: PeriodId
  name: string
  type: EvaluationType
  date: string
  description?: string
  maxScore: number
  weight?: number // peso dinámico calculado o asignado
}

// ─── Grade ───────────────────────────────────────────────────
export interface Grade {
  id: string
  studentId: string
  evaluationId: string
  score: number
  notes?: string
  evaluation?: Evaluation
  student?: Student
}

// ─── Course Evaluation Config ────────────────────────────────
export interface EvaluationWeight {
  type: EvaluationType
  weight: number
}

// ─── Alert ───────────────────────────────────────────────────
export interface AcademicAlert {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  averageGrade: number;
  attendanceRate: number;
  alertType: AlertType;
  severity: 'medium' | 'high';
}

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  todayAttendanceRate: number;
  pendingExams: number;
  overallAverage: number;
  atRiskStudents: number;
}

export interface TodayCourse {
  courseId: string;
  courseName: string;
  group: string;
  schedule: string;
  room: string;
  studentCount: number;
  attendanceRate?: number;
  hasAttendanceToday: boolean;
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Form Types ───────────────────────────────────────────────
export interface CreateCourseForm {
  name: string;
  code: string;
  description?: string;
  group: string;
  room: string;
  schedule: string;
  startDate: string;
  endDate: string;
}

export interface CreateStudentForm {
  firstName: string;
  lastName: string;
  studentId: string;
  email?: string;
  phone?: string;
}

export interface CreateEvaluationForm {
  name: string
  type: EvaluationType
  period: PeriodId
  date: string
  description?: string
  maxScore: number
  weight?: number
  courseId: string
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  name: string;
}
