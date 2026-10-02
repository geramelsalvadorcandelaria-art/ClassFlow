import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, UserCheck, Star } from 'lucide-react'
import {
  Button, Input, Select, Badge, Avatar, Modal, ConfirmDialog,
  EmptyState, PageHeader, SearchInput, AttendanceStatusBadge, Card, LoadingState
} from '@/components/ui'
import { db, getAllStudents, MOCK_COURSES } from '@/lib/mockData'
import { toast } from '@/store'
import {
  cn, getInitials, getFullName, formatDate, studentStatusLabels,
  getGradeColor, getAttendanceRateColor
} from '@/lib/utils'
import type { Student, StudentWithStats, CreateStudentForm, StudentStatus } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  studentId: z.string().min(2, 'Matrícula requerida'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  courseId: z.string().min(1, 'Selecciona un curso'),
})

type StudentFormData = CreateStudentForm & { courseId: string }

function StudentForm({ onClose, courseId }: { onClose: () => void; courseId?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentFormData>({
    resolver: zodResolver(schema),
    defaultValues: { courseId: courseId ?? '' },
  })

  const onSubmit = (data: StudentFormData) => {
    db.students.create(data.courseId, {
      firstName: data.firstName,
      lastName: data.lastName,
      studentId: data.studentId,
      email: data.email,
      phone: data.phone,
      status: 'active',
    })
    toast.success('Estudiante agregado', `${data.firstName} ${data.lastName} fue registrado.`)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" required error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Apellido" required error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Matrícula" required error={errors.studentId?.message} placeholder="2026-XXX-001" {...register('studentId')} />
        <Select
          label="Curso"
          required
          error={errors.courseId?.message}
          options={MOCK_COURSES.map((c) => ({ value: c.id, label: `${c.name} – ${c.group}` }))}
          placeholder="Seleccionar curso"
          {...register('courseId')}
        />
        <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Teléfono" type="tel" {...register('phone')} />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>Agregar estudiante</Button>
      </div>
    </form>
  )
}

function StudentRow({ student, onDelete }: { student: StudentWithStats; onDelete: (s: StudentWithStats) => void }) {
  const statusColor: Record<StudentStatus, 'success' | 'neutral' | 'danger'> = {
    active: 'success', inactive: 'neutral', withdrawn: 'danger',
  }

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <Avatar initials={getInitials(student.firstName, student.lastName)} size="sm" />
          <div>
            <p className="font-medium text-sm">{getFullName(student.firstName, student.lastName)}</p>
            <p className="text-xs text-[var(--color-muted)]">{student.studentId}</p>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div>
          <p className="text-sm font-medium">{student.courseName}</p>
          <p className="text-xs text-[var(--color-muted)]">{student.group}</p>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <span className={cn('text-sm font-semibold tabular-nums', getAttendanceRateColor(student.attendanceRate))}>
          {student.attendanceRate}%
        </span>
      </td>
      <td className="hidden lg:table-cell">
        <span className={cn('text-sm font-semibold tabular-nums', getGradeColor(student.averageGrade))}>
          {student.averageGrade > 0 ? `${student.averageGrade.toFixed(1)}` : '—'}
        </span>
      </td>
      <td>
        <Badge variant={statusColor[student.status]}>{studentStatusLabels[student.status]}</Badge>
      </td>
      <td>
        <div className="flex items-center gap-1">
          <Link to={`/students/${student.id}?course=${student.courseId}`} className="btn btn-ghost btn-icon p-1" title="Ver perfil">
            <Eye size={15} />
          </Link>
          <button className="btn btn-ghost btn-icon p-1 text-red-500" title="Eliminar" onClick={() => onDelete(student)}>
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function StudentsPage() {
  const [allStudents, setAllStudents] = useState<StudentWithStats[]>(getAllStudents)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StudentWithStats | null>(null)

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const name = getFullName(s.firstName, s.lastName).toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase())
      const matchCourse = !filterCourse || s.courseId === filterCourse
      const matchStatus = !filterStatus || s.status === filterStatus
      return matchSearch && matchCourse && matchStatus
    })
  }, [allStudents, search, filterCourse, filterStatus])

  const refresh = () => setAllStudents(getAllStudents())

  const handleDelete = () => {
    if (!deleteTarget?.courseId) return
    db.students.delete(deleteTarget.courseId, deleteTarget.id)
    toast.success('Estudiante eliminado')
    setDeleteTarget(null)
    refresh()
  }

  return (
    <>
      <PageHeader
        title="Estudiantes"
        subtitle={`${filtered.length} de ${allStudents.length} estudiantes`}
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            Nuevo estudiante
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o matrícula..."
          className="flex-1 min-w-[200px]"
        />
        <select
          className="form-select text-sm w-auto"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          aria-label="Filtrar por curso"
        >
          <option value="">Todos los cursos</option>
          {MOCK_COURSES.map((c) => <option key={c.id} value={c.id}>{c.name} – {c.group}</option>)}
        </select>
        <select
          className="form-select text-sm w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="withdrawn">Retirado</option>
        </select>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th className="hidden md:table-cell">Curso</th>
                <th className="hidden lg:table-cell">Asistencia</th>
                <th className="hidden lg:table-cell">Promedio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <StudentRow key={`${s.id}-${s.courseId}`} student={s} onDelete={setDeleteTarget} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<UserCheck size={36} />}
              title="No se encontraron estudiantes"
              description={search ? `Sin resultados para "${search}"` : 'Agrega tu primer estudiante.'}
              action={!search ? <Button leftIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Agregar estudiante</Button> : undefined}
            />
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); refresh() }} title="Nuevo estudiante" maxWidth="lg">
        <StudentForm onClose={() => { setModalOpen(false); refresh() }} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar estudiante"
        message={`¿Eliminar a ${deleteTarget ? getFullName(deleteTarget.firstName, deleteTarget.lastName) : ''}? Esta acción es permanente.`}
        confirmLabel="Sí, eliminar"
        danger
      />
    </>
  )
}
