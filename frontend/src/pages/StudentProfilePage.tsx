import React, { useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Calendar, BookOpen, ClipboardCheck, Star } from 'lucide-react'
import { Card, Badge, Avatar, StatsCard, AttendanceStatusBadge, ProgressBar } from '@/components/ui'
import { db, MOCK_COURSES } from '@/lib/mockData'
import {
  getInitials, getFullName, formatDate, formatDateShort,
  calculateWeightedAverage, getGradeColor, getAttendanceRateColor,
  evaluationTypeLabels, studentStatusLabels, attendanceLabels,
  ACADEMIC_PERIODS, calculateStudentAnnualGrades, getEvaluationDynamicWeight,
  CRITERIA_CONFIG, getCriteriaKey
} from '@/lib/utils'
import type { StudentStatus, PeriodId } from '@/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const courseId = searchParams.get('course') ?? MOCK_COURSES[0]?.id ?? ''
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'attendance'>('overview')

  const student = db.students.get(courseId, id ?? '')
  const course = MOCK_COURSES.find((c) => c.id === courseId)

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold mb-2">Estudiante no encontrado</p>
        <button className="btn btn-secondary mt-4" onClick={() => navigate('/students')}>Volver</button>
      </div>
    )
  }

  const grades = db.grades.listByStudent(courseId, student.id)
  const evaluations = db.evaluations.list(courseId)
  const attendance = db.attendance.list(courseId).filter((a) => a.studentId === student.id)

  const avgGrade = calculateWeightedAverage(grades, evaluations)
  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length
  const attRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0

  const statusBadge: Record<StudentStatus, 'success' | 'neutral' | 'danger'> = {
    active: 'success', inactive: 'neutral', withdrawn: 'danger',
  }

  // Grade trend for chart
  const gradeTrend = grades
    .slice(-6)
    .map((g) => {
      const ev = evaluations.find((e) => e.id === g.evaluationId)
      return { name: ev?.name?.slice(0, 8) ?? '?', score: Math.round((g.score / (ev?.maxScore ?? 100)) * 100) }
    })

  const TABS = [
    { id: 'overview', label: 'Resumen' },
    { id: 'grades', label: 'Calificaciones' },
    { id: 'attendance', label: 'Asistencia' },
  ] as const

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-1.5">
        <ArrowLeft size={15} /> Volver
      </button>

      {/* Profile header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar initials={getInitials(student.firstName, student.lastName)} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                {getFullName(student.firstName, student.lastName)}
              </h1>
              <Badge variant={statusBadge[student.status]}>{studentStatusLabels[student.status]}</Badge>
            </div>
            <p className="text-[var(--color-muted)] text-sm mt-0.5">{student.studentId}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-[var(--color-muted)] justify-center sm:justify-start">
              {student.email && <span className="flex items-center gap-1"><Mail size={13} />{student.email}</span>}
              {student.phone && <span className="flex items-center gap-1"><Phone size={13} />{student.phone}</span>}
              <span className="flex items-center gap-1"><BookOpen size={13} />{course?.name} – {course?.group}</span>
              <span className="flex items-center gap-1"><Calendar size={13} />Desde {formatDate(student.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard icon={<Star size={18} color="#2563EB" />} iconBg="#DBEAFE"
          label="Promedio general" value={avgGrade > 0 ? `${avgGrade.toFixed(1)}%` : '—'} />
        <StatsCard icon={<ClipboardCheck size={18} color="#059669" />} iconBg="#D1FAE5"
          label="Asistencia" value={`${attRate}%`} />
        <StatsCard icon={<BookOpen size={18} color="#7C3AED" />} iconBg="#EDE9FE"
          label="Evaluaciones" value={grades.length} />
        <StatsCard icon={<Calendar size={18} color="#D97706" />} iconBg="#FEF3C7"
          label="Ausencias" value={attendance.filter((a) => a.status === 'absent').length} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h2 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Evolución de notas</h2>
            {gradeTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={gradeTrend} margin={{ left: -15, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--color-muted)] text-center py-8">Sin calificaciones aún.</p>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Resumen de asistencia</h2>
            {[
              { label: 'Presente', count: attendance.filter((a) => a.status === 'present').length, color: 'var(--color-success)' },
              { label: 'Tardanza', count: attendance.filter((a) => a.status === 'late').length, color: 'var(--color-warning)' },
              { label: 'Ausente', count: attendance.filter((a) => a.status === 'absent').length, color: 'var(--color-danger)' },
              { label: 'Justificado', count: attendance.filter((a) => a.status === 'justified').length, color: 'var(--color-info)' },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <ProgressBar value={item.count} max={attendance.length} color={item.color} size="sm" />
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === 'grades' && (() => {
        const annualReport = calculateStudentAnnualGrades(grades, evaluations)
        return (
          <div className="space-y-4">
            {/* 4 Periods Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ACADEMIC_PERIODS.map((p) => {
                const breakdown = annualReport.periods[p.id]
                return (
                  <Card key={p.id} className="p-3.5 text-center">
                    <span className="text-xs font-bold block text-[var(--color-muted)]">{p.name}</span>
                    <span className="text-xl font-black mt-1 block">
                      {breakdown?.hasGrades ? (
                        <span className={getGradeColor(breakdown.totalScore)}>{breakdown.totalScore.toFixed(1)}</span>
                      ) : (
                        <span className="text-[var(--color-muted)] text-base font-normal">—</span>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)] block mt-0.5">
                      {breakdown?.hasEvaluations ? `${Object.values(breakdown.categories).reduce((s, c) => s + c.evaluationsCount, 0)} eval.` : 'Sin eval.'}
                    </span>
                  </Card>
                )
              })}
            </div>

            <Card padding="none">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Actividad</th>
                      <th>Criterio</th>
                      <th>Fecha</th>
                      <th className="text-right">Nota</th>
                      <th className="text-right">Porcentaje</th>
                      <th className="text-right">Peso en Período</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => {
                      const ev = evaluations.find((e) => e.id === g.evaluationId)
                      if (!ev) return null
                      const pct = Math.round((g.score / ev.maxScore) * 100)
                      const dynWeight = getEvaluationDynamicWeight(ev, evaluations)
                      const catInfo = CRITERIA_CONFIG[getCriteriaKey(ev.type)]
                      return (
                        <tr key={g.id}>
                          <td>
                            <span className="badge badge-sm font-bold bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                              {ev.period || 'P1'}
                            </span>
                          </td>
                          <td className="font-semibold text-sm">{ev.name}</td>
                          <td>
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block"
                              style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}
                            >
                              {catInfo.name} ({catInfo.weight}%)
                            </span>
                          </td>
                          <td className="text-sm text-[var(--color-muted)]">{formatDate(ev.date)}</td>
                          <td className="text-right font-semibold tabular-nums">{Math.round(g.score)}/{ev.maxScore}</td>
                          <td className={`text-right font-bold tabular-nums ${getGradeColor(pct)}`}>{pct}%</td>
                          <td className="text-right text-sm font-semibold tabular-nums text-[var(--color-primary)]">
                            {dynWeight}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {grades.length === 0 && (
                  <p className="text-center text-sm text-[var(--color-muted)] py-8">Sin calificaciones registradas.</p>
                )}
              </div>
            </Card>
          </div>
        )
      })()}

      {activeTab === 'attendance' && (
        <Card padding="none">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice().reverse().map((a) => (
                  <tr key={a.id}>
                    <td className="text-sm">{formatDate(a.date)}</td>
                    <td><AttendanceStatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && (
              <p className="text-center text-sm text-[var(--color-muted)] py-8">Sin historial de asistencia.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
