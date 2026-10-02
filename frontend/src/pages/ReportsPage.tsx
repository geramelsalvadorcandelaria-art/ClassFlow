import React, { useState } from 'react'
import { TrendingUp, Users, Award, AlertTriangle, Download, Filter } from 'lucide-react'
import { Card, StatsCard, Badge, PageHeader, Select, ProgressBar } from '@/components/ui'
import { db, MOCK_COURSES, getAcademicAlerts, getAllStudents } from '@/lib/mockData'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { cn, calculateWeightedAverage, getGradeColor, getAttendanceRateColor, gradeLevel, gradeLevelLabels } from '@/lib/utils'

const COLORS = ['#16A34A', '#2563EB', '#D97706', '#DC2626']

export default function ReportsPage() {
  const [selectedCourse, setSelectedCourse] = useState('')

  const courses = db.courses.list()
  const alerts = getAcademicAlerts()
  const allStudents = getAllStudents()

  const filteredStudents = selectedCourse
    ? allStudents.filter((s) => s.courseId === selectedCourse)
    : allStudents

  // Grade distribution
  const distribution = {
    excellent: filteredStudents.filter((s) => s.averageGrade >= 90).length,
    good: filteredStudents.filter((s) => s.averageGrade >= 75 && s.averageGrade < 90).length,
    regular: filteredStudents.filter((s) => s.averageGrade >= 60 && s.averageGrade < 75).length,
    'at-risk': filteredStudents.filter((s) => s.averageGrade < 60).length,
  }

  const distData = [
    { name: 'Excelente', value: distribution.excellent, color: COLORS[0] },
    { name: 'Bueno', value: distribution.good, color: COLORS[1] },
    { name: 'Regular', value: distribution.regular, color: COLORS[2] },
    { name: 'En riesgo', value: distribution['at-risk'], color: COLORS[3] },
  ]

  // Course comparison
  const courseData = courses.map((c) => ({
    name: c.code,
    promedio: c.averageGrade ?? 0,
    asistencia: c.attendanceRate ?? 0,
  }))

  // Best students
  const topStudents = [...filteredStudents]
    .sort((a, b) => b.averageGrade - a.averageGrade)
    .slice(0, 5)

  // At-risk students
  const atRiskStudents = filteredStudents
    .filter((s) => s.averageGrade < 70 || s.attendanceRate < 80)
    .slice(0, 5)

  const overallAvg = filteredStudents.length
    ? filteredStudents.reduce((s, st) => s + st.averageGrade, 0) / filteredStudents.length
    : 0
  const overallAtt = filteredStudents.length
    ? filteredStudents.reduce((s, st) => s + st.attendanceRate, 0) / filteredStudents.length
    : 0

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Análisis académico y estadísticas"
        actions={
          <button className="btn btn-secondary" aria-label="Exportar reporte">
            <Download size={15} />
            <span>Exportar</span>
          </button>
        }
      />

      {/* Filter */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <select
          className="form-select text-sm"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          aria-label="Filtrar por curso"
        >
          <option value="">Todos los cursos</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name} – {c.group}</option>)}
        </select>
      </div>

      {/* Summary stats */}
      <div className="stats-grid mb-6">
        <StatsCard icon={<TrendingUp size={20} color="#2563EB" />} iconBg="#DBEAFE"
          label="Promedio general" value={`${overallAvg.toFixed(1)}%`} />
        <StatsCard icon={<Users size={20} color="#059669" />} iconBg="#D1FAE5"
          label="Asistencia promedio" value={`${overallAtt.toFixed(1)}%`} />
        <StatsCard icon={<Award size={20} color="#7C3AED" />} iconBg="#EDE9FE"
          label="Estudiantes" value={filteredStudents.length} />
        <StatsCard icon={<AlertTriangle size={20} color="#DC2626" />} iconBg="#FEE2E2"
          label="En riesgo" value={alerts.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Course comparison */}
        <Card>
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Comparación de cursos</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={courseData} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Bar dataKey="promedio" name="Promedio" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="asistencia" name="Asistencia" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribution */}
        <Card>
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Distribución académica</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={distData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                {distData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {distData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-sm">{d.name}</span>
                <span className="ml-auto text-sm font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top students */}
        <Card>
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>🏆 Mejores estudiantes</h2>
          {topStudents.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-6">Sin datos suficientes.</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s.id + s.courseId} className="flex items-center gap-3">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    i === 0 && 'bg-yellow-100 text-yellow-700',
                    i === 1 && 'bg-gray-100 text-gray-600',
                    i === 2 && 'bg-orange-100 text-orange-600',
                    i > 2 && 'bg-[var(--color-muted-bg)] text-[var(--color-muted)]',
                  )}>
                    {i + 1}
                  </div>
                  <div className="avatar avatar-sm flex-shrink-0" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 11 }}>
                    {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-[var(--color-muted)] truncate">{s.courseName}</p>
                  </div>
                  <span className={cn('text-sm font-bold tabular-nums', getGradeColor(s.averageGrade))}>
                    {s.averageGrade.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* At-risk */}
        <Card>
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>⚠️ Estudiantes en riesgo</h2>
          {atRiskStudents.length === 0 ? (
            <p className="text-sm text-green-600 text-center py-6">¡Sin estudiantes en riesgo! 🎉</p>
          ) : (
            <div className="space-y-3">
              {atRiskStudents.map((s) => (
                <div key={s.id + s.courseId} className="p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-bg)]">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{s.firstName} {s.lastName}</p>
                    <Badge variant="danger">{s.averageGrade < 60 ? 'Crítico' : 'Riesgo'}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mb-2">{s.courseName}</p>
                  <div className="flex gap-4 text-xs">
                    <span className={cn('font-medium', getGradeColor(s.averageGrade))}>Promedio: {s.averageGrade.toFixed(1)}%</span>
                    <span className={cn('font-medium', getAttendanceRateColor(s.attendanceRate))}>Asistencia: {s.attendanceRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
