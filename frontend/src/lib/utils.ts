import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AttendanceStatus, EvaluationType, Grade, Evaluation, StudentStatus, CourseStatus, PeriodId, AcademicPeriodInfo } from '@/types'

// ─── Tailwind utility ─────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── 4 Academic Periods ───────────────────────────────────────
export const ACADEMIC_PERIODS: AcademicPeriodInfo[] = [
  { id: 'P1', name: 'Primer Período', shortName: 'P1', quarter: 1 },
  { id: 'P2', name: 'Segundo Período', shortName: 'P2', quarter: 2 },
  { id: 'P3', name: 'Tercer Período', shortName: 'P3', quarter: 3 },
  { id: 'P4', name: 'Cuarto Período', shortName: 'P4', quarter: 4 },
]

// ─── Evaluation Criteria (40% / 30% / 15% / 15% = 100%) ─────────
export type CriteriaCategoryKey = 'exam' | 'task' | 'participation' | 'attitude'

export interface CriteriaCategoryInfo {
  key: CriteriaCategoryKey
  name: string
  weight: number // 40, 30, 15, 15
  types: EvaluationType[]
  color: string
  bg: string
  badgeVariant: 'danger' | 'success' | 'info' | 'warning'
}

export const CRITERIA_CONFIG: Record<CriteriaCategoryKey, CriteriaCategoryInfo> = {
  exam: {
    key: 'exam',
    name: 'Exámenes',
    weight: 40,
    types: ['exam', 'quiz'],
    color: '#DC2626',
    bg: '#FEE2E2',
    badgeVariant: 'danger',
  },
  task: {
    key: 'task',
    name: 'Tareas',
    weight: 30,
    types: ['task', 'project', 'work'],
    color: '#16A34A',
    bg: '#DCFCE7',
    badgeVariant: 'success',
  },
  participation: {
    key: 'participation',
    name: 'Participación',
    weight: 15,
    types: ['participation'],
    color: '#2563EB',
    bg: '#DBEAFE',
    badgeVariant: 'info',
  },
  attitude: {
    key: 'attitude',
    name: 'Actitudes y Valores',
    weight: 15,
    types: ['other'],
    color: '#D97706',
    bg: '#FEF3C7',
    badgeVariant: 'warning',
  },
}

export const CRITERIA_CATEGORIES: CriteriaCategoryInfo[] = Object.values(CRITERIA_CONFIG)

/**
 * Returns which evaluation criteria category an evaluation type maps to.
 */
export function getCriteriaKey(type: EvaluationType): CriteriaCategoryKey {
  if (type === 'exam' || type === 'quiz') return 'exam'
  if (type === 'task' || type === 'project' || type === 'work') return 'task'
  if (type === 'participation') return 'participation'
  return 'attitude'
}

/**
 * Dynamically calculates the weight (%) of an evaluation within its period.
 * For example: If Period 1 has 5 exams, each exam gets 40 / 5 = 8.0%.
 * If it has 2 exams, each gets 40 / 2 = 20.0%.
 */
export function getEvaluationDynamicWeight(
  evalItem: Evaluation,
  allEvaluations: Evaluation[]
): number {
  const period = evalItem.period || 'P1'
  const catKey = getCriteriaKey(evalItem.type)
  const catWeight = CRITERIA_CONFIG[catKey]?.weight ?? 0

  const countInPeriod = allEvaluations.filter(
    (e) => (e.period || 'P1') === period && getCriteriaKey(e.type) === catKey
  ).length

  if (countInPeriod === 0) return 0
  return Math.round((catWeight / countInPeriod) * 100) / 100
}

/**
 * Breakdown of a student's performance in a given period.
 */
export interface CategoryBreakdown {
  key: CriteriaCategoryKey
  name: string
  weight: number              // Category weight, e.g. 40
  color: string
  evaluationsCount: number    // Total evaluations in this category for this period
  gradedCount: number         // How many were graded for this student
  averagePercentage: number   // Student's average (0-100) in this category
  pointsEarned: number        // Points contributed to period grade (out of weight)
  dynamicWeightEach: number   // Weight per evaluation, e.g. 8%
}

export interface PeriodBreakdown {
  period: PeriodId
  periodName: string
  categories: Record<CriteriaCategoryKey, CategoryBreakdown>
  totalScore: number          // Total points out of 100
  hasEvaluations: boolean
  hasGrades: boolean
}

/**
 * Calculate detailed grade breakdown for a student in a specific period.
 */
export function calculateStudentPeriodBreakdown(
  grades: Grade[],
  evaluations: Evaluation[],
  period: PeriodId
): PeriodBreakdown {
  const periodEvals = evaluations.filter((e) => (e.period || 'P1') === period)
  const periodInfo = ACADEMIC_PERIODS.find((p) => p.id === period) ?? { id: period, name: `Período ${period}`, shortName: period, quarter: 1 }

  const gradeMap = new Map(grades.map((g) => [g.evaluationId, g.score]))

  const categories = {} as Record<CriteriaCategoryKey, CategoryBreakdown>
  let totalScore = 0

  for (const cat of CRITERIA_CATEGORIES) {
    const catEvals = periodEvals.filter((e) => getCriteriaKey(e.type) === cat.key)
    const count = catEvals.length
    const dynamicWeightEach = count > 0 ? Math.round((cat.weight / count) * 100) / 100 : 0

    let scoreSum = 0
    let gradedCount = 0

    for (const ev of catEvals) {
      const score = gradeMap.get(ev.id)
      if (score !== undefined) {
        gradedCount++
        scoreSum += (score / ev.maxScore) * 100
      }
    }

    const averagePercentage = gradedCount > 0 ? Math.round((scoreSum / gradedCount) * 10) / 10 : 0
    // Points earned = (averagePercentage / 100) * categoryWeight
    const pointsEarned = gradedCount > 0 ? Math.round((averagePercentage * cat.weight / 100) * 10) / 10 : 0

    totalScore += pointsEarned

    categories[cat.key] = {
      key: cat.key,
      name: cat.name,
      weight: cat.weight,
      color: cat.color,
      evaluationsCount: count,
      gradedCount,
      averagePercentage,
      pointsEarned,
      dynamicWeightEach,
    }
  }

  return {
    period,
    periodName: periodInfo.name,
    categories,
    totalScore: Math.round(totalScore * 10) / 10,
    hasEvaluations: periodEvals.length > 0,
    hasGrades: periodEvals.some((e) => gradeMap.has(e.id)),
  }
}

/**
 * Calculates student grades across all 4 periods and the annual final average.
 */
export function calculateStudentAnnualGrades(
  grades: Grade[],
  evaluations: Evaluation[]
): {
  periods: Record<PeriodId, PeriodBreakdown>
  annualAverage: number
  evaluatedPeriodsCount: number
} {
  const periods = {} as Record<PeriodId, PeriodBreakdown>
  let sum = 0
  let evaluatedPeriodsCount = 0

  for (const p of ACADEMIC_PERIODS) {
    const breakdown = calculateStudentPeriodBreakdown(grades, evaluations, p.id)
    periods[p.id] = breakdown
    if (breakdown.hasGrades) {
      sum += breakdown.totalScore
      evaluatedPeriodsCount++
    }
  }

  const annualAverage = evaluatedPeriodsCount > 0 ? Math.round((sum / evaluatedPeriodsCount) * 10) / 10 : 0

  return {
    periods,
    annualAverage,
    evaluatedPeriodsCount,
  }
}

/**
 * Calculate weighted average for a student, taking into account dynamic period categories.
 */
export function calculateWeightedAverage(
  grades: Grade[],
  evaluations: Evaluation[]
): number {
  if (grades.length === 0 || evaluations.length === 0) return 0

  // Check if evaluations have period assigned
  const hasPeriods = evaluations.some((e) => Boolean(e.period))
  if (hasPeriods) {
    const annual = calculateStudentAnnualGrades(grades, evaluations)
    return annual.annualAverage
  }

  // Fallback to legacy calculation
  const evalMap = new Map(evaluations.map((e) => [e.id, e]))
  let totalWeight = 0
  let weightedSum = 0

  for (const grade of grades) {
    const evaluation = evalMap.get(grade.evaluationId)
    if (!evaluation) continue
    const percentage = (grade.score / evaluation.maxScore) * 100
    const w = evaluation.weight ?? 25
    weightedSum += percentage * (w / 100)
    totalWeight += w / 100
  }

  if (totalWeight === 0) return 0
  return Math.round((weightedSum / totalWeight) * 100) / 100
}

/**
 * Simple average of scores normalized to 100.
 */
export function calculateSimpleAverage(grades: Grade[], evaluations: Evaluation[]): number {
  if (grades.length === 0) return 0
  const evalMap = new Map(evaluations.map((e) => [e.id, e]))
  const percentages = grades.map((g) => {
    const ev = evalMap.get(g.evaluationId)
    return ev ? (g.score / ev.maxScore) * 100 : 0
  })
  const sum = percentages.reduce((a, b) => a + b, 0)
  return Math.round((sum / percentages.length) * 100) / 100
}

/**
 * Check that evaluation weights sum to exactly 100.
 */
export function validateEvaluationWeights(evaluations: Evaluation[]): {
  valid: boolean
  total: number
  diff: number
} {
  const total = evaluations.reduce((sum, e) => sum + (e.weight ?? 0), 0)
  return {
    valid: Math.abs(total - 100) < 0.01,
    total,
    diff: 100 - total,
  }
}

/**
 * Grade level label.
 */
export function gradeLevel(avg: number): 'excellent' | 'good' | 'regular' | 'at-risk' {
  if (avg >= 90) return 'excellent'
  if (avg >= 75) return 'good'
  if (avg >= 60) return 'regular'
  return 'at-risk'
}

// ─── Attendance ───────────────────────────────────────────────

export function attendanceRate(present: number, total: number): number {
  if (total === 0) return 0
  return Math.round((present / total) * 1000) / 10
}

// ─── Formatting ───────────────────────────────────────────────

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', ...opts })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  } catch {
    return dateStr
  }
}

export function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

export function formatGrade(score: number, decimals = 1): string {
  return score.toFixed(decimals)
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Student initials ─────────────────────────────────────────
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

// ─── Label helpers ────────────────────────────────────────────
export const attendanceLabels: Record<AttendanceStatus, string> = {
  present: 'Presente',
  late: 'Tardanza',
  absent: 'Ausente',
  justified: 'Justificado',
}

export const evaluationTypeLabels: Record<EvaluationType, string> = {
  exam: 'Examen',
  task: 'Tarea',
  quiz: 'Prueba corta',
  project: 'Proyecto',
  participation: 'Participación',
  work: 'Trabajo',
  other: 'Actitudes y Valores',
}

export const CRITERIA_FORM_OPTIONS = [
  { value: 'exam', label: 'Examen (Ponderación: 40%)' },
  { value: 'task', label: 'Tarea / Asignación (Ponderación: 30%)' },
  { value: 'participation', label: 'Participación (Ponderación: 15%)' },
  { value: 'other', label: 'Actitudes y Valores (Ponderación: 15%)' },
]

export const studentStatusLabels: Record<StudentStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  withdrawn: 'Retirado',
}

export const courseStatusLabels: Record<CourseStatus, string> = {
  active: 'Activo',
  completed: 'Completado',
  draft: 'Borrador',
}

export const gradeLevelLabels = {
  excellent: 'Excelente',
  good: 'Bueno',
  regular: 'Regular',
  'at-risk': 'En riesgo',
}

// ─── Color helpers ────────────────────────────────────────────
export function getAttendanceColor(status: AttendanceStatus): string {
  const map: Record<AttendanceStatus, string> = {
    present: 'badge-success',
    late: 'badge-warning',
    absent: 'badge-danger',
    justified: 'badge-info',
  }
  return map[status]
}

export function getGradeColor(avg: number): string {
  if (avg >= 90) return 'text-green-600'
  if (avg >= 75) return 'text-blue-600'
  if (avg >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export function getAttendanceRateColor(rate: number): string {
  if (rate >= 90) return 'text-green-600'
  if (rate >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

// ─── Number helpers ───────────────────────────────────────────
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// ─── Debounce ─────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ─── Storage ──────────────────────────────────────────────────
export const storage = {
  get<T>(key: string): T | null {
    try {
      const val = localStorage.getItem(key)
      return val ? JSON.parse(val) : null
    } catch { return null }
  },
  set<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* noop */ }
  },
  remove(key: string): void {
    try { localStorage.removeItem(key) } catch { /* noop */ }
  },
}
