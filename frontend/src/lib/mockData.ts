import type {
  Course, Student, Enrollment, AttendanceRecord, Evaluation, Grade,
  DashboardStats, TodayCourse, AcademicAlert, StudentWithStats, AttendanceStatus
} from '@/types'
import { todayISO } from '@/lib/utils'

// ─── Seed data ────────────────────────────────────────────────

export const MOCK_COURSES: Course[] = [
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
  return MOCK_COURSES.slice(0, 2).map((c) => ({
    courseId: c.id, courseName: c.name, group: c.group,
    schedule: c.schedule, room: c.room,
    studentCount: c.studentCount ?? 0,
    attendanceRate: c.attendanceRate,
    hasAttendanceToday: false,
  }))
}

export function getStudentWithStats(studentId: string, courseId: string): StudentWithStats | null {
  const students = MOCK_STUDENTS_BY_COURSE[courseId] ?? []
  const s = students.find((x) => x.id === studentId)
  if (!s) return null
  const course = MOCK_COURSES.find((c) => c.id === courseId)
  const grades = (MOCK_GRADES[courseId] ?? []).filter((g) => g.studentId === studentId)
  const evals = MOCK_EVALUATIONS[courseId] ?? []
  const avg = grades.length
    ? grades.reduce((sum, g) => {
        const ev = evals.find((e) => e.id === g.evaluationId)
        return ev ? sum + (g.score / ev.maxScore) * 100 : sum
      }, 0) / grades.length
    : 0
  const att = (MOCK_ATTENDANCE[courseId] ?? []).filter((a) => a.studentId === studentId)
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
  MOCK_COURSES.forEach((course) => {
    const students = MOCK_STUDENTS_BY_COURSE[course.id] ?? []
    students.slice(0, 3).forEach((s) => {
      const sw = getStudentWithStats(s.id, course.id)
      if (!sw) return
      if (sw.averageGrade < 70) {
        alerts.push({
          studentId: s.id, studentName: `${s.firstName} ${s.lastName}`,
          courseId: course.id, courseName: course.name,
          averageGrade: sw.averageGrade, attendanceRate: sw.attendanceRate,
          alertType: 'low_grade', severity: sw.averageGrade < 60 ? 'high' : 'medium',
        })
      }
      if (sw.attendanceRate < 80) {
        alerts.push({
          studentId: s.id, studentName: `${s.firstName} ${s.lastName}`,
          courseId: course.id, courseName: course.name,
          averageGrade: sw.averageGrade, attendanceRate: sw.attendanceRate,
          alertType: 'low_attendance', severity: 'medium',
        })
      }
    })
  })
  return alerts.slice(0, 8)
}

export function getAllStudents(): StudentWithStats[] {
  return MOCK_COURSES.flatMap((course) =>
    (MOCK_STUDENTS_BY_COURSE[course.id] ?? []).map((s) => {
      const sw = getStudentWithStats(s.id, course.id)
      return sw ?? { ...s, averageGrade: 0, attendanceRate: 0, evaluationsCount: 0, courseId: course.id, courseName: course.name, group: course.group }
    })
  )
}

export function getAttendanceForDate(courseId: string, date: string): AttendanceRecord[] {
  return (MOCK_ATTENDANCE[courseId] ?? []).filter((a) => a.date === date)
}

// ─── Mutable in-memory state ──────────────────────────────────
// (replaces DB writes in the MVP without a backend running)
const _courses = [...MOCK_COURSES]
const _students: Record<string, Student[]> = Object.fromEntries(
  Object.entries(MOCK_STUDENTS_BY_COURSE).map(([k, v]) => [k, [...v]])
)
const _attendance: Record<string, AttendanceRecord[]> = Object.fromEntries(
  Object.entries(MOCK_ATTENDANCE).map(([k, v]) => [k, [...v]])
)
const _evaluations: Record<string, Evaluation[]> = Object.fromEntries(
  Object.entries(MOCK_EVALUATIONS).map(([k, v]) => [k, [...v]])
)
const _grades: Record<string, Grade[]> = Object.fromEntries(
  Object.entries(MOCK_GRADES).map(([k, v]) => [k, [...v]])
)

export const db = {
  courses: {
    list: () => _courses,
    get: (id: string) => _courses.find((c) => c.id === id) ?? null,
    create: (data: Omit<Course, 'id'>) => {
      const c: Course = { ...data, id: `c${Date.now()}`, studentCount: 0, averageGrade: 0, attendanceRate: 0 }
      _courses.push(c)
      _students[c.id] = []
      _evaluations[c.id] = []
      _grades[c.id] = []
      _attendance[c.id] = []
      return c
    },
    update: (id: string, data: Partial<Course>) => {
      const i = _courses.findIndex((c) => c.id === id)
      if (i === -1) return null
      _courses[i] = { ..._courses[i], ...data }
      return _courses[i]
    },
    delete: (id: string) => {
      const i = _courses.findIndex((c) => c.id === id)
      if (i === -1) return false
      _courses.splice(i, 1)
      return true
    },
  },
  students: {
    list: (courseId: string) => _students[courseId] ?? [],
    get: (courseId: string, studentId: string) => (_students[courseId] ?? []).find((s) => s.id === studentId) ?? null,
    create: (courseId: string, data: Omit<Student, 'id' | 'createdAt'>) => {
      const s: Student = { ...data, id: `s${Date.now()}`, createdAt: new Date().toISOString() }
      if (!_students[courseId]) _students[courseId] = []
      _students[courseId].push(s)
      const ci = _courses.findIndex((c) => c.id === courseId)
      if (ci !== -1) _courses[ci].studentCount = (_courses[ci].studentCount ?? 0) + 1
      return s
    },
    update: (courseId: string, studentId: string, data: Partial<Student>) => {
      const arr = _students[courseId] ?? []
      const i = arr.findIndex((s) => s.id === studentId)
      if (i === -1) return null
      arr[i] = { ...arr[i], ...data }
      return arr[i]
    },
    delete: (courseId: string, studentId: string) => {
      const arr = _students[courseId] ?? []
      const i = arr.findIndex((s) => s.id === studentId)
      if (i === -1) return false
      arr.splice(i, 1)
      const ci = _courses.findIndex((c) => c.id === courseId)
      if (ci !== -1) _courses[ci].studentCount = Math.max(0, (_courses[ci].studentCount ?? 1) - 1)
      return true
    },
  },
  attendance: {
    list: (courseId: string) => _attendance[courseId] ?? [],
    listByDate: (courseId: string, date: string) => (_attendance[courseId] ?? []).filter((a) => a.date === date),
    save: (courseId: string, records: AttendanceRecord[]) => {
      const arr = _attendance[courseId] ?? []
      const date = records[0]?.date ?? todayISO()
      const without = arr.filter((a) => a.date !== date)
      _attendance[courseId] = [...without, ...records]
      return records
    },
  },
  evaluations: {
    list: (courseId: string) => _evaluations[courseId] ?? [],
    get: (courseId: string, evalId: string) => (_evaluations[courseId] ?? []).find((e) => e.id === evalId) ?? null,
    create: (data: Omit<Evaluation, 'id'>) => {
      const e: Evaluation = { ...data, id: `ev${Date.now()}`, period: data.period || 'P1' }
      if (!_evaluations[e.courseId]) _evaluations[e.courseId] = []
      _evaluations[e.courseId].push(e)
      return e
    },
    delete: (courseId: string, evalId: string) => {
      const arr = _evaluations[courseId] ?? []
      const i = arr.findIndex((e) => e.id === evalId)
      if (i === -1) return false
      arr.splice(i, 1)
      return true
    },
  },
  grades: {
    list: (courseId: string) => _grades[courseId] ?? [],
    listByEval: (courseId: string, evalId: string) => (_grades[courseId] ?? []).filter((g) => g.evaluationId === evalId),
    listByStudent: (courseId: string, studentId: string) => (_grades[courseId] ?? []).filter((g) => g.studentId === studentId),
    upsert: (courseId: string, grade: Omit<Grade, 'id'>) => {
      const arr = _grades[courseId] ?? []
      const i = arr.findIndex((g) => g.studentId === grade.studentId && g.evaluationId === grade.evaluationId)
      const entry: Grade = { ...grade, id: `gr${Date.now()}${Math.random()}` }
      if (i !== -1) { arr[i] = { ...arr[i], ...grade }; return arr[i] }
      arr.push(entry)
      _grades[courseId] = arr
      return entry
    },
    batchUpsert: (courseId: string, grades: Array<Omit<Grade, 'id'>>) => {
      return grades.map((g) => db.grades.upsert(courseId, g))
    },
  },
}
