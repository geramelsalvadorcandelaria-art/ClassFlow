import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle, Save, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Select, Card, Badge, PageHeader, EmptyState } from '@/components/ui'
import { db, MOCK_COURSES } from '@/lib/mockData'
import { useAppStore } from '@/store'
import { toast } from '@/store'
import { cn, getInitials, getFullName, todayISO, attendanceLabels } from '@/lib/utils'
import type { AttendanceStatus, AttendanceRecord, Student } from '@/types'

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
      {/* Avatar */}
      <div className="avatar avatar-md flex-shrink-0" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 13 }}>
        {getInitials(student.firstName, student.lastName)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{getFullName(student.firstName, student.lastName)}</p>
        <p className="text-xs text-[var(--color-muted)]">{student.studentId}</p>
      </div>

      {/* Status indicator on mobile */}
      <span className={cn('badge sm:hidden', 
        status === 'present' && 'badge-success',
        status === 'late' && 'badge-warning',
        status === 'absent' && 'badge-danger',
        status === 'justified' && 'badge-info',
      )}>
        {cfg.icon}
      </span>

      {/* Buttons */}
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
  const [courseId, setCourseId] = useState(selectedCourseId ?? MOCK_COURSES[0]?.id ?? '')
  const [date, setDate] = useState(todayISO())
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const course = MOCK_COURSES.find((c) => c.id === courseId)
  const students = db.students.list(courseId)

  // Load existing attendance
  useEffect(() => {
    const existing = db.attendance.listByDate(courseId, date)
    const map: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { map[s.id] = 'present' })
    existing.forEach((a) => { map[a.studentId] = a.status })
    setStatusMap(map)
    setSaved(false)
  }, [courseId, date, students.length])

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
      toast.success('✓ Asistencia guardada', `${course?.name} – ${date}`)
    }, 600)
  }

  const counts = students.reduce((acc, s) => {
    const st = statusMap[s.id] ?? 'present'
    acc[st] = (acc[st] ?? 0) + 1
    return acc
  }, {} as Record<AttendanceStatus, number>)

  const prevDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }
  const nextDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }

  return (
    <>
      <PageHeader
        title="Asistencia"
        subtitle="Modo rápido optimizado para móvil"
      />

      {/* Controls */}
      <Card className="mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <Select
              label="Curso"
              value={courseId}
              onChange={(e) => { setCourseId(e.target.value); setSelectedCourse(e.target.value) }}
              options={MOCK_COURSES.map((c) => ({ value: c.id, label: `${c.name} – ${c.group}` }))}
            />
          </div>
          <div>
            <label className="form-label">Fecha</label>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-icon" onClick={prevDay} aria-label="Día anterior"><ChevronLeft size={16} /></button>
              <input type="date" className="form-input text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className="btn btn-ghost btn-icon" onClick={nextDay} aria-label="Día siguiente"><ChevronRight size={16} /></button>
            </div>
          </div>
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
        <span className="text-sm text-[var(--color-muted)] self-center">Marcar todos:</span>
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
        <div className="space-y-2 mb-6">
          {students.filter((s) => s.status === 'active').map((student) => (
            <StudentAttendanceRow
              key={student.id}
              student={student}
              status={statusMap[student.id] ?? 'present'}
              onStatusChange={setStatus}
            />
          ))}
        </div>
      )}

      {/* Save bar */}
      {students.length > 0 && (
        <div className="sticky bottom-16 lg:bottom-4 left-0 right-0 flex items-center justify-between gap-3 p-4 rounded-[var(--radius-xl)] shadow-lg border border-[var(--color-border)]"
          style={{ background: 'var(--color-surface)' }}>
          <div>
            <p className="font-semibold text-sm">{course?.name} – {course?.group}</p>
            <p className="text-xs text-[var(--color-muted)]">{date} · {students.filter((s) => s.status === 'active').length} estudiantes</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle size={15} /> Guardado
              </span>
            )}
            <Button leftIcon={<Save size={16} />} onClick={saveAttendance} loading={saving} size="lg">
              Guardar asistencia
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
