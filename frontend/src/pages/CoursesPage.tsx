import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Users, Star, ClipboardCheck, MoreVertical, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { Card, Button, Badge, Modal, Input, Select, Textarea, ProgressBar, EmptyState, PageHeader, ConfirmDialog } from '@/components/ui'
import { db } from '@/lib/mockData'
import { useAppStore } from '@/store'
import { toast } from '@/store'
import { cn, courseStatusLabels, formatDate } from '@/lib/utils'
import type { Course, CreateCourseForm, CourseStatus } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  code: z.string().min(2, 'Código requerido'),
  description: z.string().optional(),
  group: z.string().min(1, 'Grupo requerido'),
  room: z.string().min(1, 'Aula requerida'),
  schedule: z.string().min(2, 'Horario requerido'),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().min(1, 'Fecha de fin requerida'),
})

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
            <p className="text-xs text-[var(--color-muted)]">{course.code} · Grupo {course.group}</p>
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
      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)]">
        <div>📍 Aula {course.room}</div>
        <div>🕐 {course.schedule}</div>
        <div>📅 {formatDate(course.startDate)}</div>
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

function CourseForm({ course, onClose }: { course?: Course; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateCourseForm>({
    resolver: zodResolver(schema),
    defaultValues: course ? {
      name: course.name, code: course.code, description: course.description ?? '',
      group: course.group, room: course.room, schedule: course.schedule,
      startDate: course.startDate, endDate: course.endDate,
    } : {},
  })

  const onSubmit = (data: CreateCourseForm) => {
    if (course) {
      db.courses.update(course.id, data)
      toast.success('Curso actualizado', `"${data.name}" fue actualizado correctamente.`)
    } else {
      db.courses.create({ ...data, teacherId: 'u1', status: 'active' })
      toast.success('Curso creado', `"${data.name}" fue creado exitosamente.`)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Nombre del curso" required error={errors.name?.message} {...register('name')} />
        </div>
        <Input label="Código" required error={errors.code?.message} {...register('code')} />
        <Input label="Grupo" required error={errors.group?.message} placeholder="Ej: A-01" {...register('group')} />
        <Input label="Aula" required error={errors.room?.message} placeholder="Ej: 204" {...register('room')} />
        <Input label="Horario" required error={errors.schedule?.message} placeholder="Ej: Lun/Mié 8:00-9:30" {...register('schedule')} />
        <Input label="Fecha de inicio" type="date" required error={errors.startDate?.message} {...register('startDate')} />
        <Input label="Fecha de fin" type="date" required error={errors.endDate?.message} {...register('endDate')} />
        <div className="col-span-2">
          <Textarea label="Descripción" {...register('description')} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{course ? 'Guardar cambios' : 'Crear curso'}</Button>
      </div>
    </form>
  )
}

export default function CoursesPage() {
  const [courses, setCourses] = useState(db.courses.list())
  const [modalOpen, setModalOpen] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)

  const refresh = () => setCourses([...db.courses.list()])

  const handleDelete = () => {
    if (!deleteTarget) return
    db.courses.delete(deleteTarget.id)
    toast.success('Curso eliminado')
    setDeleteTarget(null)
    refresh()
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
        onClose={() => { setModalOpen(false); refresh() }}
        title={editCourse ? 'Editar curso' : 'Nuevo curso'}
        maxWidth="lg"
      >
        <CourseForm
          course={editCourse}
          onClose={() => { setModalOpen(false); refresh() }}
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
