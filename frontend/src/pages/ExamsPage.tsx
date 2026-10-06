import React, { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, FileText, Calendar, Layers, CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, Textarea, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui'
import { CriteriaSettingsModal } from '@/components/common/CriteriaSettingsModal'
import { db, useCourses } from '@/lib/mockData'
import { useAppStore } from '@/store'
import { toast } from '@/store'
import {
  evaluationTypeLabels, formatDate, cn, ACADEMIC_PERIODS,
  CRITERIA_CONFIG, CRITERIA_FORM_OPTIONS, getCriteriaKey,
  getEvaluationDynamicWeight, getCriteriaWeights
} from '@/lib/utils'
import type { Evaluation, EvaluationType, PeriodId } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['exam', 'task', 'quiz', 'project', 'participation', 'work', 'other']),
  period: z.enum(['P1', 'P2', 'P3', 'P4']),
  date: z.string().min(1, 'La fecha es requerida'),
  description: z.string().optional(),
  maxScore: z.preprocess((v) => Number(v), z.number().min(1).max(1000)),
  courseId: z.string().min(1),
})

type ExamFormData = {
  name: string
  type: EvaluationType
  period: PeriodId
  date: string
  description?: string
  maxScore: number
  courseId: string
}

function ExamForm({
  courseId,
  initialPeriod,
  existingEvals,
  onClose,
  onSuccess,
}: {
  courseId: string
  initialPeriod: PeriodId
  existingEvals: Evaluation[]
  onClose: () => void
  onSuccess: () => void
}) {
  const courses = useCourses()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ExamFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      type: 'exam',
      period: initialPeriod,
      maxScore: 100,
      courseId,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const watchedType = watch('type') || 'exam'
  const watchedPeriod = watch('period') || initialPeriod
  const criteriaKey = getCriteriaKey(watchedType as EvaluationType)
  const categoryInfo = CRITERIA_CONFIG[criteriaKey]

  const countInCat = existingEvals.filter(
    (e) => (e.period || 'P1') === watchedPeriod && getCriteriaKey(e.type) === criteriaKey
  ).length
  const projectedCount = countInCat + 1
  const projectedWeight = Math.round((categoryInfo.weight / projectedCount) * 10) / 10

  const onSubmit = (data: ExamFormData) => {
    db.evaluations.create({
      ...data,
      weight: projectedWeight,
    })
    toast.success('Evaluación creada', `${data.name} asignada a ${data.period}`)
    onSuccess()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Dynamic preview */}
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
          Al agregar esta actividad, habrá <strong>{projectedCount}</strong> en la categoría de {categoryInfo.name} para {watchedPeriod}.
          Cada una valdrá automáticamente <strong style={{ color: categoryInfo.color }}>{projectedWeight}%</strong> de la nota del período.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--color-foreground)]">Curso</label>
          <select className="form-select text-sm w-full" {...register('courseId')}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.room ? ` (Aula ${c.room})` : (c.group ? ` (${c.group})` : '')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--color-foreground)]">Período escolar</label>
          <select className="form-select text-sm w-full" {...register('period')}>
            {ACADEMIC_PERIODS.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.shortName})</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
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
            placeholder={watchedType === 'exam' ? 'Ej: Examen Parcial 1' : 'Ej: Tarea 1: Ejercicios de Aplicación'}
            {...register('name')}
          />
        </div>

        <Input label="Fecha" type="date" required error={errors.date?.message} {...register('date')} />
        <Input label="Puntuación máxima" type="number" required error={errors.maxScore?.message} {...register('maxScore')} />

        <div className="col-span-2">
          <Textarea label="Descripción" placeholder="Detalles, temas a evaluar o instrucciones para los estudiantes..." {...register('description')} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>Crear evaluación</Button>
      </div>
    </form>
  )
}

function EvalCard({
  ev,
  allEvaluations,
  onDelete,
}: {
  ev: Evaluation
  allEvaluations: Evaluation[]
  onDelete: (e: Evaluation) => void
}) {
  const course = db.courses.get(ev.courseId)
  const students = db.students.list(ev.courseId).filter((s) => s.status === 'active')
  const grades = db.grades.listByEval(ev.courseId, ev.id)
  const graded = grades.length
  const total = students.length
  const isPast = new Date(ev.date) < new Date()

  const criteriaKey = getCriteriaKey(ev.type)
  const categoryInfo = CRITERIA_CONFIG[criteriaKey]
  const dynamicWeight = getEvaluationDynamicWeight(ev, allEvaluations)

  return (
    <Card className="flex flex-col gap-3 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="badge badge-sm font-bold text-white"
            style={{ backgroundColor: categoryInfo.color }}
          >
            {ev.period || 'P1'} • {categoryInfo.name}
          </span>
          {isPast && graded < total && <Badge variant="warning">Pendiente calificar</Badge>}
          {graded === total && total > 0 && <Badge variant="success">Calificado ({graded})</Badge>}
        </div>
        <button
          className="btn btn-ghost btn-icon p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
          onClick={() => onDelete(ev)}
          title="Eliminar evaluación"
          aria-label="Eliminar evaluación"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div>
        <h3 className="font-bold text-base text-[var(--color-foreground)]">{ev.name}</h3>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">{course?.name} – {course?.group}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-[var(--color-bg-secondary)] text-xs">
        <div>
          <span className="text-[10px] text-[var(--color-muted)] block">Fecha</span>
          <span className="font-semibold">{formatDate(ev.date)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--color-muted)] block">Puntos máx.</span>
          <span className="font-semibold">{ev.maxScore} pts</span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--color-muted)] block">Peso en {ev.period || 'P1'}</span>
          <span className="font-bold" style={{ color: categoryInfo.color }}>{dynamicWeight}%</span>
        </div>
      </div>

      {ev.description && <p className="text-xs text-[var(--color-muted)] line-clamp-2 italic">{ev.description}</p>}

      {/* Progress Bar */}
      <div className="mt-auto pt-2 border-t border-[var(--color-border)]">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[var(--color-muted)]">Estudiantes calificados</span>
          <span className="font-bold tabular-nums">{graded} / {total}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: total ? `${(graded / total) * 100}%` : '0%',
              backgroundColor: graded === total ? 'var(--color-success)' : categoryInfo.color,
            }}
          />
        </div>
      </div>
    </Card>
  )
}

export default function ExamsPage() {
  const { selectedCourseId } = useAppStore()
  const courses = useCourses()
  const [filterCourse, setFilterCourse] = useState(selectedCourseId ?? '')
  const [filterPeriod, setFilterPeriod] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [evalToDelete, setEvalToDelete] = useState<Evaluation | null>(null)
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false)

  // Escuchar cambios de criterios
  useEffect(() => {
    const handler = () => setRefreshCount((c) => c + 1)
    window.addEventListener('classflow_criteria_changed', handler)
    return () => window.removeEventListener('classflow_criteria_changed', handler)
  }, [])

  const currentWeights = useMemo(() => getCriteriaWeights(), [refreshCount])

  const allEvals = useMemo(() => {
    return courses.flatMap((c) => db.evaluations.list(c.id))
  }, [courses, refreshCount])

  const filtered = useMemo(() => {
    return allEvals.filter((e) => {
      const matchCourse = filterCourse ? e.courseId === filterCourse : true
      const matchPeriod = filterPeriod ? (e.period || 'P1') === filterPeriod : true
      return matchCourse && matchPeriod
    })
  }, [allEvals, filterCourse, filterPeriod])

  const handleDelete = (e: Evaluation) => {
    setEvalToDelete(e)
  }

  const confirmDeleteEval = () => {
    if (!evalToDelete) return
    db.evaluations.delete(evalToDelete.courseId, evalToDelete.id)
    toast.success('Evaluación eliminada')
    setRefreshCount((c) => c + 1)
    setEvalToDelete(null)
  }

  return (
    <>
      <PageHeader
        title="Exámenes y Evaluaciones"
        subtitle={`${filtered.length} evaluaciones en total • Criterios activos: ${currentWeights.exam}% Exámenes, ${currentWeights.task}% Tareas, ${currentWeights.participation}% Part., ${currentWeights.attitude}% Actitud`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<SlidersHorizontal size={15} />}
              onClick={() => setCriteriaModalOpen(true)}
              title="Ajustar ponderaciones fijas"
            >
              Ponderaciones ({currentWeights.exam}/{currentWeights.task}/{currentWeights.participation}/{currentWeights.attitude})
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Nueva evaluación
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="w-60">
              <label className="block text-xs font-semibold text-[var(--color-muted)] mb-1">Filtrar por curso</label>
              <select
                className="form-select text-sm w-full"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                aria-label="Filtrar por curso"
              >
                <option value="">Todos los cursos</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.room ? ` (Aula ${c.room})` : (c.group ? ` (${c.group})` : '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Filter Tabs */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] mb-1">Período escolar</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFilterPeriod('')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                    filterPeriod === ''
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-card)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                  )}
                >
                  Todos ({allEvals.length})
                </button>
                {ACADEMIC_PERIODS.map((p) => {
                  const count = allEvals.filter((e) => (e.period || 'P1') === p.id).length
                  const active = filterPeriod === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setFilterPeriod(p.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5',
                        active
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'bg-[var(--color-card)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                      )}
                    >
                      <span>{p.shortName}</span>
                      <span className={cn('text-[10px] px-1 rounded-full font-bold', active ? 'bg-white/20' : 'bg-[var(--color-border)]')}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid of evaluations */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="No hay evaluaciones con estos filtros"
          description="Crea una nueva evaluación para asignarla a un período y criterio."
          action={<Button leftIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nueva evaluación</Button>}
        />
      ) : (
        <div className="courses-grid">
          {filtered.map((ev) => (
            <EvalCard
              key={ev.id}
              ev={ev}
              allEvaluations={allEvals}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva evaluación"
        maxWidth="lg"
      >
        <ExamForm
          courseId={filterCourse || courses[0]?.id || ''}
          initialPeriod={(filterPeriod as PeriodId) || 'P1'}
          existingEvals={allEvals}
          onClose={() => setModalOpen(false)}
          onSuccess={() => setRefreshCount((c) => c + 1)}
        />
      </Modal>

      {/* Confirmación para Eliminar Evaluación */}
      <ConfirmDialog
        open={!!evalToDelete}
        onClose={() => setEvalToDelete(null)}
        onConfirm={confirmDeleteEval}
        title="Eliminar evaluación"
        message={`¿Eliminar "${evalToDelete?.name}"? Los pesos del criterio se redistribuirán dinámicamente.`}
        confirmLabel="Eliminar evaluación"
        danger
      />

      <CriteriaSettingsModal
        open={criteriaModalOpen}
        onClose={() => setCriteriaModalOpen(false)}
        onSaved={() => setRefreshCount((c) => c + 1)}
      />
    </>
  )
}
