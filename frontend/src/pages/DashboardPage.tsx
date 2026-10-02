import React from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Users, ClipboardCheck, FileText, TrendingUp,
  AlertTriangle, ArrowRight, Plus, Star, Zap
} from 'lucide-react'
import { StatsCard, Card, Badge, Button, ProgressBar, Avatar } from '@/components/ui'
import { db, getDashboardStats, getTodayCourses, getAcademicAlerts } from '@/lib/mockData'
import { useAuthStore, useAppStore } from '@/store'
import { formatGrade, getInitials } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const GRADE_TREND = [
  { week: 'S1', avg: 72 }, { week: 'S2', avg: 74 }, { week: 'S3', avg: 71 },
  { week: 'S4', avg: 76 }, { week: 'S5', avg: 79 }, { week: 'S6', avg: 78 },
  { week: 'S7', avg: 82 }, { week: 'S8', avg: 81 }, { week: 'S9', avg: 84 },
]

const DISTRIBUTION = [
  { name: 'Excelente', value: 18, color: '#16A34A' },
  { name: 'Bueno', value: 42, color: '#2563EB' },
  { name: 'Regular', value: 28, color: '#D97706' },
  { name: 'En riesgo', value: 12, color: '#DC2626' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { setSelectedCourse } = useAppStore()
  const stats = getDashboardStats()
  const todayCourses = getTodayCourses()
  const alerts = getAcademicAlerts().slice(0, 4)
  const courses = db.courses.list()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-[var(--radius-xl)] p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 100%)' }}>
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="160" cy="40" r="80" fill="white" />
            <circle cx="60" cy="180" r="60" fill="white" />
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {user?.name ?? 'Profesor'}
          </h1>
          <p className="text-blue-100 text-sm">Aquí tienes el resumen de hoy, {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
          <div className="flex gap-3 mt-4 flex-wrap">
            <Link to="/attendance" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
              <ClipboardCheck size={16} />
              <span>Pasar lista</span>
            </Link>
            <Link to="/courses/new" className="btn btn-lg" style={{ background: 'white', color: '#1D4ED8' }}>
              <Plus size={16} />
              <span>Nuevo curso</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatsCard
          icon={<BookOpen size={20} color="var(--color-primary)" />}
          iconBg="var(--color-primary-light)"
          label="Cursos activos"
          value={stats.totalCourses}
          trend="este período"
          trendUp
        />
        <StatsCard
          icon={<Users size={20} color="#7C3AED" />}
          iconBg="#EDE9FE"
          label="Total estudiantes"
          value={stats.totalStudents}
          trend="4 nuevos"
          trendUp
        />
        <StatsCard
          icon={<ClipboardCheck size={20} color="#059669" />}
          iconBg="#D1FAE5"
          label="Asistencia hoy"
          value={`${stats.todayAttendanceRate}%`}
          trend="vs ayer"
          trendUp
        />
        <StatsCard
          icon={<FileText size={20} color="#D97706" />}
          iconBg="#FEF3C7"
          label="Exámenes pendientes"
          value={stats.pendingExams}
          trend="de calificar"
        />
        <StatsCard
          icon={<Star size={20} color="#2563EB" />}
          iconBg="#DBEAFE"
          label="Promedio general"
          value={`${stats.overallAverage}%`}
          trend="↑ 3.2 pts"
          trendUp
        />
        <StatsCard
          icon={<AlertTriangle size={20} color="#DC2626" />}
          iconBg="#FEE2E2"
          label="En riesgo"
          value={stats.atRiskStudents}
          trend="requieren atención"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Charts col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grade trend chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Evolución del promedio</h2>
                <p className="text-xs text-[var(--color-muted)]">Últimas 9 semanas</p>
              </div>
              <Badge variant="primary">+11.1 pts</Badge>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={GRADE_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  formatter={(v: unknown) => [`${v as number}%`, 'Promedio'] as [string, string]}
                />
                <Line type="monotone" dataKey="avg" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Today's courses */}
          <Card padding="none">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Mis cursos de hoy</h2>
              <Link to="/courses" className="text-sm text-[var(--color-primary)] font-medium flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'var(--color-primary-light)' }}>
                    <BookOpen size={18} color="var(--color-primary)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{course.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{course.group} · Aula {course.room} · {course.schedule}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-center">
                    <div>
                      <p className="text-sm font-bold">{course.studentCount}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">estudiantes</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-600">{course.attendanceRate}%</p>
                      <p className="text-[10px] text-[var(--color-muted)]">asistencia</p>
                    </div>
                  </div>
                  <Link
                    to="/attendance"
                    onClick={() => setSelectedCourse(course.id)}
                    className="btn btn-secondary btn-sm flex-shrink-0"
                  >
                    <Zap size={13} />
                    <span className="hidden sm:inline">Pasar lista</span>
                    <span className="sm:hidden">Lista</span>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Distribution chart */}
          <Card>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Distribución de estudiantes</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={DISTRIBUTION} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {DISTRIBUTION.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {DISTRIBUTION.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-sm flex-1">{d.name}</span>
                  <span className="text-sm font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Alerts */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>⚠️ Alertas</h2>
              <Badge variant="danger">{alerts.length}</Badge>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-muted-bg)]">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: a.severity === 'high' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)' }}>
                    <AlertTriangle size={13} color={a.severity === 'high' ? 'var(--color-danger)' : 'var(--color-warning)'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.studentName}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {a.alertType === 'low_grade' ? `Promedio: ${a.averageGrade}%` : `Asistencia: ${a.attendanceRate}%`}
                    </p>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-sm text-[var(--color-muted)] text-center py-3">Sin alertas 🎉</p>
              )}
            </div>
            <Link to="/reports" className="btn btn-ghost btn-sm w-full mt-3 text-[var(--color-primary)]">
              Ver todos los reportes
            </Link>
          </Card>

          {/* Quick actions */}
          <Card>
            <h2 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Acciones rápidas</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/students/new', icon: <Users size={16} />, label: '+ Estudiante' },
                { to: '/attendance', icon: <ClipboardCheck size={16} />, label: 'Pasar lista' },
                { to: '/exams/new', icon: <FileText size={16} />, label: '+ Examen' },
                { to: '/grades', icon: <Star size={16} />, label: 'Ver notas' },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="btn btn-secondary btn-sm flex gap-1.5 items-center justify-center">
                  {a.icon}<span>{a.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
