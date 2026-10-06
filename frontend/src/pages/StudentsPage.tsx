import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, UserCheck, Star, FileSpreadsheet, FileText, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  Button, Input, Select, Badge, Avatar, Modal, ConfirmDialog,
  EmptyState, PageHeader, SearchInput, AttendanceStatusBadge, Card, LoadingState
} from '@/components/ui'
import { db, getAllStudents, useCourses } from '@/lib/mockData'
import { exportStudentsToExcel, exportStudentsToWord } from '@/lib/exportUtils'
import { toast } from '@/store'
import {
  cn, getInitials, getFullName, formatDate, studentStatusLabels,
  getGradeColor, getAttendanceRateColor
} from '@/lib/utils'
import type { Student, StudentWithStats, CreateStudentForm, StudentStatus, Course } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  studentId: z.string().min(1, 'Número requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  courseId: z.string().min(1, 'Selecciona un curso'),
})

type StudentFormData = CreateStudentForm & { courseId: string }

function StudentForm({ onClose, courses, courseId }: { onClose: () => void; courses: Course[]; courseId?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentFormData>({
    resolver: zodResolver(schema),
    defaultValues: { courseId: courseId ?? (courses[0]?.id || '') },
  })

  const onSubmit = (data: StudentFormData) => {
    db.students.create(data.courseId, {
      firstName: data.firstName,
      lastName: data.lastName,
      studentId: data.studentId,
      email: data.email,
      phone: '',
      status: 'active',
    })
    toast.success('Estudiante agregado', `${data.firstName} ${data.lastName} fue guardado permanentemente.`)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" required error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Apellido" required error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Número del estudiante" required error={errors.studentId?.message} placeholder="Ej: 1" {...register('studentId')} />
        <Select
          label="Curso"
          required
          error={errors.courseId?.message}
          options={courses.map((c) => ({ value: c.id, label: `${c.name} – ${c.group}` }))}
          placeholder="Seleccionar curso"
          {...register('courseId')}
        />
        <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>Agregar estudiante</Button>
      </div>
    </form>
  )
}

function BulkImportModal({
  open,
  onClose,
  courses,
  onImportComplete
}: {
  open: boolean
  onClose: () => void
  courses: Course[]
  onImportComplete: () => void
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '')
  const [rawText, setRawText] = useState('')

  const parsedStudents = useMemo(() => {
    if (!rawText.trim()) return []
    const headerRe = /^(n[uú]mero|no\.?|#|nombre|apellido|estudiante|matr[ií]cula)/i
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
      .filter((l, i) => !(i === 0 && headerRe.test(l) && /(nombre|apellido|estudiante)/i.test(l)))
    const course = courses.find(c => c.id === selectedCourseId)
    const code = course?.code ? course.code.replace(/[^A-Za-z0-9]/g, '') : 'EST'

    return lines.map((line, idx) => {
      // Check tab separation (copied from Excel)
      let parts: string[] = []
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim())
      } else if (line.includes(',')) {
        parts = line.split(',').map(p => p.trim())
      } else if (line.includes(';')) {
        parts = line.split(';').map(p => p.trim())
      }

      let firstName = ''
      let lastName = ''
      let studentId = ''
      let email = ''

      if (parts.length >= 3) {
        // e.g. Matricula, Nombre, Apellido OR Nombre, Apellido, Email
        if (/\d/.test(parts[0]) && !parts[0].includes(' ')) {
          studentId = parts[0]
          firstName = parts[1] || ''
          lastName = parts.slice(2).join(' ') || ''
        } else {
          firstName = parts[0]
          lastName = parts[1]
          if (parts[2].includes('@')) {
            email = parts[2]
            studentId = `2026-${code}-${String(idx + 1).padStart(3, '0')}`
          } else {
            studentId = parts[2]
          }
        }
      } else if (parts.length === 2 && /^\d+$/.test(parts[0])) {
        // Número → Nombre completo
        studentId = parts[0]
        const words = parts[1].split(/\s+/).filter(Boolean)
        const mid = Math.ceil(words.length / 2)
        firstName = words.length > 1 ? words.slice(0, mid).join(' ') : (words[0] || 'Estudiante')
        lastName = words.length > 1 ? words.slice(mid).join(' ') : 'General'
      } else if (parts.length === 2) {
        firstName = parts[0]
        lastName = parts[1]
        studentId = `2026-${code}-${String(idx + 1).padStart(3, '0')}`
      } else {
        // Plain single line text: "Carlos Manuel Perez Gonzalez"
        const words = line.split(/\s+/).filter(Boolean)
        if (words.length <= 1) {
          firstName = words[0] || 'Estudiante'
          lastName = 'General'
        } else if (words.length === 2) {
          firstName = words[0]
          lastName = words[1]
        } else {
          const mid = Math.ceil(words.length / 2)
          firstName = words.slice(0, mid).join(' ')
          lastName = words.slice(mid).join(' ')
        }
        studentId = `2026-${code}-${String(idx + 1).padStart(3, '0')}`
      }

      return {
        firstName,
        lastName,
        studentId: studentId || `2026-${code}-${String(idx + 1).padStart(3, '0')}`,
        email: email || `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@estudiante.edu`,
        status: 'active' as StudentStatus,
      }
    })
  }, [rawText, selectedCourseId, courses])

  const [fileLoading, setFileLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileLoading(true)
    try {
      const name = file.name.toLowerCase()
      const buf = await file.arrayBuffer()
      let text = ''
      if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
        const wb = XLSX.read(buf, { type: 'array' })
        text = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { FS: '\t', blankrows: false })
      } else if (name.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const res = await mammoth.extractRawText({ arrayBuffer: buf })
        text = res.value.replace(/\n{2,}/g, '\n')
      } else {
        toast.error('Formato no soportado', 'Sube un archivo .xlsx, .xls, .csv o .docx')
        return
      }
      if (!text.trim()) {
        toast.error('Archivo vacío', 'No se encontraron datos en el documento.')
        return
      }
      setRawText(text)
      toast.success('Documento cargado', 'Revisa la vista previa y pulsa Importar.')
    } catch {
      toast.error('Error al leer el archivo', 'Verifica que el documento no esté dañado.')
    } finally {
      setFileLoading(false)
    }
  }

  const handleImport = () => {
    if (!selectedCourseId) {
      toast.error('Selecciona un curso', 'Debes escoger el curso al que asignar los estudiantes.')
      return
    }
    if (parsedStudents.length === 0) {
      toast.error('Sin datos', 'Pega al menos un nombre de estudiante en el cuadro de texto.')
      return
    }

    db.students.batchCreate(selectedCourseId, parsedStudents)
    const targetCourse = courses.find(c => c.id === selectedCourseId)
    toast.success(
      '¡Carga masiva completada!',
      `Se registraron y guardaron ${parsedStudents.length} estudiantes permanentemente en "${targetCourse?.name}".`
    )
    setRawText('')
    onClose()
    onImportComplete()
  }

  return (
    <Modal open={open} onClose={onClose} title="Carga Masiva de Estudiantes (50+ Alumnos)" maxWidth="lg">
      <div className="space-y-4">
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm space-y-1">
          <p className="font-semibold text-blue-400 flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Importador Rápido de Listas de Clase
          </p>
          <p className="text-[var(--color-muted)] text-xs">
            Sube un documento <strong>Excel (.xlsx) o Word (.docx)</strong>, o pega las columnas aquí.
            Formato: <strong>Número, Nombre, Apellido</strong> (o una lista de nombres, uno por línea).
          </p>
          <label className="btn btn-secondary btn-sm inline-flex cursor-pointer mt-1">
            <FileSpreadsheet size={14} /> {fileLoading ? 'Leyendo...' : 'Subir Excel / Word'}
            <input type="file" accept=".xlsx,.xls,.csv,.docx" className="hidden" onChange={handleFile} />
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">
            Curso de Destino
          </label>
          <select
            className="form-select w-full"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} – {c.group} ({c.studentCount} alumnos actuales)
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Lista de Estudiantes (Pega aquí hasta 50 o más)
            </label>
            {parsedStudents.length > 0 && (
              <span className="badge badge-success text-xs font-medium">
                ✓ {parsedStudents.length} alumnos listos
              </span>
            )}
          </div>
          <textarea
            className="form-input w-full font-mono text-xs leading-relaxed"
            rows={8}
            placeholder={`Ejemplo simple (1 por línea):
Juan Carlos Pérez
María Sofía Rodríguez
Pedro José González
Carlos Alberto Ramírez
... o pega directamente desde Excel`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        {/* Live Preview snippet */}
        {parsedStudents.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
            <div className="px-3 py-2 bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-muted)] flex items-center justify-between">
              <span>Vista previa de detección (primeros {Math.min(parsedStudents.length, 3)} de {parsedStudents.length}):</span>
              <span className="text-emerald-500 font-medium">Persistencia activa en base de datos</span>
            </div>
            <div className="divide-y divide-[var(--color-border)] max-h-32 overflow-y-auto">
              {parsedStudents.slice(0, 3).map((st, i) => (
                <div key={i} className="px-3 py-1.5 text-xs flex items-center justify-between">
                  <span className="font-medium text-[var(--color-text)]">
                    {st.firstName} {st.lastName}
                  </span>
                  <span className="font-mono text-[var(--color-muted)] text-[11px]">
                    {st.studentId}
                  </span>
                </div>
              ))}
              {parsedStudents.length > 3 && (
                <div className="px-3 py-1 text-[11px] text-[var(--color-muted)] italic text-center">
                  + {parsedStudents.length - 3} estudiantes más...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            leftIcon={<Users size={16} />}
            disabled={parsedStudents.length === 0}
            onClick={handleImport}
          >
            Importar {parsedStudents.length > 0 ? `${parsedStudents.length} Alumnos` : 'Estudiantes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function StudentRow({
  student,
  selected,
  onToggleSelect,
  onDelete,
}: {
  student: StudentWithStats
  selected: boolean
  onToggleSelect: () => void
  onDelete: (s: StudentWithStats) => void
}) {
  const statusColor: Record<StudentStatus, 'success' | 'neutral' | 'danger'> = {
    active: 'success', inactive: 'neutral', withdrawn: 'danger',
  }

  return (
    <tr className={cn(selected && 'bg-blue-50/50 dark:bg-blue-950/20')}>
      <td className="w-10 px-3 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] cursor-pointer accent-[var(--color-primary)]"
          aria-label={`Seleccionar ${getFullName(student.firstName, student.lastName)}`}
        />
      </td>
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
          <button className="btn btn-ghost btn-icon p-1 text-red-500 hover:text-red-400" title="Eliminar" onClick={() => onDelete(student)}>
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function StudentsPage() {
  const courses = useCourses()
  const [allStudents, setAllStudents] = useState<StudentWithStats[]>(getAllStudents)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StudentWithStats | null>(null)

  // Selección múltiple
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const name = getFullName(s.firstName, s.lastName).toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase())
      const matchCourse = !filterCourse || s.courseId === filterCourse
      const matchStatus = !filterStatus || s.status === filterStatus
      return matchSearch && matchCourse && matchStatus
    })
  }, [allStudents, search, filterCourse, filterStatus])

  const refresh = () => {
    setAllStudents(getAllStudents())
  }

  // Comprobar estado de selección respecto a los filtrados visibles
  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((s) => selectedKeys.has(`${s.courseId}:${s.id}`))
  const someVisibleSelected =
    filtered.some((s) => selectedKeys.has(`${s.courseId}:${s.id}`))

  const toggleSelect = (s: StudentWithStats) => {
    const key = `${s.courseId}:${s.id}`
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev)
        filtered.forEach((s) => next.delete(`${s.courseId}:${s.id}`))
        return next
      })
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev)
        filtered.forEach((s) => next.add(`${s.courseId}:${s.id}`))
        return next
      })
    }
  }

  const clearSelection = () => {
    setSelectedKeys(new Set())
  }

  const handleDelete = () => {
    if (!deleteTarget?.courseId) return
    db.students.delete(deleteTarget.courseId, deleteTarget.id)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      next.delete(`${deleteTarget.courseId}:${deleteTarget.id}`)
      return next
    })
    toast.success('Estudiante eliminado', `El estudiante ha sido removido del sistema.`)
    setDeleteTarget(null)
    refresh()
  }

  const handleBulkDelete = () => {
    const count = selectedKeys.size
    if (count === 0) return

    for (const key of selectedKeys) {
      const [cId, sId] = key.split(':')
      if (cId && sId) {
        db.students.delete(cId, sId)
      }
    }

    setSelectedKeys(new Set())
    setBulkDeleteModalOpen(false)
    refresh()
    toast.success(
      'Estudiantes eliminados',
      `Se eliminaron ${count} estudiantes correctamente del sistema.`
    )
  }

  const handleExportExcel = () => {
    // Si hay seleccionados, exporta los seleccionados; si no, exporta los filtrados
    const toExport = selectedKeys.size > 0
      ? filtered.filter((s) => selectedKeys.has(`${s.courseId}:${s.id}`))
      : filtered
    const selectedCourseObj = courses.find((c) => c.id === filterCourse)
    const title = selectedCourseObj ? selectedCourseObj.name : 'Lista de Estudiantes'
    exportStudentsToExcel(toExport, title)
    toast.success('Excel exportado', `Se descargó la lista de ${toExport.length} estudiantes en Excel.`)
  }

  const handleExportWord = () => {
    const toExport = selectedKeys.size > 0
      ? filtered.filter((s) => selectedKeys.has(`${s.courseId}:${s.id}`))
      : filtered
    const selectedCourseObj = courses.find((c) => c.id === filterCourse)
    const title = selectedCourseObj ? selectedCourseObj.name : 'Lista de Estudiantes'
    exportStudentsToWord(toExport, title)
    toast.success('Word exportado', `Se descargó el documento de ${toExport.length} estudiantes en Word.`)
  }

  return (
    <>
      <PageHeader
        title="Estudiantes"
        subtitle={`${filtered.length} de ${allStudents.length} estudiantes registrados y respaldados`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<FileSpreadsheet size={16} />}
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              title={selectedKeys.size > 0 ? `Exportar ${selectedKeys.size} seleccionados a Excel` : 'Exportar a Excel (.xlsx)'}
            >
              Exportar Excel {selectedKeys.size > 0 && `(${selectedKeys.size})`}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<FileText size={16} />}
              onClick={handleExportWord}
              disabled={filtered.length === 0}
              title={selectedKeys.size > 0 ? `Exportar ${selectedKeys.size} seleccionados a Word` : 'Exportar a Word (.doc)'}
            >
              Exportar Word {selectedKeys.size > 0 && `(${selectedKeys.size})`}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<FileSpreadsheet size={16} />}
              onClick={() => setBulkModalOpen(true)}
            >
              Carga Masiva
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Nuevo estudiante
            </Button>
          </div>
        }
      />

      {/* Barra de Acciones por Lote (Aparece cuando hay estudiantes seleccionados) */}
      {selectedKeys.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 mb-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-xs">
              {selectedKeys.size} {selectedKeys.size === 1 ? 'estudiante seleccionado' : 'estudiantes seleccionados'}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              de {filtered.length} visibles
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={clearSelection}
              className="btn btn-ghost btn-sm text-xs"
            >
              Deseleccionar todos
            </button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={15} />}
              onClick={() => setBulkDeleteModalOpen(true)}
            >
              Eliminar seleccionados ({selectedKeys.size})
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o número..."
          className="flex-1 min-w-[200px]"
        />
        <select
          className="form-select text-sm w-auto"
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
                <th className="w-10 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected
                    }}
                    onChange={toggleSelectAllVisible}
                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] cursor-pointer accent-[var(--color-primary)]"
                    aria-label="Seleccionar todos los estudiantes visibles"
                    title={allVisibleSelected ? 'Deseleccionar todos' : 'Seleccionar todos los visibles'}
                  />
                </th>
                <th>Estudiante</th>
                <th className="hidden md:table-cell">Curso</th>
                <th className="hidden lg:table-cell">Asistencia</th>
                <th className="hidden lg:table-cell">Promedio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isSelected = selectedKeys.has(`${s.courseId}:${s.id}`)
                return (
                  <StudentRow
                    key={`${s.id}-${s.courseId}`}
                    student={s}
                    selected={isSelected}
                    onToggleSelect={() => toggleSelect(s)}
                    onDelete={setDeleteTarget}
                  />
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<UserCheck size={36} />}
              title="No se encontraron estudiantes"
              description={search ? `Sin resultados para "${search}"` : 'Agrega tu primer estudiante o usa la carga masiva.'}
              action={
                !search ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => setBulkModalOpen(true)}>
                      Carga Masiva
                    </Button>
                    <Button leftIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
                      Agregar estudiante
                    </Button>
                  </div>
                ) : undefined
              }
            />
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); refresh() }} title="Nuevo estudiante" maxWidth="lg">
        <StudentForm onClose={() => { setModalOpen(false); refresh() }} courses={courses} />
      </Modal>

      <BulkImportModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        courses={courses}
        onImportComplete={refresh}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar estudiante"
        message={`¿Eliminar a ${deleteTarget ? getFullName(deleteTarget.firstName, deleteTarget.lastName) : ''}? Esta acción es permanente.`}
        confirmLabel="Sí, eliminar"
        danger
      />

      <ConfirmDialog
        open={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar estudiantes seleccionados"
        message={`¿Estás seguro de que deseas eliminar permanentemente a los ${selectedKeys.size} estudiantes seleccionados? Esta acción no se puede deshacer.`}
        confirmLabel={`Sí, eliminar ${selectedKeys.size} estudiantes`}
        danger
      />
    </>
  )
}
