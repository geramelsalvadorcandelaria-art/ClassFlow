import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Save, Plus, Trash2, Calendar, Table as TableIcon,
  CheckSquare, BarChart3, PlusCircle, Layers, X, Filter
} from 'lucide-react'
import { Button, Select, Card, Badge, PageHeader, EmptyState, Modal, Input, Textarea, ConfirmDialog } from '@/components/ui'
import { db, useCourses } from '@/lib/mockData'
import { useAppStore } from '@/store'
import { toast } from '@/store'
import {
  cn, getInitials, getFullName, evaluationTypeLabels,
  getGradeColor, clamp, ACADEMIC_PERIODS, CRITERIA_CONFIG,
  CRITERIA_CATEGORIES, CRITERIA_FORM_OPTIONS, getCriteriaKey,
  getEvaluationDynamicWeight, calculateStudentPeriodBreakdown,
  calculateStudentAnnualGrades, gradeLevel, gradeLevelLabels
} from '@/lib/utils'
import type { Evaluation, Grade, EvaluationType, PeriodId, AcademicPeriodInfo } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const evalSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['exam', 'task', 'quiz', 'project', 'participation', 'work', 'other']),
  period: z.string().min(1),
  date: z.string().min(1, 'La fecha es requerida'),
  description: z.string().optional(),
  maxScore: z.preprocess((v) => Number(v), z.number().min(1, 'Mínimo 1 punto').max(1000, 'Máximo 1000')),
})

type EvalFormData = {
  name: string
  type: EvaluationType
  period: string
  date: string
  description?: string
  maxScore: number
}

// Mini cell for matrix grid
function MatrixGradeCell({
  score,
  maxScore,
  onSave,
}: {
  score?: number
  maxScore: number
  onSave: (val: number) => void
}) {
  const [val, setVal] = useState<string>(score !== undefined ? String(Math.round(score)) : '')

  useEffect(() => {
    setVal(score !== undefined ? String(Math.round(score)) : '')
  }, [score])

  const handleBlur = () => {
    if (val === '') return
    const num = parseFloat(val)
    if (!isNaN(num)) {
      const clamped = clamp(num, 0, maxScore)
      setVal(String(Math.round(clamped)))
      onSave(clamped)
    }
  }

  const numVal = parseFloat(val)
  const pct = !isNaN(numVal) ? (numVal / maxScore) * 100 : null
  const colorClass = pct !== null ? getGradeColor(pct) : ''

  return (
    <input
      type="number"
      min={0}
      max={maxScore}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      placeholder="—"
      className={cn(
        'w-16 h-8 text-center text-xs font-semibold rounded border border-[var(--color-border)] bg-[var(--color-card)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none tabular-nums transition-colors',
        colorClass
      )}
    />
  )
}

function NewEvaluationForm({
  courseId,
  initialPeriod,
  initialType,
  periods,
  existingEvals,
  onClose,
  onCreated,
}: {
  courseId: string
  initialPeriod: string
  initialType?: EvaluationType
  periods: AcademicPeriodInfo[]
  existingEvals: Evaluation[]
  onClose: () => void
  onCreated: (evalItem: Evaluation) => void
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<EvalFormData>({
    resolver: zodResolver(evalSchema) as never,
    defaultValues: {
      period: initialPeriod,
      type: initialType || 'exam',
      date: new Date().toISOString().split('T')[0],
      maxScore: 100,
    },
  })

  useEffect(() => {
    if (initialType) setValue('type', initialType)
    if (initialPeriod) setValue('period', initialPeriod)
  }, [initialType, initialPeriod, setValue])

  const watchedType = watch('type') || 'exam'
  const watchedPeriod = watch('period') || initialPeriod
  const criteriaKey = getCriteriaKey(watchedType as EvaluationType)
  const categoryInfo = CRITERIA_CONFIG[criteriaKey]

  const existingCount = existingEvals.filter(
    (e) => (e.period || 'P1') === watchedPeriod && getCriteriaKey(e.type) === criteriaKey
  ).length

  const projectedCount = existingCount + 1
  const projectedWeight = Math.round((categoryInfo.weight / projectedCount) * 10) / 10

  const onSubmit = (data: EvalFormData) => {
    const created = db.evaluations.create({
      ...data,
      courseId,
      period: data.period as PeriodId,
      weight: projectedWeight,
    })
    toast.success('Evaluación creada', `${data.name} agregada al ${data.period}`)
    onCreated(created)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div
        className="p-3.5 rounded-lg border text-xs space-y-1.5"
        style={{ backgroundColor: `${categoryInfo.color}10`, borderColor: `${categoryInfo.color}35` }}
      >
        <div className="flex items-center justify-between font-semibold" style={{ color: categoryInfo.color }}>
          <span>Criterio: {categoryInfo.name} ({categoryInfo.weight}% fijo del período)</span>
          <span className="badge badge-sm" style={{ backgroundColor: categoryInfo.color, color: '#fff' }}>
            {watchedPeriod}
          </span>
        </div>
        <p className="text-[var(--color-muted)] leading-relaxed">
          Actualmente hay <strong>{existingCount}</strong> evaluación(es) en esta categoría en {watchedPeriod}. Al crear esta actividad serán <strong>{projectedCount}</strong> y cada una valdrá automáticamente <strong style={{ color: categoryInfo.color }}>{projectedWeight}%</strong> de la nota del período.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--color-foreground)]">Período</label>
          <select className="form-select text-sm w-full" {...register('period')}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.shortName})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--color-foreground)]">Criterio de Evaluación</label>
          <select className="form-select text-sm w-full" {...register('type')}>
            {CRITERIA_FORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <Input
            label="Nombre de la evaluación"
            required
            error={errors.name?.message}
            placeholder={
              watchedType === 'exam'
                ? `Ej: Examen ${projectedCount}`
                : watchedType === 'task'
                ? `Ej: Tarea ${projectedCount}`
                : 'Ej: Participación en clase'
            }
            {...register('name')}
          />
        </div>

        <Input label="Fecha de aplicación" type="date" required error={errors.date?.message} {...register('date')} />
        <Input label="Puntuación máxima" type="number" required error={errors.maxScore?.message} hint="Ej: 100 puntos" {...register('maxScore')} />

        <div className="col-span-2">
          <Textarea label="Descripción u observaciones (opcional)" placeholder="Temas evaluados o instrucciones..." {...register('description')} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>Guardar evaluación</Button>
      </div>
    </form>
  )
}

export default function GradesPage() {
  const { selectedCourseId, setSelectedCourse } = useAppStore()
  const courses = useCourses()
  const [courseId, setCourseId] = useState(
    courses.find((c) => c.id === selectedCourseId)?.id ?? courses[0]?.id ?? ''
  )
  const [periods, setPeriods] = useState<AcademicPeriodInfo[]>([...ACADEMIC_PERIODS])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('P1')
  const [viewMode, setViewMode] = useState<'matrix' | 'by_eval' | 'summary'>('matrix')
  const [evalId, setEvalId] = useState('')
  const [newEvalOpen, setNewEvalOpen] = useState(false)
  const [modalCategoryType, setModalCategoryType] = useState<EvaluationType>('exam')
  const [newPeriodModalOpen, setNewPeriodModalOpen] = useState(false)
  const [newPeriodName, setNewPeriodName] = useState('')
  const [newPeriodShort, setNewPeriodShort] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [evalToDelete, setEvalToDelete] = useState<Evaluation | null>(null)
  const [sectionFilter, setSectionFilter] = useState<'all' | 'exam' | 'task' | 'participation' | 'attitude' | 'summary'>('all')

  // Sincronizar automáticamente el curso seleccionado
  useEffect(() => {
    if (selectedCourseId && courses.some((c) => c.id === selectedCourseId)) {
      setCourseId(selectedCourseId)
    } else if (courses.length > 0 && !courses.some((c) => c.id === courseId)) {
      setCourseId(courses[0].id)
    }
  }, [selectedCourseId, courses, courseId])

  const course = courses.find((c) => c.id === courseId) ?? db.courses.get(courseId)
  const students = useMemo(() => db.students.list(courseId).filter((s) => s.status === 'active'), [courseId, refreshKey])
  const allEvaluations = useMemo(() => db.evaluations.list(courseId), [courseId, refreshKey])

  // Evaluations belonging to the active period
  const periodEvaluations = useMemo(
    () => allEvaluations.filter((e) => (e.period || 'P1') === selectedPeriod),
    [allEvaluations, selectedPeriod]
  )

  // Group evaluations by criteria category
  const examsList = useMemo(() => periodEvaluations.filter((e) => getCriteriaKey(e.type) === 'exam'), [periodEvaluations])
  const tasksList = useMemo(() => periodEvaluations.filter((e) => getCriteriaKey(e.type) === 'task'), [periodEvaluations])
  const partsList = useMemo(() => periodEvaluations.filter((e) => getCriteriaKey(e.type) === 'participation'), [periodEvaluations])
  const attsList = useMemo(() => periodEvaluations.filter((e) => getCriteriaKey(e.type) === 'attitude'), [periodEvaluations])

  // Auto-select evaluation when period or course changes
  const selectedEval = useMemo(() => {
    if (periodEvaluations.length === 0) return null
    return periodEvaluations.find((e) => e.id === evalId) ?? periodEvaluations[0]
  }, [periodEvaluations, evalId])

  // Save grade immediately in DB and trigger reactive update
  const handleUpdateGrade = useCallback((studentId: string, evaluationId: string, score: number) => {
    db.grades.upsert(courseId, { studentId, evaluationId, score })
    setRefreshKey((k) => k + 1)
  }, [courseId])

  const handleDeleteEval = (e: Evaluation) => {
    setEvalToDelete(e)
  }

  const confirmDeleteEval = () => {
    if (!evalToDelete) return
    db.evaluations.delete(courseId, evalToDelete.id)
    setEvalId('')
    setRefreshKey((k) => k + 1)
    toast.success('Evaluación eliminada')
    setEvalToDelete(null)
  }

  // Open modal pre-filling category
  const handleQuickAdd = (type: EvaluationType) => {
    setModalCategoryType(type)
    setNewEvalOpen(true)
  }

  // Add custom period
  const handleAddCustomPeriod = () => {
    if (!newPeriodShort.trim()) {
      toast.error('Indica un código corto para el período (ej: P5 o REC)')
      return
    }
    const newP: AcademicPeriodInfo = {
      id: newPeriodShort.trim().toUpperCase() as PeriodId,
      name: newPeriodName.trim() || `Período ${newPeriodShort.trim().toUpperCase()}`,
      shortName: newPeriodShort.trim().toUpperCase(),
      quarter: periods.length + 1,
    }
    setPeriods((prev) => [...prev, newP])
    setSelectedPeriod(newP.id)
    setNewPeriodModalOpen(false)
    setNewPeriodName('')
    setNewPeriodShort('')
    toast.success('Período agregado', `${newP.name} listo para agregar evaluaciones`)
  }

  return (
    <>
      <PageHeader
        title="Control de Calificaciones y Planilla"
        subtitle={`${course?.name ?? 'Curso'} • Período actual: ${selectedPeriod} • Criterios: 40% Examen, 30% Tareas, 15% Part., 15% Actitud`}
        actions={
          <div className="flex gap-2">
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => { setModalCategoryType('exam'); setNewEvalOpen(true) }}
            >
              Nueva evaluación
            </Button>
          </div>
        }
      />

      {/* Main Course and Period Controls */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="w-full lg:w-72">
            <label className="block text-xs font-semibold text-[var(--color-muted)] mb-1">Curso seleccionado</label>
            <Select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value)
                setSelectedCourse(e.target.value)
                setEvalId('')
              }}
              options={courses.map((c) => ({
                value: c.id,
                label: `${c.name}${c.room ? ` (Aula ${c.room})` : (c.group ? ` (${c.group})` : '')}`,
              }))}
            />
          </div>

          {/* Period Selector Tabs */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--color-muted)]">Períodos académicos</label>
              <button
                type="button"
                onClick={() => setNewPeriodModalOpen(true)}
                className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle size={12} /> + Agregar otro período
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => {
                const isActive = selectedPeriod === p.id
                const pEvalsCount = allEvaluations.filter((e) => (e.period || 'P1') === p.id).length
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPeriod(p.id)
                      setEvalId('')
                    }}
                    className={cn(
                      'px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer',
                      isActive
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                        : 'bg-[var(--color-card)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                    )}
                  >
                    <span>{p.shortName}</span>
                    <span className="text-[11px] opacity-80 hidden sm:inline">{p.name.replace(' Período', '')}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                        isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-border)] text-[var(--color-muted)]'
                      )}
                    >
                      {pEvalsCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-muted)] mb-1">Vista de planilla</label>
            <div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-bg-secondary)]">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
                  viewMode === 'matrix'
                    ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-xs font-semibold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                )}
                title="Ver todas las evaluaciones individuales en columnas editables"
              >
                <TableIcon size={13} />
                <span>Sábana completa</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
                  viewMode === 'summary'
                    ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-xs font-semibold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                )}
                title="Ver resumen agrupado por criterios"
              >
                <BarChart3 size={13} />
                <span>Por criterios</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by_eval')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
                  viewMode === 'by_eval'
                    ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-xs font-semibold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                )}
                title="Calificar una evaluación individualmente"
              >
                <CheckSquare size={13} />
                <span>Individual</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dynamic Weight Criteria Status Cards for the Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Exams Card */}
        <div
          className="p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: examsList.length > 0 ? '#DC262640' : 'var(--color-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[var(--color-foreground)]">Exámenes</span>
              <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                40% fijo
              </span>
            </div>
            <div className="text-sm font-semibold mb-1">
              {examsList.length > 0 ? (
                <span className="text-[var(--color-foreground)]">
                  {examsList.length} {examsList.length === 1 ? 'examen' : 'exámenes'}
                </span>
              ) : (
                <span className="text-xs text-[var(--color-muted)] font-normal">Sin exámenes creados</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mb-2">
              {examsList.length > 0 ? (
                <span>
                  Cada examen vale <strong className="text-red-600">{(40 / examsList.length).toFixed(1)}%</strong> de {selectedPeriod}
                </span>
              ) : (
                <span>Los 40 puntos se dividirán entre los que agregues</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleQuickAdd('exam')}
            className="w-full mt-1 py-1 px-2 rounded text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={13} /> + Examen en {selectedPeriod}
          </button>
        </div>

        {/* Tasks Card */}
        <div
          className="p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: tasksList.length > 0 ? '#16A34A40' : 'var(--color-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[var(--color-foreground)]">Tareas</span>
              <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                30% fijo
              </span>
            </div>
            <div className="text-sm font-semibold mb-1">
              {tasksList.length > 0 ? (
                <span className="text-[var(--color-foreground)]">
                  {tasksList.length} {tasksList.length === 1 ? 'tarea' : 'tareas'}
                </span>
              ) : (
                <span className="text-xs text-[var(--color-muted)] font-normal">Sin tareas creadas</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mb-2">
              {tasksList.length > 0 ? (
                <span>
                  Cada tarea vale <strong className="text-green-600">{(30 / tasksList.length).toFixed(1)}%</strong> de {selectedPeriod}
                </span>
              ) : (
                <span>Los 30 puntos se dividirán entre las que agregues</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleQuickAdd('task')}
            className="w-full mt-1 py-1 px-2 rounded text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={13} /> + Tarea en {selectedPeriod}
          </button>
        </div>

        {/* Participation Card */}
        <div
          className="p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: partsList.length > 0 ? '#2563EB40' : 'var(--color-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[var(--color-foreground)]">Participación</span>
              <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                15% fijo
              </span>
            </div>
            <div className="text-sm font-semibold mb-1">
              {partsList.length > 0 ? (
                <span className="text-[var(--color-foreground)]">
                  {partsList.length} {partsList.length === 1 ? 'actividad' : 'actividades'}
                </span>
              ) : (
                <span className="text-xs text-[var(--color-muted)] font-normal">Sin registros</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mb-2">
              {partsList.length > 0 ? (
                <span>
                  Cada una vale <strong className="text-blue-600">{(15 / partsList.length).toFixed(1)}%</strong> de {selectedPeriod}
                </span>
              ) : (
                <span>Los 15 puntos se dividirán automáticamente</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleQuickAdd('participation')}
            className="w-full mt-1 py-1 px-2 rounded text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={13} /> + Participación en {selectedPeriod}
          </button>
        </div>

        {/* Attitude Card */}
        <div
          className="p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: attsList.length > 0 ? '#D9770640' : 'var(--color-border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[var(--color-foreground)]">Actitudes y Valores</span>
              <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                15% fijo
              </span>
            </div>
            <div className="text-sm font-semibold mb-1">
              {attsList.length > 0 ? (
                <span className="text-[var(--color-foreground)]">
                  {attsList.length} {attsList.length === 1 ? 'evaluación' : 'evaluaciones'}
                </span>
              ) : (
                <span className="text-xs text-[var(--color-muted)] font-normal">Sin registros</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mb-2">
              {attsList.length > 0 ? (
                <span>
                  Cada una vale <strong className="text-amber-600">{(15 / attsList.length).toFixed(1)}%</strong> de {selectedPeriod}
                </span>
              ) : (
                <span>Los 15 puntos se dividirán automáticamente</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleQuickAdd('other')}
            className="w-full mt-1 py-1 px-2 rounded text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={13} /> + Actitud en {selectedPeriod}
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: MATRIX SPREADSHEET (Full Activities Breakdown) */}
      {viewMode === 'matrix' && (
        <Card padding="none" className="mb-4 shadow-sm overflow-hidden">
          {/* Section Search & Filter Menu Header */}
          <div className="p-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Planilla de Calificaciones • {selectedPeriod}</h3>
                <span className="badge badge-primary">{periodEvaluations.length} actividades</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Usa el menú de secciones para calificar y verificar directamente sin necesidad de usar la barra de desplazamiento lateral.
              </p>
            </div>

            {/* Menu Dropdown: Buscar por sección */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[var(--color-foreground)] flex items-center gap-1.5 whitespace-nowrap">
                <Filter size={14} className="text-[var(--color-primary)]" />
                <span>Menú por sección:</span>
              </label>
              <select
                className="form-select text-xs py-1.5 px-3 rounded-lg font-medium border-[var(--color-border)] shadow-xs bg-[var(--color-card)] cursor-pointer"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value as typeof sectionFilter)}
                aria-label="Buscar o filtrar por sección"
              >
                <option value="all">🔍 Todas las secciones (Sábana completa)</option>
                <option value="exam">📝 Sección: Exámenes (40% • {examsList.length} col)</option>
                <option value="task">📚 Sección: Tareas (30% • {tasksList.length} col)</option>
                <option value="participation">🙋 Sección: Participación (15% • {partsList.length} col)</option>
                <option value="attitude">⭐ Sección: Actitudes y Valores (15% • {attsList.length} col)</option>
                <option value="summary">📊 Sección: Resumen y Nota Final (Subtotales)</option>
              </select>
            </div>
          </div>

          {/* Quick Section Pills / Tabs */}
          <div className="px-4 py-2.5 bg-[var(--color-card)] border-b border-[var(--color-border)] flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-muted)] mr-1">Secciones:</span>
            <button
              type="button"
              onClick={() => setSectionFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1',
                sectionFilter === 'all'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-semibold'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]'
              )}
            >
              <span>Todas</span>
              <span className="text-[10px] opacity-75">({periodEvaluations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSectionFilter('exam')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                sectionFilter === 'exam'
                  ? 'bg-red-600 text-white shadow-xs font-semibold'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/50'
              )}
            >
              <span>📝 Exámenes (40%)</span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded-full', sectionFilter === 'exam' ? 'bg-white/20' : 'bg-red-200/60')}>
                {examsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSectionFilter('task')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                sectionFilter === 'task'
                  ? 'bg-green-600 text-white shadow-xs font-semibold'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200/50'
              )}
            >
              <span>📚 Tareas (30%)</span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded-full', sectionFilter === 'task' ? 'bg-white/20' : 'bg-green-200/60')}>
                {tasksList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSectionFilter('participation')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                sectionFilter === 'participation'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50'
              )}
            >
              <span>🙋 Participación (15%)</span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded-full', sectionFilter === 'participation' ? 'bg-white/20' : 'bg-blue-200/60')}>
                {partsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSectionFilter('attitude')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                sectionFilter === 'attitude'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50'
              )}
            >
              <span>⭐ Actitudes (15%)</span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded-full', sectionFilter === 'attitude' ? 'bg-white/20' : 'bg-amber-200/60')}>
                {attsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSectionFilter('summary')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1 sm:ml-auto',
                sectionFilter === 'summary'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50'
              )}
            >
              <span>📊 Resumen / Totales</span>
            </button>
          </div>

          {periodEvaluations.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-[var(--color-muted)] mb-3">
                No hay actividades registradas en el {selectedPeriod}.
              </p>
              <div className="flex justify-center gap-2">
                <Button size="sm" onClick={() => handleQuickAdd('exam')} leftIcon={<Plus size={14} />}>
                  Crear primer examen
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleQuickAdd('task')} leftIcon={<Plus size={14} />}>
                  Crear primera tarea
                </Button>
              </div>
            </div>
          ) : (
            <div className="table-wrapper overflow-x-auto">
              <table className="table table-bordered text-xs w-full">
                <thead>
                  {/* VIEW: RESUMEN / TOTALES (No horizontal scrolling!) */}
                  {sectionFilter === 'summary' ? (
                    <>
                      <tr className="bg-[var(--color-bg-secondary)] text-center font-bold">
                        <th colSpan={2} className="text-left bg-[var(--color-card)] sticky left-0 z-20">Estudiante</th>
                        <th colSpan={4} className="bg-indigo-50 text-indigo-900 border-x border-indigo-200 py-1.5">
                          Desglose por Secciones de Evaluación ({selectedPeriod})
                        </th>
                        <th colSpan={2} className="bg-blue-600 text-white py-1.5">
                          Calificación Definitiva {selectedPeriod}
                        </th>
                      </tr>
                      <tr className="bg-[var(--color-card)] text-center text-[11px]">
                        <th className="text-left min-w-[170px] sticky left-0 z-20 bg-[var(--color-card)]">Nombre</th>
                        <th className="hidden sm:table-cell text-left min-w-[90px] text-[var(--color-muted)]">Matrícula</th>
                        <th className="bg-red-50 text-red-800 font-bold min-w-[100px]">📝 Exámenes (40 pts)</th>
                        <th className="bg-green-50 text-green-800 font-bold min-w-[100px]">📚 Tareas (30 pts)</th>
                        <th className="bg-blue-50 text-blue-800 font-bold min-w-[100px]">🙋 Part. (15 pts)</th>
                        <th className="bg-amber-50 text-amber-800 font-bold min-w-[100px]">⭐ Actitud (15 pts)</th>
                        <th className="bg-blue-100 font-black text-blue-900 min-w-[110px]">TOTAL {selectedPeriod} (100)</th>
                        <th className="min-w-[90px]">Nivel</th>
                      </tr>
                    </>
                  ) : (
                    <>
                      {/* Tier 1 Header: Category Groups */}
                      <tr className="bg-[var(--color-bg-secondary)] text-center font-bold">
                        <th colSpan={2} className="text-left bg-[var(--color-card)] sticky left-0 z-20">Estudiante</th>

                        {/* Exams Group */}
                        {(sectionFilter === 'all' || sectionFilter === 'exam') && examsList.length > 0 && (
                          <th
                            colSpan={examsList.length + 1}
                            className="bg-red-50 text-red-800 border-x border-red-200 py-1.5"
                          >
                            <div className="flex items-center justify-between px-2">
                              <span>EXÁMENES (40% Total • {(40 / examsList.length).toFixed(1)}% c/u)</span>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd('exam')}
                                className="text-[11px] px-2 py-0.5 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition cursor-pointer"
                              >
                                + Examen
                              </button>
                            </div>
                          </th>
                        )}

                        {/* Tasks Group */}
                        {(sectionFilter === 'all' || sectionFilter === 'task') && tasksList.length > 0 && (
                          <th
                            colSpan={tasksList.length + 1}
                            className="bg-green-50 text-green-800 border-x border-green-200 py-1.5"
                          >
                            <div className="flex items-center justify-between px-2">
                              <span>TAREAS (30% Total • {(30 / tasksList.length).toFixed(1)}% c/u)</span>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd('task')}
                                className="text-[11px] px-2 py-0.5 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition cursor-pointer"
                              >
                                + Tarea
                              </button>
                            </div>
                          </th>
                        )}

                        {/* Participation Group */}
                        {(sectionFilter === 'all' || sectionFilter === 'participation') && partsList.length > 0 && (
                          <th
                            colSpan={partsList.length + 1}
                            className="bg-blue-50 text-blue-800 border-x border-blue-200 py-1.5"
                          >
                            <div className="flex items-center justify-between px-2">
                              <span>PARTICIPACIÓN (15% Total • {(15 / partsList.length).toFixed(1)}% c/u)</span>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd('participation')}
                                className="text-[11px] px-2 py-0.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer"
                              >
                                + Part.
                              </button>
                            </div>
                          </th>
                        )}

                        {/* Attitude Group */}
                        {(sectionFilter === 'all' || sectionFilter === 'attitude') && attsList.length > 0 && (
                          <th
                            colSpan={attsList.length + 1}
                            className="bg-amber-50 text-amber-800 border-x border-amber-200 py-1.5"
                          >
                            <div className="flex items-center justify-between px-2">
                              <span>ACTITUDES (15% Total • {(15 / attsList.length).toFixed(1)}% c/u)</span>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd('other')}
                                className="text-[11px] px-2 py-0.5 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 transition cursor-pointer"
                              >
                                + Actitud
                              </button>
                            </div>
                          </th>
                        )}

                        {sectionFilter === 'all' ? (
                          <th rowSpan={2} className="text-center font-black bg-blue-600 text-white text-xs align-middle">
                            NOTA {selectedPeriod}
                            <span className="block text-[10px] font-normal opacity-90">(100 pts)</span>
                          </th>
                        ) : (
                          <th rowSpan={2} className="text-center font-black bg-blue-600 text-white text-xs align-middle">
                            NOTA FINAL
                            <span className="block text-[10px] font-normal opacity-90">({selectedPeriod})</span>
                          </th>
                        )}
                      </tr>

                      {/* Tier 2 Header: Individual Activity Columns */}
                      <tr className="bg-[var(--color-card)] text-center text-[11px]">
                        <th className="text-left min-w-[170px] sticky left-0 z-20 bg-[var(--color-card)]">Nombre</th>
                        <th className="hidden sm:table-cell text-left min-w-[90px] text-[var(--color-muted)]">Matrícula</th>

                        {/* Exam Columns */}
                        {(sectionFilter === 'all' || sectionFilter === 'exam') && examsList.map((ev) => (
                          <th key={ev.id} className="min-w-[80px] p-2 bg-red-50/40">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate" title={ev.name}>{ev.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteEval(ev)}
                                className="text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                title="Eliminar examen"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <span className="text-[10px] text-red-600 block font-semibold">
                              {(40 / examsList.length).toFixed(1)}%
                            </span>
                          </th>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'exam') && examsList.length > 0 && (
                          <th className="min-w-[70px] bg-red-100/70 font-bold text-red-800 border-r border-red-200">
                            Subt.(40)
                          </th>
                        )}

                        {/* Task Columns */}
                        {(sectionFilter === 'all' || sectionFilter === 'task') && tasksList.map((ev) => (
                          <th key={ev.id} className="min-w-[80px] p-2 bg-green-50/40">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate" title={ev.name}>{ev.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteEval(ev)}
                                className="text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                title="Eliminar tarea"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <span className="text-[10px] text-green-600 block font-semibold">
                              {(30 / tasksList.length).toFixed(1)}%
                            </span>
                          </th>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'task') && tasksList.length > 0 && (
                          <th className="min-w-[70px] bg-green-100/70 font-bold text-green-800 border-r border-green-200">
                            Subt.(30)
                          </th>
                        )}

                        {/* Participation Columns */}
                        {(sectionFilter === 'all' || sectionFilter === 'participation') && partsList.map((ev) => (
                          <th key={ev.id} className="min-w-[80px] p-2 bg-blue-50/40">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate" title={ev.name}>{ev.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteEval(ev)}
                                className="text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                title="Eliminar"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <span className="text-[10px] text-blue-600 block font-semibold">
                              {(15 / partsList.length).toFixed(1)}%
                            </span>
                          </th>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'participation') && partsList.length > 0 && (
                          <th className="min-w-[70px] bg-blue-100/70 font-bold text-blue-800 border-r border-blue-200">
                            Subt.(15)
                          </th>
                        )}

                        {/* Attitude Columns */}
                        {(sectionFilter === 'all' || sectionFilter === 'attitude') && attsList.map((ev) => (
                          <th key={ev.id} className="min-w-[80px] p-2 bg-amber-50/40">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate" title={ev.name}>{ev.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteEval(ev)}
                                className="text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                title="Eliminar"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <span className="text-[10px] text-amber-600 block font-semibold">
                              {(15 / attsList.length).toFixed(1)}%
                            </span>
                          </th>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'attitude') && attsList.length > 0 && (
                          <th className="min-w-[70px] bg-amber-100/70 font-bold text-amber-800 border-r border-amber-200">
                            Subt.(15)
                          </th>
                        )}
                      </tr>
                    </>
                  )}
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentGrades = db.grades.listByStudent(courseId, student.id)
                    const gradeMap = new Map(studentGrades.map((g) => [g.evaluationId, g.score]))
                    const breakdown = calculateStudentPeriodBreakdown(studentGrades, allEvaluations, selectedPeriod as PeriodId)

                    // RENDER: RESUMEN / TOTALES
                    if (sectionFilter === 'summary') {
                      return (
                        <tr key={student.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                          <td className="font-semibold text-xs sticky left-0 z-10 bg-[var(--color-card)] border-r border-[var(--color-border)]">
                            <div className="flex items-center gap-2">
                              <div
                                className="avatar avatar-sm font-semibold"
                                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 10 }}
                              >
                                {getInitials(student.firstName, student.lastName)}
                              </div>
                              <span>{getFullName(student.firstName, student.lastName)}</span>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell text-xs text-[var(--color-muted)] font-mono">
                            {student.studentId}
                          </td>
                          <td className="text-center font-bold text-xs bg-red-50/30 text-red-700">
                            {breakdown.categories.exam.pointsEarned.toFixed(1)} <span className="text-[10px] text-[var(--color-muted)] font-normal">/ 40</span>
                          </td>
                          <td className="text-center font-bold text-xs bg-green-50/30 text-green-700">
                            {breakdown.categories.task.pointsEarned.toFixed(1)} <span className="text-[10px] text-[var(--color-muted)] font-normal">/ 30</span>
                          </td>
                          <td className="text-center font-bold text-xs bg-blue-50/30 text-blue-700">
                            {breakdown.categories.participation.pointsEarned.toFixed(1)} <span className="text-[10px] text-[var(--color-muted)] font-normal">/ 15</span>
                          </td>
                          <td className="text-center font-bold text-xs bg-amber-50/30 text-amber-700">
                            {breakdown.categories.attitude.pointsEarned.toFixed(1)} <span className="text-[10px] text-[var(--color-muted)] font-normal">/ 15</span>
                          </td>
                          <td className="text-center font-black text-sm bg-blue-50/80">
                            {breakdown.hasGrades ? (
                              <span className={cn('tabular-nums', getGradeColor(breakdown.totalScore))}>
                                {breakdown.totalScore.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-[var(--color-muted)] text-xs">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            <Badge variant={breakdown.totalScore >= 70 ? 'success' : 'danger'}>
                              {breakdown.totalScore >= 70 ? 'Aprobado' : 'Riesgo'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr key={student.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                        <td className="font-semibold text-xs sticky left-0 z-10 bg-[var(--color-card)] border-r border-[var(--color-border)]">
                          <div className="flex items-center gap-2">
                            <div
                              className="avatar avatar-sm font-semibold"
                              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 10 }}
                            >
                              {getInitials(student.firstName, student.lastName)}
                            </div>
                            <span>{getFullName(student.firstName, student.lastName)}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell text-xs text-[var(--color-muted)] font-mono">
                          {student.studentId}
                        </td>

                        {/* Exam Cells */}
                        {(sectionFilter === 'all' || sectionFilter === 'exam') && examsList.map((ev) => (
                          <td key={ev.id} className="text-center p-1.5 bg-red-50/20">
                            <MatrixGradeCell
                              score={gradeMap.get(ev.id)}
                              maxScore={ev.maxScore}
                              onSave={(val) => handleUpdateGrade(student.id, ev.id, val)}
                            />
                          </td>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'exam') && examsList.length > 0 && (
                          <td className="text-center font-bold text-xs bg-red-100/40 text-red-700 border-r border-red-200">
                            {breakdown.categories.exam.pointsEarned.toFixed(1)}
                          </td>
                        )}

                        {/* Task Cells */}
                        {(sectionFilter === 'all' || sectionFilter === 'task') && tasksList.map((ev) => (
                          <td key={ev.id} className="text-center p-1.5 bg-green-50/20">
                            <MatrixGradeCell
                              score={gradeMap.get(ev.id)}
                              maxScore={ev.maxScore}
                              onSave={(val) => handleUpdateGrade(student.id, ev.id, val)}
                            />
                          </td>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'task') && tasksList.length > 0 && (
                          <td className="text-center font-bold text-xs bg-green-100/40 text-green-700 border-r border-green-200">
                            {breakdown.categories.task.pointsEarned.toFixed(1)}
                          </td>
                        )}

                        {/* Participation Cells */}
                        {(sectionFilter === 'all' || sectionFilter === 'participation') && partsList.map((ev) => (
                          <td key={ev.id} className="text-center p-1.5 bg-blue-50/20">
                            <MatrixGradeCell
                              score={gradeMap.get(ev.id)}
                              maxScore={ev.maxScore}
                              onSave={(val) => handleUpdateGrade(student.id, ev.id, val)}
                            />
                          </td>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'participation') && partsList.length > 0 && (
                          <td className="text-center font-bold text-xs bg-blue-100/40 text-blue-700 border-r border-blue-200">
                            {breakdown.categories.participation.pointsEarned.toFixed(1)}
                          </td>
                        )}

                        {/* Attitude Cells */}
                        {(sectionFilter === 'all' || sectionFilter === 'attitude') && attsList.map((ev) => (
                          <td key={ev.id} className="text-center p-1.5 bg-amber-50/20">
                            <MatrixGradeCell
                              score={gradeMap.get(ev.id)}
                              maxScore={ev.maxScore}
                              onSave={(val) => handleUpdateGrade(student.id, ev.id, val)}
                            />
                          </td>
                        ))}
                        {(sectionFilter === 'all' || sectionFilter === 'attitude') && attsList.length > 0 && (
                          <td className="text-center font-bold text-xs bg-amber-100/40 text-amber-700 border-r border-amber-200">
                            {breakdown.categories.attitude.pointsEarned.toFixed(1)}
                          </td>
                        )}

                        {/* Total Period Grade */}
                        <td className="text-center font-black text-sm bg-blue-50/70">
                          {breakdown.hasGrades ? (
                            <span className={cn('tabular-nums', getGradeColor(breakdown.totalScore))}>
                              {breakdown.totalScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)] text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* VIEW MODE 2: SUMMARY BY CRITERIA */}
      {viewMode === 'summary' && (
        <Card padding="none" className="mb-4 shadow-sm overflow-hidden">
          <div className="p-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
            <h3 className="font-bold text-sm">Resumen Oficial por Criterios • {selectedPeriod}</h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Exámenes (40%) + Tareas (30%) + Participación (15%) + Actitudes (15%) = 100%
            </p>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th className="hidden md:table-cell">Matrícula</th>
                  <th className="text-center font-bold text-red-600">Exámenes (40%)</th>
                  <th className="text-center font-bold text-green-600">Tareas (30%)</th>
                  <th className="text-center font-bold text-blue-600">Part. (15%)</th>
                  <th className="text-center font-bold text-amber-600">Actitud (15%)</th>
                  <th className="text-center font-black bg-blue-50/50">Nota {selectedPeriod}</th>
                  <th className="text-center font-black hidden xl:table-cell">Promedio Anual</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const studentGrades = db.grades.listByStudent(courseId, student.id)
                  const breakdown = calculateStudentPeriodBreakdown(studentGrades, allEvaluations, selectedPeriod as PeriodId)
                  const annual = calculateStudentAnnualGrades(studentGrades, allEvaluations)
                  const lvl = gradeLevel(breakdown.totalScore)

                  return (
                    <tr key={student.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="avatar avatar-sm font-semibold"
                            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 11 }}
                          >
                            {getInitials(student.firstName, student.lastName)}
                          </div>
                          <span className="font-semibold text-sm">{getFullName(student.firstName, student.lastName)}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell text-xs text-[var(--color-muted)] font-mono">{student.studentId}</td>
                      <td className="text-center font-bold text-xs tabular-nums text-red-600">
                        {breakdown.categories.exam.evaluationsCount > 0 ? `${breakdown.categories.exam.pointsEarned.toFixed(1)} / 40` : '—'}
                      </td>
                      <td className="text-center font-bold text-xs tabular-nums text-green-600">
                        {breakdown.categories.task.evaluationsCount > 0 ? `${breakdown.categories.task.pointsEarned.toFixed(1)} / 30` : '—'}
                      </td>
                      <td className="text-center font-bold text-xs tabular-nums text-blue-600">
                        {breakdown.categories.participation.evaluationsCount > 0 ? `${breakdown.categories.participation.pointsEarned.toFixed(1)} / 15` : '—'}
                      </td>
                      <td className="text-center font-bold text-xs tabular-nums text-amber-600">
                        {breakdown.categories.attitude.evaluationsCount > 0 ? `${breakdown.categories.attitude.pointsEarned.toFixed(1)} / 15` : '—'}
                      </td>
                      <td className="text-center bg-blue-50/30">
                        {breakdown.hasGrades ? (
                          <span className={cn('text-sm font-black tabular-nums', getGradeColor(breakdown.totalScore))}>
                            {breakdown.totalScore.toFixed(1)}
                          </span>
                        ) : <span className="text-[var(--color-muted)] text-xs">—</span>}
                      </td>
                      <td className="text-center hidden xl:table-cell">
                        {annual.evaluatedPeriodsCount > 0 ? (
                          <span className={cn('text-xs font-bold tabular-nums', getGradeColor(annual.annualAverage))}>
                            {annual.annualAverage.toFixed(1)}
                          </span>
                        ) : <span className="text-[var(--color-muted)] text-xs">—</span>}
                      </td>
                      <td className="text-center">
                        {breakdown.hasGrades ? (
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full inline-block',
                            lvl === 'excellent' ? 'bg-green-100 text-green-800' :
                            lvl === 'good' ? 'bg-blue-100 text-blue-800' :
                            lvl === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {gradeLevelLabels[lvl]}
                          </span>
                        ) : <span className="text-[var(--color-muted)] text-xs">Sin notas</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* VIEW MODE 3: INDIVIDUAL EVALUATION GRADING */}
      {viewMode === 'by_eval' && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[var(--color-muted)] mb-1">
                Seleccionar evaluación en {selectedPeriod}
              </label>
              {periodEvaluations.length > 0 ? (
                <Select
                  value={selectedEval?.id ?? ''}
                  onChange={(e) => setEvalId(e.target.value)}
                  options={periodEvaluations.map((ev) => {
                    const dynamicWeight = getEvaluationDynamicWeight(ev, allEvaluations)
                    const catName = CRITERIA_CONFIG[getCriteriaKey(ev.type)]?.name ?? ev.type
                    return {
                      value: ev.id,
                      label: `${ev.name} • [${catName}] (Peso: ${dynamicWeight}%)`,
                    }
                  })}
                />
              ) : (
                <p className="text-xs text-[var(--color-muted)]">No hay evaluaciones en {selectedPeriod}.</p>
              )}
            </div>
            {selectedEval && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                leftIcon={<Trash2 size={14} />}
                onClick={() => handleDeleteEval(selectedEval)}
              >
                Eliminar evaluación
              </Button>
            )}
          </div>

          {selectedEval && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th className="hidden md:table-cell">Matrícula</th>
                    <th className="text-center">Calificación (0 - {selectedEval.maxScore})</th>
                    <th className="text-center">% Obtenido</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentGrades = db.grades.listByStudent(courseId, student.id)
                    const grade = studentGrades.find((g) => g.evaluationId === selectedEval.id)
                    const pct = grade !== undefined ? Math.round((grade.score / selectedEval.maxScore) * 100) : null

                    return (
                      <tr key={student.id}>
                        <td className="font-semibold text-sm">{getFullName(student.firstName, student.lastName)}</td>
                        <td className="hidden md:table-cell text-xs text-[var(--color-muted)] font-mono">{student.studentId}</td>
                        <td className="text-center">
                          <MatrixGradeCell
                            score={grade?.score}
                            maxScore={selectedEval.maxScore}
                            onSave={(val) => handleUpdateGrade(student.id, selectedEval.id, val)}
                          />
                        </td>
                        <td className="text-center">
                          {pct !== null ? (
                            <span className={cn('text-xs font-bold tabular-nums', getGradeColor(pct))}>{pct}%</span>
                          ) : <span className="text-[var(--color-muted)] text-xs">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal Nueva Evaluación */}
      <Modal
        open={newEvalOpen}
        onClose={() => setNewEvalOpen(false)}
        title={`Nueva evaluación • ${selectedPeriod}`}
        maxWidth="lg"
      >
        <NewEvaluationForm
          courseId={courseId}
          initialPeriod={selectedPeriod}
          initialType={modalCategoryType}
          periods={periods}
          existingEvals={allEvaluations}
          onClose={() => setNewEvalOpen(false)}
          onCreated={(e) => {
            setEvalId(e.id)
            setRefreshKey((k) => k + 1)
          }}
        />
      </Modal>

      {/* Modal Agregar Nuevo Período */}
      <Modal
        open={newPeriodModalOpen}
        onClose={() => setNewPeriodModalOpen(false)}
        title="Agregar nuevo período académico"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Código o sigla del período"
            placeholder="Ej: P5, REC, EXTRA"
            required
            value={newPeriodShort}
            onChange={(e) => setNewPeriodShort(e.target.value.toUpperCase())}
          />
          <Input
            label="Nombre descriptivo"
            placeholder="Ej: Quinto Período, Período de Recuperación"
            value={newPeriodName}
            onChange={(e) => setNewPeriodName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setNewPeriodModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCustomPeriod}>Crear período</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación de Eliminación */}
      <ConfirmDialog
        open={!!evalToDelete}
        onClose={() => setEvalToDelete(null)}
        onConfirm={confirmDeleteEval}
        title="Eliminar evaluación"
        message={`¿Eliminar la evaluación "${evalToDelete?.name}"? Los pesos de su categoría en ${selectedPeriod} se reajustarán automáticamente.`}
        confirmLabel="Eliminar evaluación"
        danger
      />
    </>
  )
}
