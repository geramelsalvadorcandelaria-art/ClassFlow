import { useState, useEffect } from 'react'
import type {
  Course, Student, Enrollment, AttendanceRecord, Evaluation, Grade,
  DashboardStats, TodayCourse, AcademicAlert, StudentWithStats, AttendanceStatus, User
} from '@/types'
import { todayISO } from '@/lib/utils'
import realStudentsFile from './realStudentsData.json'

export const REAL_COURSES: Course[] = realStudentsFile.courses as Course[]
export const REAL_STUDENTS_BY_COURSE: Record<string, Student[]> = realStudentsFile.students as Record<string, Student[]>

/** Dueño por defecto de los cursos preexistentes */
export const LEGACY_OWNER_ID = 'u-admin'

export const GERAMEL_IDS = ['u-admin', 'u-geramel']
export const PEDRO_IDS = ['u-1791219104305', 'u-pedro']

export function isSameOwner(courseOwnerId: string | undefined, currentUserId: string | null): boolean {
  if (!currentUserId) return false
  const owner = courseOwnerId || LEGACY_OWNER_ID
  if (owner === currentUserId) return true
  if (GERAMEL_IDS.includes(owner) && GERAMEL_IDS.includes(currentUserId)) return true
  if (PEDRO_IDS.includes(owner) && PEDRO_IDS.includes(currentUserId)) return true
  return false
}

/** Id del usuario con sesión activa (leído del almacenamiento de sesión, sin dependencia circular con el store) */
export function getCurrentUserId(): string | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('classflow-auth-v3')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.user?.id ?? null
  } catch {
    return null
  }
}

function withOwner(courses: Course[]): Course[] {
  return courses.map((c) => (c.ownerId ? c : { ...c, ownerId: LEGACY_OWNER_ID }))
}

// ─── Seed data ────────────────────────────────────────────────

export const MOCK_COURSES: Course[] = [
  ...REAL_COURSES,
  {
    id: 'c1', name: 'Desarrollo Web', code: 'DW-101', group: 'A-01',
    room: '204', schedule: 'Lun/Mié/Vie 8:00-9:30', startDate: '2026-08-01', endDate: '2026-12-15',
    teacherId: 'u1', status: 'active', description: 'Fundamentos de desarrollo web moderno',
    studentCount: 28, averageGrade: 84.5, attendanceRate: 93,
  },
  {
    id: 'c2', name: 'Bases de Datos', code: 'BD-201', group: 'B-01',
    room: '301', schedule: 'Mar/Jue 10:00-12:00', startDate: '2026-08-01', endDate: '2026-12-15',
    teacherId: 'u1', status: 'active', description: 'Diseño y administración de bases de datos relacionales',
    studentCount: 24, averageGrade: 78.2, attendanceRate: 88,
  },
  {
    id: 'c3', name: 'Algoritmos y Programación', code: 'AP-102', group: 'C-02',
    room: '105', schedule: 'Lun/Mié 14:00-16:00', startDate: '2026-08-01', endDate: '2026-12-15',
    teacherId: 'u1', status: 'active', description: 'Fundamentos de algoritmia y programación estructurada',
    studentCount: 30, averageGrade: 72.8, attendanceRate: 85,
  },
  {
    id: 'c4', name: 'Redes y Comunicaciones', code: 'RC-301', group: 'D-01',
    room: '210', schedule: 'Vie 8:00-12:00', startDate: '2026-08-01', endDate: '2026-12-15',
    teacherId: 'u1', status: 'active', description: 'Principios de redes de computadoras y comunicaciones',
    studentCount: 22, averageGrade: 81.0, attendanceRate: 91,
  },
]

function makeStudents(courseId: string, count: number): Student[] {
  const firstNames = ['Ana', 'Carlos', 'María', 'Luis', 'Sofía', 'Pedro', 'Laura', 'Miguel', 'Valentina', 'Diego',
    'Isabella', 'Juan', 'Camila', 'Andrés', 'Natalia', 'Ricardo', 'Paula', 'Sebastián', 'Gabriela', 'Felipe',
    'Daniela', 'Esteban', 'Carolina', 'Javier', 'Alejandra', 'Roberto', 'Melissa', 'Álvaro', 'Paola', 'Ernesto']
  const lastNames = ['García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez',
    'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales', 'Jiménez', 'Cruz', 'Ortiz', 'Castillo', 'Vargas',
    'Ramos', 'Herrera', 'Medina', 'Aguilar', 'Vega', 'Castro', 'Rojas', 'Mendoza', 'Guerrero', 'Serrano']
  return Array.from({ length: count }, (_, i) => ({
    id: `${courseId}-s${i + 1}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    studentId: `2026-${courseId.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@edu.classflow.com`,
    phone: `+1 (555) ${String(Math.floor(Math.random() * 9000000) + 1000000).replace(/(\d{3})(\d{4})/, '$1-$2')}`,
    status: i < count - 2 ? 'active' : (i === count - 2 ? 'inactive' : 'active'),
    createdAt: '2026-08-01T00:00:00Z',
  }))
}

export const MOCK_STUDENTS_BY_COURSE: Record<string, Student[]> = {
  ...REAL_STUDENTS_BY_COURSE,
  c1: makeStudents('c1', 28),
  c2: makeStudents('c2', 24),
  c3: makeStudents('c3', 30),
  c4: makeStudents('c4', 22),
}

export const MOCK_EVALUATIONS: Record<string, Evaluation[]> = {
  c1: [
    { id: 'e1-1', courseId: 'c1', period: 'P1', name: 'Examen 1', type: 'exam', date: '2026-09-15', maxScore: 100, weight: 10 },
    { id: 'e1-1b', courseId: 'c1', period: 'P1', name: 'Examen 2', type: 'exam', date: '2026-09-22', maxScore: 100, weight: 10 },
    { id: 'e1-1c', courseId: 'c1', period: 'P1', name: 'Examen 3', type: 'exam', date: '2026-09-29', maxScore: 100, weight: 10 },
    { id: 'e1-1d', courseId: 'c1', period: 'P1', name: 'Examen 4', type: 'exam', date: '2026-10-06', maxScore: 100, weight: 10 },
    { id: 'e1-2', courseId: 'c1', period: 'P1', name: 'Tarea 1: Guía Práctica', type: 'task', date: '2026-09-18', maxScore: 100, weight: 15 },
    { id: 'e1-2b', courseId: 'c1', period: 'P1', name: 'Tarea 2: Ejercicios', type: 'task', date: '2026-09-26', maxScore: 100, weight: 15 },
    { id: 'e1-3', courseId: 'c1', period: 'P1', name: 'Participación en Clases', type: 'participation', date: '2026-09-30', maxScore: 100, weight: 15 },
    { id: 'e1-4', courseId: 'c1', period: 'P1', name: 'Actitudes y Valores P1', type: 'other', date: '2026-10-05', maxScore: 100, weight: 15 },
    { id: 'e1-5', courseId: 'c1', period: 'P2', name: 'Examen Parcial 2', type: 'exam', date: '2026-11-15', maxScore: 100, weight: 40 },
    { id: 'e1-6', courseId: 'c1', period: 'P2', name: 'Tarea 2: Proyecto Individual', type: 'task', date: '2026-11-20', maxScore: 100, weight: 30 },
    { id: 'e1-7', courseId: 'c1', period: 'P2', name: 'Participación en Clases P2', type: 'participation', date: '2026-11-28', maxScore: 100, weight: 15 },
    { id: 'e1-8', courseId: 'c1', period: 'P2', name: 'Actitudes y Convivencia P2', type: 'other', date: '2026-12-02', maxScore: 100, weight: 15 },
  ],
  c2: [
    { id: 'e2-1', courseId: 'c2', period: 'P1', name: 'Examen 1', type: 'exam', date: '2026-09-20', maxScore: 100, weight: 40 },
    { id: 'e2-2', courseId: 'c2', period: 'P1', name: 'Tareas P1', type: 'task', date: '2026-09-25', maxScore: 100, weight: 30 },
    { id: 'e2-3', courseId: 'c2', period: 'P1', name: 'Participación', type: 'participation', date: '2026-09-30', maxScore: 100, weight: 15 },
    { id: 'e2-4', courseId: 'c2', period: 'P1', name: 'Actitudes', type: 'other', date: '2026-10-05', maxScore: 100, weight: 15 },
  ],
  c3: [
    { id: 'e3-1', courseId: 'c3', period: 'P1', name: 'Examen 1', type: 'exam', date: '2026-09-20', maxScore: 100, weight: 40 },
    { id: 'e3-2', courseId: 'c3', period: 'P1', name: 'Tareas P1', type: 'task', date: '2026-09-25', maxScore: 100, weight: 30 },
    { id: 'e3-3', courseId: 'c3', period: 'P1', name: 'Participación', type: 'participation', date: '2026-09-30', maxScore: 100, weight: 15 },
    { id: 'e3-4', courseId: 'c3', period: 'P1', name: 'Actitudes', type: 'other', date: '2026-10-05', maxScore: 100, weight: 15 },
  ],
  c4: [
    { id: 'e4-1', courseId: 'c4', period: 'P1', name: 'Examen 1', type: 'exam', date: '2026-09-20', maxScore: 100, weight: 40 },
    { id: 'e4-2', courseId: 'c4', period: 'P1', name: 'Tareas P1', type: 'task', date: '2026-09-25', maxScore: 100, weight: 30 },
    { id: 'e4-3', courseId: 'c4', period: 'P1', name: 'Participación', type: 'participation', date: '2026-09-30', maxScore: 100, weight: 15 },
    { id: 'e4-4', courseId: 'c4', period: 'P1', name: 'Actitudes', type: 'other', date: '2026-10-05', maxScore: 100, weight: 15 },
  ],
}

function makeGrades(students: Student[], evaluations: Evaluation[]): Grade[] {
  return students.flatMap((s, si) =>
    evaluations.map((ev) => ({
      id: `g-${s.id}-${ev.id}`,
      studentId: s.id,
      evaluationId: ev.id,
      score: Math.min(100, Math.max(50, 70 + Math.sin(si * 0.7 + ev.id.charCodeAt(ev.id.length - 1)) * 25 + (si % 5) * 3)),
    }))
  )
}

export const MOCK_GRADES: Record<string, Grade[]> = {
  c1: makeGrades(MOCK_STUDENTS_BY_COURSE.c1, MOCK_EVALUATIONS.c1),
  c2: makeGrades(MOCK_STUDENTS_BY_COURSE.c2, MOCK_EVALUATIONS.c2),
  c3: makeGrades(MOCK_STUDENTS_BY_COURSE.c3, MOCK_EVALUATIONS.c3),
  c4: makeGrades(MOCK_STUDENTS_BY_COURSE.c4, MOCK_EVALUATIONS.c4),
}

const STATUSES: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'late', 'absent', 'justified']
function makeAttendance(students: Student[], courseId: string): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const dates: string[] = []
  for (let i = 20; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d.toISOString().split('T')[0])
  }
  students.forEach((s, si) => {
    dates.forEach((date, di) => {
      const status = STATUSES[(si + di) % STATUSES.length]
      records.push({ id: `att-${s.id}-${date}`, studentId: s.id, courseId, date, status })
    })
  })
  return records
}

export const MOCK_ATTENDANCE: Record<string, AttendanceRecord[]> = {
  c1: makeAttendance(MOCK_STUDENTS_BY_COURSE.c1, 'c1'),
  c2: makeAttendance(MOCK_STUDENTS_BY_COURSE.c2, 'c2'),
  c3: makeAttendance(MOCK_STUDENTS_BY_COURSE.c3, 'c3'),
  c4: makeAttendance(MOCK_STUDENTS_BY_COURSE.c4, 'c4'),
}

// ─── Derived ──────────────────────────────────────────────────

export function getDashboardStats(): DashboardStats {
  const total = Object.values(MOCK_STUDENTS_BY_COURSE).reduce((s, arr) => s + arr.length, 0)
  return {
    totalCourses: MOCK_COURSES.length,
    totalStudents: total,
    todayAttendanceRate: 92,
    pendingExams: 3,
    overallAverage: 79.1,
    atRiskStudents: 5,
  }
}

export function getTodayCourses(): TodayCourse[] {
  return db.courses.list().slice(0, 3).map((c) => ({
    courseId: c.id, courseName: c.name, group: c.group,
    schedule: c.schedule, room: c.room,
    studentCount: (db.students.list(c.id) ?? []).length,
    attendanceRate: c.attendanceRate,
    hasAttendanceToday: false,
  }))
}

export function getStudentWithStats(studentId: string, courseId: string): StudentWithStats | null {
  const students = db.students.list(courseId)
  const s = students.find((x) => x.id === studentId)
  if (!s) return null
  const course = db.courses.get(courseId)
  const grades = db.grades.listByStudent(courseId, studentId)
  const evals = db.evaluations.list(courseId)
  const avg = grades.length
    ? grades.reduce((sum, g) => {
        const ev = evals.find((e) => e.id === g.evaluationId)
        return ev ? sum + (g.score / ev.maxScore) * 100 : sum
      }, 0) / grades.length
    : 0
  const att = db.attendance.list(courseId).filter((a) => a.studentId === studentId)
  const present = att.filter((a) => a.status === 'present' || a.status === 'late').length
  return {
    ...s, courseId, courseName: course?.name, group: course?.group,
    averageGrade: Math.round(avg * 10) / 10,
    attendanceRate: att.length ? Math.round((present / att.length) * 100) : 0,
    evaluationsCount: grades.length,
  }
}

export function getAcademicAlerts(): AcademicAlert[] {
  const alerts: AcademicAlert[] = []
  db.courses.list().forEach((course) => {
    const students = db.students.list(course.id)
    students.forEach((s) => {
      const sw = getStudentWithStats(s.id, course.id)
      if (!sw) return
      if (sw.averageGrade > 0 && sw.averageGrade < 70) {
        alerts.push({
          studentId: s.id, studentName: `${s.firstName} ${s.lastName}`,
          courseId: course.id, courseName: course.name,
          averageGrade: sw.averageGrade, attendanceRate: sw.attendanceRate,
          alertType: 'low_grade', severity: sw.averageGrade < 60 ? 'high' : 'medium',
        })
      }
      if (sw.attendanceRate > 0 && sw.attendanceRate < 80) {
        alerts.push({
          studentId: s.id, studentName: `${s.firstName} ${s.lastName}`,
          courseId: course.id, courseName: course.name,
          averageGrade: sw.averageGrade, attendanceRate: sw.attendanceRate,
          alertType: 'low_attendance', severity: 'medium',
        })
      }
    })
  })
  return alerts.slice(0, 10)
}

export function getAllStudents(): StudentWithStats[] {
  return db.courses.list().flatMap((course) =>
    db.students.list(course.id).map((s) => {
      const sw = getStudentWithStats(s.id, course.id)
      return sw ?? {
        ...s,
        averageGrade: 0,
        attendanceRate: 0,
        evaluationsCount: 0,
        courseId: course.id,
        courseName: course.name,
        group: course.group,
      }
    })
  )
}

export function getAttendanceForDate(courseId: string, date: string): AttendanceRecord[] {
  return db.attendance.listByDate(courseId, date)
}

// ─── Mutable persistent state (LocalStorage Database) ────────────────
export const DEFAULT_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'geramel',
    email: 'carooveneno@gmail.com',
    role: 'admin',
    password: 'admin',
    photo: '',
    department: 'geramelsalvadorcandelaria@gmail.com',
    phone: '829-505-4822',
    active: true,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'u-1791219104305',
    name: 'PEDRO',
    email: 'pjceballos12@gmail.com',
    role: 'admin',
    password: '12345678',
    photo: '',
    department: 'pjceballos12@gmail.com',
    phone: '+1 (555) 000-0000',
    active: true,
    createdAt: '2026-10-05T16:51:44.305Z',
  },
  {
    id: 'u1',
    name: 'Prof. García',
    email: 'profesor@classflow.com',
    role: 'teacher',
    password: 'demo',
    photo: '',
    department: 'Ciencias y Tecnología',
    phone: '+1 (555) 234-5678',
    active: true,
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'u-coord',
    name: 'Lic. Fernández',
    email: 'coordinacion@classflow.com',
    role: 'coordinator',
    password: 'coord',
    photo: '',
    department: 'Coordinación Académica',
    phone: '+1 (555) 876-5432',
    active: true,
    createdAt: '2026-03-01T00:00:00Z',
  },
]

interface MasterDB {
  courses: Course[]
  students: Record<string, Student[]>
  attendance: Record<string, AttendanceRecord[]>
  evaluations: Record<string, Evaluation[]>
  grades: Record<string, Grade[]>
  users: User[]
  deletedUserIds?: string[]
}

const STORAGE_KEY = 'classflow_master_db_v2'

function initMasterDB(): MasterDB {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.courses) && parsed.students) {
          if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
            parsed.users = [...DEFAULT_USERS]
          } else {
            // Asegurar que tanto Geramel como Pedro existan con sus cuentas separadas
            for (const du of DEFAULT_USERS) {
              if (!parsed.users.some((u: User) => u.id === du.id)) {
                parsed.users.push(du)
              }
            }
          }
          // Asegurar que los cursos y estudiantes reales del archivo Excel existan
          let addedReal = false
          for (const rc of REAL_COURSES) {
            if (!parsed.courses.some((c: Course) => c.id === rc.id)) {
              parsed.courses.unshift(rc)
              parsed.students[rc.id] = [...(REAL_STUDENTS_BY_COURSE[rc.id] || [])]
              if (!parsed.attendance) parsed.attendance = {}
              if (!parsed.evaluations) parsed.evaluations = {}
              if (!parsed.grades) parsed.grades = {}
              parsed.attendance[rc.id] = []
              parsed.evaluations[rc.id] = []
              parsed.grades[rc.id] = []
              addedReal = true
            }
          }
          if (addedReal) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
            } catch {}
          }
          parsed.courses = withOwner(parsed.courses)
          return parsed
        }
      }
    } catch (err) {
      console.error('Error reading ClassFlow database from localStorage:', err)
    }
  }

  // Initial Seed
  const seeded: MasterDB = {
    courses: withOwner([...MOCK_COURSES]),
    students: Object.fromEntries(
      Object.entries(MOCK_STUDENTS_BY_COURSE).map(([k, v]) => [k, [...v]])
    ),
    attendance: Object.fromEntries(
      Object.entries(MOCK_ATTENDANCE).map(([k, v]) => [k, [...v]])
    ),
    evaluations: Object.fromEntries(
      Object.entries(MOCK_EVALUATIONS).map(([k, v]) => [k, [...v]])
    ),
    grades: Object.fromEntries(
      Object.entries(MOCK_GRADES).map(([k, v]) => [k, [...v]])
    ),
    users: [...DEFAULT_USERS],
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    } catch {}
  }

  return seeded
}

const _dbState: MasterDB = initMasterDB()

let _syncTimeout: any = null

function getSyncUrl(): string {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  return base ? `${base}/api/sync` : '/api/sync'
}

function pushToServer() {
  if (typeof window === 'undefined') return
  if (_syncTimeout) clearTimeout(_syncTimeout)
  _syncTimeout = setTimeout(async () => {
    try {
      await fetch(getSyncUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ..._dbState, pushedBy: getCurrentUserId() }),
      })
    } catch (e) {
      // Quiet fail if server is offline or local dev
    }
  }, 300)
}

/**
 * Fusiona listas de usuarios CUENTA POR CUENTA usando updatedAt.
 * Así el perfil de Pedro y el de Geramel nunca se pisan entre sí aunque
 * un dispositivo tenga datos viejos.
 */
export function mergeUsers(local: User[], remote: User[], deletedIds: string[] = []): User[] {
  const map = new Map<string, User>()
  for (const u of [...(local || []), ...(remote || [])]) {
    if (!u || !u.id || deletedIds.includes(u.id)) continue
    const prev = map.get(u.id)
    if (!prev || (u.updatedAt ?? 0) > (prev.updatedAt ?? 0)) map.set(u.id, u)
  }
  return Array.from(map.values())
}

let _usersSyncListener: ((users: User[]) => void) | null = null

export function onUsersSync(callback: (users: User[]) => void) {
  _usersSyncListener = callback
}

// ─── Reactividad global para cursos (Sincroniza la barra de cursos al instante) ───
const _coursesListeners = new Set<() => void>()

export function onCoursesChange(listener: () => void) {
  _coursesListeners.add(listener)
  return () => {
    _coursesListeners.delete(listener)
  }
}

export function notifyCoursesChanged() {
  _coursesListeners.forEach((fn) => {
    try {
      fn()
    } catch (err) {
      console.error('Error in courses listener:', err)
    }
  })
}

/** Hook reactivo para obtener los cursos actualizados al instante en cualquier componente */
export function useCourses(): Course[] {
  const [courses, setCourses] = useState<Course[]>(() => db.courses.list())

  useEffect(() => {
    setCourses([...db.courses.list()])
    const unsubscribe = onCoursesChange(() => {
      setCourses([...db.courses.list()])
    })
    return unsubscribe
  }, [])

  return courses
}

export async function pullFromServer() {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch(getSyncUrl())
    if (res.ok) {
      const json = await res.json()
      if (json.success && json.data) {
        if (Array.isArray(json.data.courses)) {
          _dbState.courses = withOwner(json.data.courses)
          notifyCoursesChanged()
        }
        if (json.data.students) _dbState.students = json.data.students
        if (json.data.attendance) _dbState.attendance = json.data.attendance
        if (json.data.evaluations) _dbState.evaluations = json.data.evaluations
        if (json.data.grades) _dbState.grades = json.data.grades
        if (Array.isArray(json.data.users) && json.data.users.length > 0) {
          const deleted = Array.from(new Set([
            ...(_dbState.deletedUserIds || []),
            ...(Array.isArray(json.data.deletedUserIds) ? json.data.deletedUserIds : []),
          ]))
          _dbState.deletedUserIds = deleted
          _dbState.users = mergeUsers(_dbState.users, json.data.users, deleted)
          if (_usersSyncListener) {
            _usersSyncListener(_dbState.users)
          }
        }
        persistDB(false)
      }
    }
  } catch (e) {
    // Offline or local
  }
}

if (typeof window !== 'undefined') {
  pullFromServer()
}

function persistDB(shouldPush = true) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_dbState))
    } catch (err) {
      console.error('Failed to save ClassFlow DB to localStorage:', err)
    }
  }
  if (shouldPush) {
    pushToServer()
  }
}

export const db = {
  courses: {
    /** Solo los cursos del usuario con sesión activa */
    list: () => {
      const uid = getCurrentUserId()
      return _dbState.courses.filter((c) => isSameOwner(c.ownerId, uid))
    },
    get: (id: string) => {
      const uid = getCurrentUserId()
      return _dbState.courses.find((c) => c.id === id && isSameOwner(c.ownerId, uid)) ?? null
    },
    create: (data: Omit<Course, 'id'>) => {
      const c: Course = { ...data, id: `c${Date.now()}`, ownerId: getCurrentUserId() || LEGACY_OWNER_ID, studentCount: 0, averageGrade: 0, attendanceRate: 0 }
      _dbState.courses.push(c)
      _dbState.students[c.id] = []
      _dbState.evaluations[c.id] = []
      _dbState.grades[c.id] = []
      _dbState.attendance[c.id] = []
      persistDB()
      notifyCoursesChanged()
      return c
    },
    update: (id: string, data: Partial<Course>) => {
      const i = _dbState.courses.findIndex((c) => c.id === id)
      if (i === -1) return null
      _dbState.courses[i] = { ..._dbState.courses[i], ...data }
      persistDB()
      notifyCoursesChanged()
      return _dbState.courses[i]
    },
    delete: (id: string) => {
      const i = _dbState.courses.findIndex((c) => c.id === id)
      if (i === -1) return false
      _dbState.courses.splice(i, 1)
      delete _dbState.students[id]
      delete _dbState.evaluations[id]
      delete _dbState.grades[id]
      delete _dbState.attendance[id]
      persistDB()
      notifyCoursesChanged()
      return true
    },
  },
  students: {
    list: (courseId: string) => _dbState.students[courseId] ?? [],
    get: (courseId: string, studentId: string) => (_dbState.students[courseId] ?? []).find((s) => s.id === studentId) ?? null,
    create: (courseId: string, data: Omit<Student, 'id' | 'createdAt'>) => {
      const s: Student = { ...data, id: `s${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, createdAt: new Date().toISOString() }
      if (!_dbState.students[courseId]) _dbState.students[courseId] = []
      _dbState.students[courseId].push(s)
      const ci = _dbState.courses.findIndex((c) => c.id === courseId)
      if (ci !== -1) _dbState.courses[ci].studentCount = (_dbState.students[courseId]?.length ?? 1)
      persistDB()
      return s
    },
    batchCreate: (courseId: string, studentsData: Array<Omit<Student, 'id' | 'createdAt'>>) => {
      if (!_dbState.students[courseId]) _dbState.students[courseId] = []
      const createdList: Student[] = studentsData.map((data, index) => ({
        ...data,
        id: `s${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      }))
      _dbState.students[courseId].push(...createdList)
      const ci = _dbState.courses.findIndex((c) => c.id === courseId)
      if (ci !== -1) _dbState.courses[ci].studentCount = _dbState.students[courseId].length
      persistDB()
      return createdList
    },
    update: (courseId: string, studentId: string, data: Partial<Student>) => {
      const arr = _dbState.students[courseId] ?? []
      const i = arr.findIndex((s) => s.id === studentId)
      if (i === -1) return null
      arr[i] = { ...arr[i], ...data }
      persistDB()
      return arr[i]
    },
    delete: (courseId: string, studentId: string) => {
      const arr = _dbState.students[courseId] ?? []
      const i = arr.findIndex((s) => s.id === studentId)
      if (i === -1) return false
      arr.splice(i, 1)
      const ci = _dbState.courses.findIndex((c) => c.id === courseId)
      if (ci !== -1) _dbState.courses[ci].studentCount = arr.length
      persistDB()
      return true
    },
  },
  attendance: {
    list: (courseId: string) => _dbState.attendance[courseId] ?? [],
    listByDate: (courseId: string, date: string) => (_dbState.attendance[courseId] ?? []).filter((a) => a.date === date),
    save: (courseId: string, records: AttendanceRecord[]) => {
      const arr = _dbState.attendance[courseId] ?? []
      const date = records[0]?.date ?? todayISO()
      const without = arr.filter((a) => a.date !== date)
      _dbState.attendance[courseId] = [...without, ...records]
      persistDB()
      return records
    },
    deleteByDate: (courseId: string, date: string) => {
      const arr = _dbState.attendance[courseId] ?? []
      _dbState.attendance[courseId] = arr.filter((a) => a.date !== date)
      persistDB()
      return true
    },
  },
  evaluations: {
    list: (courseId: string) => _dbState.evaluations[courseId] ?? [],
    get: (courseId: string, evalId: string) => (_dbState.evaluations[courseId] ?? []).find((e) => e.id === evalId) ?? null,
    create: (data: Omit<Evaluation, 'id'>) => {
      const e: Evaluation = { ...data, id: `ev${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, period: data.period || 'P1' }
      if (!_dbState.evaluations[e.courseId]) _dbState.evaluations[e.courseId] = []
      _dbState.evaluations[e.courseId].push(e)
      persistDB()
      return e
    },
    delete: (courseId: string, evalId: string) => {
      const arr = _dbState.evaluations[courseId] ?? []
      const i = arr.findIndex((e) => e.id === evalId)
      if (i === -1) return false
      arr.splice(i, 1)
      persistDB()
      return true
    },
  },
  grades: {
    list: (courseId: string) => _dbState.grades[courseId] ?? [],
    listByEval: (courseId: string, evalId: string) => (_dbState.grades[courseId] ?? []).filter((g) => g.evaluationId === evalId),
    listByStudent: (courseId: string, studentId: string) => (_dbState.grades[courseId] ?? []).filter((g) => g.studentId === studentId),
    upsert: (courseId: string, grade: Omit<Grade, 'id'>) => {
      const arr = _dbState.grades[courseId] ?? []
      const i = arr.findIndex((g) => g.studentId === grade.studentId && g.evaluationId === grade.evaluationId)
      const entry: Grade = { ...grade, id: `gr${Date.now()}_${Math.random().toString(36).substring(2, 6)}` }
      if (i !== -1) {
        arr[i] = { ...arr[i], ...grade }
        persistDB()
        return arr[i]
      }
      arr.push(entry)
      _dbState.grades[courseId] = arr
      persistDB()
      return entry
    },
    batchUpsert: (courseId: string, grades: Array<Omit<Grade, 'id'>>) => {
      const results = grades.map((g) => {
        const arr = _dbState.grades[courseId] ?? []
        const i = arr.findIndex((item) => item.studentId === g.studentId && item.evaluationId === g.evaluationId)
        if (i !== -1) {
          arr[i] = { ...arr[i], ...g }
          return arr[i]
        }
        const entry: Grade = { ...g, id: `gr${Date.now()}_${Math.random().toString(36).substring(2, 6)}` }
        arr.push(entry)
        _dbState.grades[courseId] = arr
        return entry
      })
      persistDB()
      return results
    },
  },
  users: {
    list: () => _dbState.users || [...DEFAULT_USERS],
    sync: (users: User[], deletedIds: string[] = []) => {
      if (deletedIds.length) {
        _dbState.deletedUserIds = Array.from(new Set([...(_dbState.deletedUserIds || []), ...deletedIds]))
      }
      // Los usuarios locales ya traen su updatedAt; se fusionan cuenta por cuenta
      _dbState.users = mergeUsers(users, [], _dbState.deletedUserIds || [])
      persistDB()
    },
  },
}
