import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, Clock, XCircle, AlertCircle, Save, Users, ChevronLeft,
  ChevronRight, FileSpreadsheet, FileText, Calendar, History, Trash2,
  Eye, ClipboardCheck, ArrowRight, Search, BarChart3, RotateCcw
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button, Select, Card, Badge, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui'
import { db, useCourses } from '@/lib/mockData'
import { exportAttendanceToExcel, exportAttendanceToWord } from '@/lib/exportUtils'
import { useAppStore } from '@/store'
import { toast } from '@/store'
import {
  cn, getInitials, getFullName, todayISO, addDaysISO,
  weekdayOfISO, parseScheduleDays, getAttendanceRateColor
} from '@/lib/utils'
import type { AttendanceStatus, AttendanceRecord, Student } from '@/types'

type AttendanceTab = 'daily' | 'history' | 'summary'

const STATUS_CYCLE: AttendanceStatus[] = ['present', 'late', 'absent', 'justified']

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; btnClass: string }> = {
  present: { label: 'Presente', icon: <CheckCircle size={16} />, btnClass: 'attendance-btn present' },
  late: { label: 'Tardanza', icon: <Clock size={16} />, btnClass: 'attendance-btn late' },
  absent: { label: 'Ausente', icon: <XCircle size={16} />, btnClass: 'attendance-btn absent' },
  justified: { label: 'Justificado', icon: <AlertCircle size={16} />, btnClass: 'attendance-btn justified' },
}

function AttendanceButton({ status, active, onClick }: { status: AttendanceStatus; active: boolean; onClick: () => void }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <button className={cn(cfg.btnClass, active && 'active')} onClick={onClick} aria-pressed={active} aria-label={cfg.label}>
      {cfg.icon}
      <span className="hidden sm:inline">{cfg.label}</span>
    </button>
  )
}

function StudentAttendanceRow({
  student,
  status,
  onStatusChange,
}: {
  student: Student
  status: AttendanceStatus
  onStatusChange: (id: string, status: AttendanceStatus) => void
}) {
  const cfg = STATUS_CONFIG[status]

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-all border-2',
      status === 'present' && 'border-green-200 bg-green-50/50',
      status === 'late' && 'border-yellow-200 bg-yellow-50/50',
      status === 'absent' && 'border-red-200 bg-red-50/50',
      status === 'justified' && 'border-blue-200 bg-blue-50/50',
    )}>
      <div className="avatar avatar-md flex-shrink-0" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 13 }}>
        {getInitials(student.firstName, student.lastName)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{getFullName(student.firstName, student.lastName)}</p>
        <p className="text-xs text-[var(--color-muted)]">Número: {student.studentId}</p>
      </div>

      <span className={cn('badge sm:hidden', 
        status === 'present' && 'badge-success',
        status === 'late' && 'badge-warning',
        status === 'absent' && 'badge-danger',
        status === 'justified' && 'badge-info',
      )}>
        {cfg.icon}
      </span>

      <div className="flex gap-1.5 flex-shrink-0">
        {STATUS_CYCLE.map((s) => (
          <AttendanceButton key={s} status={s} active={status === s} onClick={() => onStatusChange(student.id, s)} />
        ))}
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const { selectedCourseId, setSelectedCourse } = useAppStore()
  const courses = useCourses()
  const [courseId, setCourseId] = useState(
    courses.find((c) => c.id === selectedCourseId)?.id ?? courses[0]?.id ?? ''
  )
  const [activeTab, setActiveTab] = useState<AttendanceTab>('daily')
  const [date, setDate] = useState(todayISO())
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filtro y modal de eliminación en historial
  const [historySearch, setHistorySearch] = useState('')
  const [deleteDateTarget, setDeleteDateTarget] = useState<string | null>(null)

  // Sincronizar automáticamente cuando cambie la lista de cursos o el curso seleccionado
  useEffect(() => {
    if (selectedCourseId && courses.some((c) => c.id === selectedCourseId)) {
      setCourseId(selectedCourseId)
    } else if (courses.length > 0 && !courses.some((c) => c.id === courseId)) {
      setCourseId(courses[0].id)
    }
  }, [selectedCourseId, courses, courseId])

  const course = courses.find((c) => c.id === courseId)
  const classDays = parseScheduleDays(course?.schedule ?? '')
  const isClassDay = classDays.length === 0 || classDays.includes(weekdayOfISO(date))
  const isToday = date === todayISO()
  const weekdayLabel = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const stepDay = (dir: 1 | -1) => {
    let next = addDaysISO(date, dir)
    if (classDays.length > 0) {
      for (let i = 0; i < 7 && !classDays.includes(weekdayOfISO(next)); i++) {
        next = addDaysISO(next, dir)
      }
    }
    setDate(next)
  }

  const students = useMemo(() => {
    return db.students.list(courseId).filter((s) => s.status === 'active')
  }, [courseId, refreshKey])

  // Cargar asistencia de la fecha activa
  useEffect(() => {
    const existing = db.attendance.listByDate(courseId, date)
    const map: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { map[s.id] = 'present' })
    existing.forEach((a) => { map[a.studentId] = a.status })
    setStatusMap(map)
    setSaved(existing.length > 0)
  }, [courseId, date, students.length, refreshKey])

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }))
    setSaved(false)
  }

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { map[s.id] = status })
    setStatusMap(map)
    setSaved(false)
  }

  const saveAttendance = () => {
    setSaving(true)
    const records: AttendanceRecord[] = students.map((s) => ({
      id: `att-${s.id}-${date}`,
      studentId: s.id,
      courseId,
      date,
      status: statusMap[s.id] ?? 'present',
    }))
    setTimeout(() => {
      db.attendance.save(courseId, records)
      setSaving(false)
      setSaved(true)
      setRefreshKey((k) => k + 1)
      toast.success('✓ Asistencia guardada en el historial', `${course?.name} – ${date}`)
    }, 400)
  }

  const counts = students.reduce((acc, s) => {
    const st = statusMap[s.id] ?? 'present'
    acc[st] = (acc[st] ?? 0) + 1
    return acc
  }, {} as Record<AttendanceStatus, number>)

  const prevDay = () => stepDay(-1)
  const nextDay = () => stepDay(1)

  // ─── Historial de Fechas Guardadas ────────────────────────────
  const historyList = useMemo(() => {
    const allRecords = db.attendance.list(courseId)
    const dateMap: Record<string, AttendanceRecord[]> = {}

    allRecords.forEach((r) => {
      if (!dateMap[r.date]) dateMap[r.date] = []
      dateMap[r.date].push(r)
    })

    return Object.entries(dateMap)
      .map(([d, recs]) => {
        const present = recs.filter((r) => r.status === 'present').length
        const late = recs.filter((r) => r.status === 'late').length
        const absent = recs.filter((r) => r.status === 'absent').length
        const justified = recs.filter((r) => r.status === 'justified').length
        const total = recs.length
        const rate = total > 0 ? Math.round(((present + late * 0.8) / total) * 100) : 0
        const dateObj = new Date(d + 'T00:00:00')
        const formatted = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : d
        return {
          date: d,
          dateFormatted: formatted,
          records: recs,
          present, late, absent, justified, total, rate,
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [courseId, refreshKey])

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return historyList
    const q = historySearch.toLowerCase().trim()
    return historyList.filter((h) => h.date.includes(q) || h.dateFormatted.toLowerCase().includes(q))
  }, [historyList, historySearch])

  // ─── Resumen acumulado por alumno ─────────────────────────────
  const studentSummaries = useMemo(() => {
    const allRecords = db.attendance.list(courseId)
    const totalSessions = new Set(allRecords.map((r) => r.date)).size

    return students.map((s) => {
      const sRecords = allRecords.filter((r) => r.studentId === s.id)
      const present = sRecords.filter((r) => r.status === 'present').length
      const late = sRecords.filter((r) => r.status === 'late').length
      const absent = sRecords.filter((r) => r.status === 'absent').length
      const justified = sRecords.filter((r) => r.status === 'justified').length
      const totalTaken = sRecords.length
      const rate = totalTaken > 0 ? Math.round(((present + late * 0.8) / totalTaken) * 100) : 100
      return {
        student: s,
        present, late, absent, justified, totalTaken, totalSessions, rate,
      }
    })
  }, [courseId, students, refreshKey])

  // Eliminar fecha del historial
  const confirmDeleteDate = () => {
    if (!deleteDateTarget) return
    db.attendance.deleteByDate(courseId, deleteDateTarget)
    setDeleteDateTarget(null)
    setRefreshKey((k) => k + 1)
    toast.success('Registro eliminado', `Se eliminó el registro de asistencia del ${deleteDateTarget}`)
  }

  // Exportar día específico
  const handleExportSingleDay = (targetDate: string, recs?: AttendanceRecord[]) => {
    if (!course) return
    const recordsToExport = (recs ?? students.map((s) => ({
      id: `att-${s.id}-${targetDate}`,
      studentId: s.id,
      courseId,
      date: targetDate,
      status: statusMap[s.id] ?? 'present',
    }))).map((r) => {
      const studentObj = students.find((s) => s.id === r.studentId)
      return {
        studentId: studentObj?.studentId ?? r.studentId,
        name: studentObj ? getFullName(studentObj.firstName, studentObj.lastName) : 'Estudiante',
        status: STATUS_CONFIG[r.status].label,
      }
    })

    exportAttendanceToExcel({
      courseName: course.name,
      date: targetDate,
      records: recordsToExport,
    })
    toast.success('Excel descargado', `Registro de asistencia del ${targetDate}`)
  }

  const handleExportSingleDayWord = (targetDate: string, recs?: AttendanceRecord[]) => {
    if (!course) return
    const recordsToExport = (recs ?? students.map((s) => ({
      id: `att-${s.id}-${targetDate}`,
      studentId: s.id,
      courseId,
      date: targetDate,
      status: statusMap[s.id] ?? 'present',
    }))).map((r) => {
      const studentObj = students.find((s) => s.id === r.studentId)
      return {
        studentId: studentObj?.studentId ?? r.studentId,
        name: studentObj ? getFullName(studentObj.firstName, studentObj.lastName) : 'Estudiante',
        status: STATUS_CONFIG[r.status].label,
      }
    })

    exportAttendanceToWord({
      courseName: course.name,
      date: targetDate,
      records: recordsToExport,
    })
    toast.success('Word descargado', `Registro de asistencia del ${targetDate}`)
  }

  // Exportar todo el resumen acumulado a Excel
  const handleExportSummaryExcel = () => {
    if (!course || studentSummaries.length === 0) return
    const rows = studentSummaries.map((item) => ({
      'Número': item.student.studentId,
      'Apellidos': item.student.lastName,
      'Nombres': item.student.firstName,
      'Curso': course.name,
      'Clases Asistidas': item.present,
      'Tardanzas': item.late,
      'Ausencias': item.absent,
      'Justificados': item.justified,
      'Total Clases': item.totalSessions,
      'Asistencia Acumulada (%)': `${item.rate}%`,
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen Acumulado')
    XLSX.writeFile(wb, `Historial_Asistencia_${course.name.replace(/[^a-zA-Z0-9_\-]/g, '_')}.xlsx`)
    toast.success('Excel exportado', `Resumen acumulado de ${course.name} descargado con éxito.`)
  }

  return (
    <>
      <PageHeader
        title="Control y Registro de Asistencia"
        subtitle={`${course?.name ?? 'Curso'} • Consulta el historial por fechas y pase de lista diario`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<FileSpreadsheet size={15} />}
              onClick={() => handleExportSingleDay(date)}
              disabled={students.length === 0}
              title="Descargar asistencia del día en Excel (.xlsx)"
            >
              Exportar Día (Excel)
            </Button>
            <Button
              variant="secondary"
              leftIcon={<FileText size={15} />}
              onClick={() => handleExportSingleDayWord(date)}
              disabled={students.length === 0}
              title="Descargar asistencia del día en Word (.doc)"
            >
              Exportar Día (Word)
            </Button>
          </div>
        }
      />

      {/* Pestañas Principales: Diario / Historial / Resumen */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] mb-5 pb-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer',
              activeTab === 'daily'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)]'
            )}
          >
            <ClipboardCheck size={16} />
            <span>Pase de Lista del Día</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer relative',
              activeTab === 'history'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)]'
            )}
          >
            <History size={16} />
            <span>Historial y Registro ({historyList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer',
              activeTab === 'summary'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)]'
            )}
          >
            <BarChart3 size={16} />
            <span>Resumen por Alumno</span>
          </button>
        </div>

        {/* Selector de curso persistente */}
        <div className="hidden md:block w-64">
          <Select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value)
              setSelectedCourse(e.target.value)
            }}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.name}${c.room ? ` (Aula ${c.room})` : ''}`,
            }))}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 1: PASE DE LISTA DEL DÍA
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <>
          {/* Controls */}
          <Card className="mb-5">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px] md:hidden">
                <Select
                  label="Curso"
                  value={courseId}
                  onChange={(e) => { setCourseId(e.target.value); setSelectedCourse(e.target.value) }}
                  options={courses.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.room ? ` (Aula ${c.room})` : ''}`,
                  }))}
                />
              </div>

              <div>
                <label className="form-label text-xs font-semibold">Fecha de pase de lista</label>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-icon" onClick={prevDay} aria-label="Día anterior" title="Día anterior">
                    <ChevronLeft size={16} />
                  </button>
                  <input
                    type="date"
                    className="form-input text-sm"
                    value={date}
                    onChange={(e) => e.target.value && setDate(e.target.value)}
                  />
                  <button className="btn btn-ghost btn-icon" onClick={nextDay} aria-label="Día siguiente" title="Día siguiente">
                    <ChevronRight size={16} />
                  </button>
                  {!isToday && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setDate(todayISO())}>
                      Ir a Hoy
                    </button>
                  )}
                </div>
              </div>

              {historyList.some((h) => h.date === date) && (
                <div className="ml-auto flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle size={14} />
                  <span>Esta fecha ya tiene registro guardado</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="capitalize font-semibold text-[var(--color-foreground)]">{weekdayLabel}</span>
              {isToday && <Badge variant="success">Hoy</Badge>}
              {course && !isClassDay && (
                <Badge variant="warning">Horario configurado: {course.schedule}</Badge>
              )}
              {course && isClassDay && classDays.length > 0 && (
                <Badge variant="info">Día de clase según horario ({course.schedule})</Badge>
              )}
            </div>
          </Card>

          {/* Summary bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="badge badge-success text-sm py-1.5 px-3">✓ Presentes: {counts.present ?? 0}</div>
            <div className="badge badge-warning text-sm py-1.5 px-3">⏰ Tardanza: {counts.late ?? 0}</div>
            <div className="badge badge-danger text-sm py-1.5 px-3">✗ Ausentes: {counts.absent ?? 0}</div>
            <div className="badge badge-info text-sm py-1.5 px-3">📋 Justificado: {counts.justified ?? 0}</div>
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-[var(--color-muted)] self-center font-medium">Marcar todos:</span>
            {STATUS_CYCLE.map((s) => (
              <button
                key={s}
                className={cn('attendance-btn', s)}
                onClick={() => markAll(s)}
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                {STATUS_CONFIG[s].icon}
                <span>{STATUS_CONFIG[s].label}</span>
              </button>
            ))}
          </div>

          {/* Student list */}
          {students.length === 0 ? (
            <EmptyState
              icon={<Users size={36} />}
              title="No hay estudiantes en este curso"
              description="Agrega estudiantes para tomar asistencia."
            />
          ) : (
            <div className="space-y-2 mb-20">
              {students.map((student) => (
                <StudentAttendanceRow
                  key={student.id}
                  student={student}
                  status={statusMap[student.id] ?? 'present'}
                  onStatusChange={setStatus}
                />
              ))}
            </div>
          )}

          {/* Sticky Save bar */}
          {students.length > 0 && (
            <div
              className="sticky bottom-16 lg:bottom-4 left-0 right-0 flex items-center justify-between gap-3 p-4 rounded-[var(--radius-xl)] shadow-xl border border-[var(--color-border)] z-20 backdrop-blur-md"
              style={{ background: 'var(--color-surface)' }}
            >
              <div>
                <p className="font-semibold text-sm">{course?.name}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  Fecha: {date} · {students.length} estudiantes
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={16} /> Guardado en historial
                  </span>
                )}
                <Button leftIcon={<Save size={16} />} onClick={saveAttendance} loading={saving} size="lg">
                  Guardar asistencia
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 2: HISTORIAL Y REGISTRO POR FECHAS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* Barra de control del historial */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-xs">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">
                Buscar por fecha o mes
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-[var(--color-muted)]" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Ej: 2026-10, octubre, lunes..."
                  className="form-input text-xs pl-8 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-end pt-1">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileSpreadsheet size={15} />}
                onClick={handleExportSummaryExcel}
                disabled={historyList.length === 0}
              >
                Exportar Historial Completo
              </Button>
            </div>
          </div>

          {/* Listado de fechas registradas */}
          {filteredHistory.length === 0 ? (
            <EmptyState
              icon={<Calendar size={40} />}
              title="No hay registros de asistencia guardados"
              description={
                historySearch
                  ? `No se encontraron fechas que coincidan con "${historySearch}".`
                  : `Aún no has guardado asistencia para ${course?.name ?? 'este curso'}. Ve a la pestaña "Pase de Lista del Día" y pulsa "Guardar asistencia".`
              }
              action={
                <Button
                  leftIcon={<ClipboardCheck size={16} />}
                  onClick={() => {
                    setDate(todayISO())
                    setActiveTab('daily')
                  }}
                >
                  Tomar asistencia de hoy
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--color-muted)] px-1">
                <span>Mostrando {filteredHistory.length} fechas registradas (orden cronológico)</span>
                <span>Curso: <strong className="text-[var(--color-foreground)]">{course?.name}</strong></span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredHistory.map((h) => (
                  <Card key={h.date} className="p-4 transition-all hover:border-[var(--color-primary)]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Fecha y estado */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base capitalize text-[var(--color-foreground)]">
                            {h.dateFormatted}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-muted)]">
                            {h.date}
                          </span>
                          {h.date === todayISO() && (
                            <Badge variant="success">Hoy</Badge>
                          )}
                        </div>

                        {/* Desglose de contadores */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800">
                            ✓ {h.present} Presentes
                          </span>
                          {h.late > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                              ⏰ {h.late} Tardanzas
                            </span>
                          )}
                          {h.absent > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800">
                              ✗ {h.absent} Ausentes
                            </span>
                          )}
                          {h.justified > 0 && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                              📋 {h.justified} Justificados
                            </span>
                          )}
                          <span className="text-[var(--color-muted)] ml-1">
                            • Total: {h.total} alumnos
                          </span>
                        </div>
                      </div>

                      {/* Tasa y botones de acción */}
                      <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                        <div className="text-right pr-2 hidden sm:block">
                          <span className="text-[10px] text-[var(--color-muted)] block">Tasa de asistencia</span>
                          <span className={cn('text-sm font-bold', getAttendanceRateColor(h.rate))}>
                            {h.rate}%
                          </span>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => {
                            setDate(h.date)
                            setActiveTab('daily')
                          }}
                          title="Abrir y consultar lista de este día"
                        >
                          Ver / Editar lista
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleExportSingleDay(h.date, h.records)}
                          className="btn btn-ghost btn-sm text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/40 p-2 rounded-lg"
                          title="Descargar en Excel"
                        >
                          <FileSpreadsheet size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportSingleDayWord(h.date, h.records)}
                          className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 p-2 rounded-lg"
                          title="Descargar en Word"
                        >
                          <FileText size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteDateTarget(h.date)}
                          className="btn btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-2 rounded-lg transition-colors"
                          title="Eliminar registro de este día"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 3: RESUMEN ACUMULADO POR ALUMNO
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                Rendimiento de Asistencia por Estudiante
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Total acumulado en {historyList.length} clases registradas para {course?.name}.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileSpreadsheet size={15} />}
              onClick={handleExportSummaryExcel}
              disabled={studentSummaries.length === 0}
            >
              Exportar a Excel
            </Button>
          </div>

          <Card padding="none">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th className="text-center">Presente</th>
                    <th className="text-center">Tardanza</th>
                    <th className="text-center">Ausente</th>
                    <th className="text-center">Justificado</th>
                    <th className="text-center">% Asistencia</th>
                    <th className="text-right">Perfil</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSummaries.map(({ student: s, present, late, absent, justified, rate }) => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-sm" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                            {getInitials(s.firstName, s.lastName)}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight">
                              {getFullName(s.firstName, s.lastName)}
                            </p>
                            <p className="text-xs text-[var(--color-muted)]">No. {s.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center font-bold text-green-600">{present}</td>
                      <td className="text-center font-bold text-amber-600">{late}</td>
                      <td className="text-center font-bold text-red-600">{absent}</td>
                      <td className="text-center font-bold text-blue-600">{justified}</td>
                      <td className="text-center">
                        <span className={cn('font-bold text-sm', getAttendanceRateColor(rate))}>
                          {rate}%
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/students/${s.id}?course=${courseId}`}
                          className="btn btn-ghost btn-sm text-xs inline-flex items-center gap-1"
                        >
                          <Eye size={14} /> Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmación para Eliminar Registro de una Fecha */}
      <ConfirmDialog
        open={!!deleteDateTarget}
        onClose={() => setDeleteDateTarget(null)}
        onConfirm={confirmDeleteDate}
        title="Eliminar registro de asistencia"
        message={`¿Estás seguro de que deseas eliminar permanentemente el registro de asistencia del ${deleteDateTarget}?`}
        confirmLabel="Sí, eliminar registro"
        danger
      />
    </>
  )
}
