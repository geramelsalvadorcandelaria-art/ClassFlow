import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Users, Star, ClipboardCheck, MoreVertical, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { Card, Button, Badge, Modal, Input, Select, Textarea, ProgressBar, EmptyState, PageHeader, ConfirmDialog } from '@/components/ui'
import { db, useCourses } from '@/lib/mockData'
import { useAppStore, useAuthStore, toast } from '@/store'
import { cn, courseStatusLabels, formatDate } from '@/lib/utils'
import type { Course, CreateCourseForm, CourseStatus } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  room: z.string().min(1, 'Aula requerida'),
  schedule: z.string().min(2, 'Horario requerido'),
})

type CourseFormData = z.infer<typeof schema>

function CourseCard({ course, onEdit, onDelete }: { course: Course; onEdit: (c: Course) => void; onDelete: (c: Course) => void }) {
  const { setSelectedCourse } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColor: Record<CourseStatus, 'success' | 'neutral' | 'warning'> = {
    active: 'success', completed: 'neutral', draft: 'warning',
  }

  return (
    <Card className="flex flex-col gap-4 relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] flex-shrink-0 flex items-center justify-center"
            style={{ background: 'var(--color-primary-light)' }}>
            <BookOpen size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{course.name}</h3>
            <p className="text-xs text-[var(--color-muted)]">Aula {course.room}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={statusColor[course.status]}>{courseStatusLabels[course.status]}</Badge>
          <div className="relative">
            <button className="btn btn-ghost btn-icon p-1" onClick={() => setMenuOpen((v) => !v)} aria-label="Más opciones">
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg py-1 w-36">
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-muted-bg)]"
                  onClick={() => { onEdit(course); setMenuOpen(false) }}>
                  <Pencil size={13} /> Editar
                </button>
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-[var(--color-danger-bg)]"
                  onClick={() => { onDelete(course); setMenuOpen(false) }}>
                  <Trash2 size={13} /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-xs text-[var(--color-muted)]">
        <div className="flex items-start gap-1.5">
          <span className="flex-shrink-0">🕐</span>
          <span className="font-medium text-[var(--color-foreground)] line-clamp-2">
            {course.schedule || 'Sin horario definido'}
          </span>
        </div>
        <div>👥 {course.studentCount} estudiantes</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--color-muted)]">Promedio</span>
            <span className="text-xs font-bold">{course.averageGrade ?? 0}%</span>
          </div>
          <ProgressBar value={course.averageGrade ?? 0} color="var(--color-primary)" size="sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--color-muted)]">Asistencia</span>
            <span className="text-xs font-bold text-green-600">{course.attendanceRate ?? 0}%</span>
          </div>
          <ProgressBar value={course.attendanceRate ?? 0} color="var(--color-success)" size="sm" />
        </div>
      </div>

      {/* CTA */}
      <Link
        to="/attendance"
        onClick={() => setSelectedCourse(course.id)}
        className="btn btn-primary btn-sm w-full justify-center"
      >
        <ArrowRight size={14} />
        Entrar al curso
      </Link>
    </Card>
  )
}

interface ScheduleBlock {
  id: string
  day: string
  dayShort: string
  startTime: string
  endTime: string
}

const WEEK_DAYS = [
  { full: 'Lunes', short: 'Lun' },
  { full: 'Martes', short: 'Mar' },
  { full: 'Miércoles', short: 'Mié' },
  { full: 'Jueves', short: 'Jue' },
  { full: 'Viernes', short: 'Vie' },
  { full: 'Sábado', short: 'Sáb' },
  { full: 'Domingo', short: 'Dom' },
]

function parseScheduleToBlocks(scheduleStr: string): ScheduleBlock[] {
  if (!scheduleStr) return []
  const blocks: ScheduleBlock[] = []
  const parts = scheduleStr.split(',').map((p) => p.trim()).filter(Boolean)

  for (const part of parts) {
    const timeMatch = part.match(/(\d{1,2}:\d{2})\s*(?:-|a|–)\s*(\d{1,2}:\d{2})/)
    const start = timeMatch ? timeMatch[1].padStart(5, '0') : '08:00'
    const end = timeMatch ? timeMatch[2].padStart(5, '0') : '09:30'

    for (const d of WEEK_DAYS) {
      if (new RegExp(`\\b${d.short}\\b|\\b${d.full}\\b`, 'i').test(part)) {
        blocks.push({
          id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          day: d.full,
          dayShort: d.short,
          startTime: start,
          endTime: end,
        })
      }
    }
  }
  return blocks
}

function formatBlocksToSchedule(blocks: ScheduleBlock[]): string {
  if (blocks.length === 0) return ''
  return blocks
    .map((b) => `${b.dayShort} ${b.startTime}-${b.endTime}`)
    .join(', ')
}

function CourseForm({ course, onClose }: { course?: Course; onClose: () => void }) {
  const { user } = useAuthStore()
  const initialSchedule = course?.schedule ?? ''
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>(() =>
    parseScheduleToBlocks(initialSchedule)
  )
  const [customSchedule, setCustomSchedule] = useState(initialSchedule)

  // New block inputs
  const [newDay, setNewDay] = useState('Lun')
  const [newStart, setNewStart] = useState('12:00')
  const [newEnd, setNewEnd] = useState('15:00')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CourseFormData>({
    resolver: zodResolver(schema),
    defaultValues: course ? {
      name: course.name,
      room: course.room,
      schedule: course.schedule,
    } : {
      name: '',
      room: '',
      schedule: '',
    },
  })

  // Synchronize blocks to form schedule
  const syncBlocks = (updatedBlocks: ScheduleBlock[]) => {
    setScheduleBlocks(updatedBlocks)
    const formatted = formatBlocksToSchedule(updatedBlocks)
    setCustomSchedule(formatted)
    setValue('schedule', formatted, { shouldValidate: true })
  }

  const handleAddScheduleBlock = () => {
    if (!newStart || !newEnd) {
      toast.error('Horas incompletas', 'Indica la hora de inicio y de fin')
      return
    }

    const dayObj = WEEK_DAYS.find((d) => d.short === newDay) || WEEK_DAYS[0]
    const newBlock: ScheduleBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      day: dayObj.full,
      dayShort: dayObj.short,
      startTime: newStart,
      endTime: newEnd,
    }

    const updated = [...scheduleBlocks, newBlock]
    syncBlocks(updated)
    toast.success('Horario agregado', `${dayObj.full} de ${newStart} a ${newEnd}`)
  }

  const handleRemoveBlock = (id: string) => {
    const updated = scheduleBlocks.filter((b) => b.id !== id)
    syncBlocks(updated)
  }

  const onSubmit = (data: CourseFormData) => {
    const finalSchedule = customSchedule.trim() || data.schedule.trim()
    if (!finalSchedule) {
      toast.error('Horario requerido', 'Agrega al menos un día y horario de clase.')
      return
    }

    const coursePayload = {
      ...data,
      schedule: finalSchedule,
    }

    if (course) {
      db.courses.update(course.id, coursePayload)
      toast.success('Curso actualizado', `"${data.name}" fue actualizado correctamente.`)
    } else {
      const year = new Date().getFullYear()
      const full: CreateCourseForm = {
        ...coursePayload,
        code: data.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'CUR',
        group: '',
        description: '',
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }
      db.courses.create({ ...full, teacherId: user?.id || 'u-admin', status: 'active' })
      toast.success('Curso creado', `"${data.name}" fue creado exitosamente.`)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nombre del curso"
            required
            error={errors.name?.message}
            placeholder="Ej: Administración de Bases de Datos"
            {...register('name')}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Aula o Sección"
            required
            error={errors.room?.message}
            placeholder="Ej: 5B, Aula 204, Laboratorio 1"
            {...register('room')}
          />
        </div>
      </div>

      {/* Apartado dedicado: Días de la semana y horas (Soporta múltiples turnos el mismo día) */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-4">
        <div>
          <label className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"></span>
            Horario de clases por día de la semana
          </label>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Especifica los días y las horas a las que asistes (ejemplo: Lunes a las 12:00 y luego a las 3:00 / 15:00).
          </p>
        </div>

        {/* Creador de turnos */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
              Día de la semana
            </label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="form-select text-xs w-full py-2"
            >
              {WEEK_DAYS.map((d) => (
                <option key={d.short} value={d.short}>
                  {d.full}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
              Hora de inicio
            </label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="form-input text-xs w-full py-2 px-2"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
              Hora de fin
            </label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="form-input text-xs w-full py-2 px-2"
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddScheduleBlock}
              className="w-full justify-center text-xs py-2"
            >
              + Agregar
            </Button>
          </div>
        </div>

        {/* Lista de horarios asignados */}
        {scheduleBlocks.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">
              Horarios programados para este curso:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scheduleBlocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] shadow-xs text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-[var(--color-primary)] px-2 py-0.5 rounded bg-[var(--color-primary-light)]">
                      {b.day}
                    </span>
                    <span className="font-medium text-[var(--color-foreground)]">
                      {b.startTime} - {b.endTime}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlock(b.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 rounded transition-colors"
                    title="Eliminar este horario"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-muted)]">
            Aún no has agregado horarios. Selecciona el día y las horas arriba y pulsa <strong>"+ Agregar"</strong>.
          </div>
        )}

        {/* Vista previa / Ajuste manual del resumen de horario */}
        <div className="pt-1">
          <Input
            label="Resumen consolidado del horario"
            value={customSchedule}
            onChange={(e) => {
              setCustomSchedule(e.target.value)
              setValue('schedule', e.target.value)
            }}
            placeholder="Ej: Lun 12:00-13:30, Lun 15:00-16:30, Mié 8:00-10:00"
            error={errors.schedule?.message}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {course ? 'Guardar cambios' : 'Crear curso'}
        </Button>
      </div>
    </form>
  )
}

export default function CoursesPage() {
  const courses = useCourses()
  const [modalOpen, setModalOpen] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)

  const handleDelete = () => {
    if (!deleteTarget) return
    db.courses.delete(deleteTarget.id)
    toast.success('Curso eliminado')
    setDeleteTarget(null)
  }

  return (
    <>
      <PageHeader
        title="Mis cursos"
        subtitle={`${courses.length} cursos registrados`}
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => { setEditCourse(undefined); setModalOpen(true) }}>
            Nuevo curso
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} />}
          title="No tienes cursos aún"
          description="Crea tu primer curso para comenzar a gestionar estudiantes y asistencia."
          action={<Button leftIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Crear curso</Button>}
        />
      ) : (
        <div className="courses-grid">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onEdit={(course) => { setEditCourse(course); setModalOpen(true) }}
              onDelete={(course) => setDeleteTarget(course)}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCourse ? 'Editar curso' : 'Nuevo curso'}
        maxWidth="lg"
      >
        <CourseForm
          course={editCourse}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar curso"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        danger
      />
    </>
  )
}
