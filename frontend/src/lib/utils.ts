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

// ─── Evaluation Criteria (Ponderaciones manuales configurables) ─────────
export type CriteriaCategoryKey = 'exam' | 'task' | 'participation' | 'attitude'

export interface CriteriaCategoryInfo {
  key: CriteriaCategoryKey
  name: string
  weight: number
  types: EvaluationType[]
  color: string
  bg: string
  badgeVariant: 'danger' | 'success' | 'info' | 'warning'
}

export const DEFAULT_CRITERIA_WEIGHTS: Record<CriteriaCategoryKey, number> = {
  exam: 30,          // 30 puntos
  task: 30,          // 30 puntos
  participation: 20,  // 20 puntos
  attitude: 20,       // 20 puntos
}

const BASE_CRITERIA_META: Record<CriteriaCategoryKey, Omit<CriteriaCategoryInfo, 'weight'>> = {
  exam: {
    key: 'exam',
    name: 'Exámenes',
    types: ['exam', 'quiz'],
    color: '#DC2626',
    bg: '#FEE2E2',
    badgeVariant: 'danger',
  },
  task: {
    key: 'task',
    name: 'Tareas y Trabajos',
    types: ['task', 'project', 'work'],
    color: '#16A34A',
    bg: '#DCFCE7',
    badgeVariant: 'success',
  },
  participation: {
    key: 'participation',
    name: 'Participación',
    types: ['participation'],
    color: '#2563EB',
    bg: '#DBEAFE',
    badgeVariant: 'info',
  },
  attitude: {
    key: 'attitude',
    name: 'Actitudes y Valores',
    types: ['other'],
    color: '#D97706',
    bg: '#FEF3C7',
    badgeVariant: 'warning',
  },
}

const CRITERIA_STORAGE_KEY = 'classflow_criteria_weights_v1'

/**
 * Obtiene las ponderaciones configuradas manualmente (o por defecto si no se han personalizado).
 */
export function getCriteriaWeights(): Record<CriteriaCategoryKey, number> {
  try {
    const saved = localStorage.getItem(CRITERIA_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          exam: Number(parsed.exam ?? DEFAULT_CRITERIA_WEIGHTS.exam),
          task: Number(parsed.task ?? DEFAULT_CRITERIA_WEIGHTS.task),
          participation: Number(parsed.participation ?? DEFAULT_CRITERIA_WEIGHTS.participation),
          attitude: Number(parsed.attitude ?? DEFAULT_CRITERIA_WEIGHTS.attitude),
        }
      }
    }
  } catch (e) {
    console.error('Error loading criteria weights from localStorage:', e)
  }
  return { ...DEFAULT_CRITERIA_WEIGHTS }
}

/**
 * Guarda las ponderaciones manuales y notifica a la aplicación para recalcular al instante.
 */
export function saveCriteriaWeights(newWeights: Record<CriteriaCategoryKey, number>): void {
  try {
    localStorage.setItem(CRITERIA_STORAGE_KEY, JSON.stringify(newWeights))
    window.dispatchEvent(new CustomEvent('classflow_criteria_changed', { detail: newWeights }))
  } catch (e) {
    console.error('Error saving criteria weights:', e)
  }
}

/**
 * Restablece las ponderaciones a los valores iniciales por defecto (30/30/20/20).
 */
export function resetCriteriaWeights(): Record<CriteriaCategoryKey, number> {
  saveCriteriaWeights(DEFAULT_CRITERIA_WEIGHTS)
  return { ...DEFAULT_CRITERIA_WEIGHTS }
}

/**
 * Devuelve la configuración completa de criterios con los pesos actuales.
 */
export function getCriteriaConfig(): Record<CriteriaCategoryKey, CriteriaCategoryInfo> {
  const weights = getCriteriaWeights()
  const config = {} as Record<CriteriaCategoryKey, CriteriaCategoryInfo>
  for (const k of Object.keys(BASE_CRITERIA_META) as CriteriaCategoryKey[]) {
    config[k] = {
      ...BASE_CRITERIA_META[k],
      weight: weights[k] ?? DEFAULT_CRITERIA_WEIGHTS[k],
    }
  }
  return config
}

export function getCriteriaCategories(): CriteriaCategoryInfo[] {
  return Object.values(getCriteriaConfig())
}

// Proxy transparente para mantener compatibilidad con cualquier llamada directa a CRITERIA_CONFIG[key]
export const CRITERIA_CONFIG: Record<CriteriaCategoryKey, CriteriaCategoryInfo> = new Proxy(
  {} as Record<CriteriaCategoryKey, CriteriaCategoryInfo>,
  {
    get(_target, prop: string) {
      const config = getCriteriaConfig()
      if (prop in config) {
        return config[prop as CriteriaCategoryKey]
      }
      return undefined
    },
    ownKeys() {
      return Object.keys(BASE_CRITERIA_META)
    },
    getOwnPropertyDescriptor(_target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: getCriteriaConfig()[prop as CriteriaCategoryKey],
      }
    },
  }
)

export const CRITERIA_CATEGORIES: CriteriaCategoryInfo[] = Object.values(getCriteriaConfig())

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
 * Fórmula exacta de cálculo por criterio:
 * funcion calcularAporteCriterio(notas, pesoCriterio, cantidadActividades):
 *   si notas está vacío: retornar 0
 *   puntosPorActividad = pesoCriterio / cantidadActividades
 *   aporteTotal = 0
 *   para cada nota en notas:
 *     aporteTotal += (nota / 100) * puntosPorActividad
 *   retornar aporteTotal
 */
export function calcularAporteCriterio(
  notas: Array<{ score: number; maxScore?: number } | number>,
  pesoCriterio: number,
  totalActividades?: number
): {
  puntosPorActividad: number
  aporteTotal: number
  aportes: number[]
} {
  const count = totalActividades !== undefined && totalActividades > 0
    ? totalActividades
    : notas.length

  if (count === 0 || notas.length === 0) {
    return {
      puntosPorActividad: count > 0 ? Math.round((pesoCriterio / count) * 100) / 100 : 0,
      aporteTotal: 0,
      aportes: [],
    }
  }

  const puntosPorActividad = pesoCriterio / count
  let aporteTotal = 0
  const aportes: number[] = []

  for (const n of notas) {
    const notaSobre100 = typeof n === 'number'
      ? n
      : ((n.score / (n.maxScore || 100)) * 100)
    const aporte = (notaSobre100 / 100) * puntosPorActividad
    aporteTotal += aporte
    aportes.push(Math.round(aporte * 100) / 100)
  }

  return {
    puntosPorActividad: Math.round(puntosPorActividad * 100) / 100,
    aporteTotal: Math.round(aporteTotal * 10) / 10,
    aportes,
  }
}

/**
 * Dynamically calculates the weight (%) of an evaluation within its period.
 * For example: If Period 1 has 5 exams, each exam gets (pesoExamen / 5).
 */
export function getEvaluationDynamicWeight(
  evalItem: Evaluation,
  allEvaluations: Evaluation[]
): number {
  const period = evalItem.period || 'P1'
  const catKey = getCriteriaKey(evalItem.type)
  const catWeight = getCriteriaWeights()[catKey] ?? DEFAULT_CRITERIA_WEIGHTS[catKey]

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
  weight: number              // Category weight, e.g. 30
  color: string
  evaluationsCount: number    // Total evaluations in this category for this period
  gradedCount: number         // How many were graded for this student
  averagePercentage: number   // Student's average (0-100) in this category
  pointsEarned: number        // Points contributed to period grade (out of weight)
  dynamicWeightEach: number   // Weight per evaluation, e.g. 10 pts
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
 * Calculate detailed grade breakdown for a student in a specific period using the exact criteria formula.
 */
export function calculateStudentPeriodBreakdown(
  grades: Grade[],
  evaluations: Evaluation[],
  period: PeriodId
): PeriodBreakdown {
  const periodEvals = evaluations.filter((e) => (e.period || 'P1') === period)
  const periodInfo = ACADEMIC_PERIODS.find((p) => p.id === period) ?? { id: period, name: `Período ${period}`, shortName: period, quarter: 1 }

  const gradeMap = new Map(grades.map((g) => [g.evaluationId, g.score]))
  const criteriaConfig = getCriteriaConfig()
  const currentCategories = Object.values(criteriaConfig)

  const categories = {} as Record<CriteriaCategoryKey, CategoryBreakdown>
  let totalScore = 0

  for (const cat of currentCategories) {
    const catEvals = periodEvals.filter((e) => getCriteriaKey(e.type) === cat.key)
    const count = catEvals.length
    const catWeight = cat.weight

    const gradedItems: Array<{ score: number; maxScore: number }> = []
    let scoreSum = 0

    for (const ev of catEvals) {
      const score = gradeMap.get(ev.id)
      if (score !== undefined) {
        gradedItems.push({ score, maxScore: ev.maxScore })
        scoreSum += (score / ev.maxScore) * 100
      }
    }

    const { puntosPorActividad, aporteTotal } = calcularAporteCriterio(
      gradedItems,
      catWeight,
      count
    )

    const gradedCount = gradedItems.length
    const averagePercentage = gradedCount > 0 ? Math.round((scoreSum / gradedCount) * 10) / 10 : 0
    const pointsEarned = aporteTotal

    totalScore += pointsEarned

    categories[cat.key] = {
      key: cat.key,
      name: cat.name,
      weight: catWeight,
      color: cat.color,
      evaluationsCount: count,
      gradedCount,
      averagePercentage,
      pointsEarned,
      dynamicWeightEach: puntosPorActividad,
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

export function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toLocalISO(new Date())
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return toLocalISO(new Date(y, m - 1, d + days))
}

export function weekdayOfISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

/** Extrae los días de clase (0=Dom … 6=Sáb) de un horario como "Lun a Vie 8:00-1:00" o "Lun/Mié 8:00-9:30". */
export function parseScheduleDays(schedule: string): number[] {
  const s = (schedule || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (!s.trim()) return []

  // Rango Lunes a Viernes (ej. "Lun a Vie", "Lun-Vie", "Lunes a Viernes")
  if (/lun.*(?:a|-|al).*vie/.test(s)) {
    return [1, 2, 3, 4, 5]
  }

  // Rango Lunes a Sábado
  if (/lun.*(?:a|-|al).*sab/.test(s)) {
    return [1, 2, 3, 4, 5, 6]
  }

  // Días individuales
  const map: Array<[RegExp, number]> = [
    [/\bdom/, 0], [/\blun/, 1], [/\bmar/, 2], [/\bmie/, 3],
    [/\bjue/, 4], [/\bvie/, 5], [/\bsab/, 6],
  ]
  return map.filter(([re]) => re.test(s)).map(([, n]) => n)
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
