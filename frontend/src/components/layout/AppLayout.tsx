import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, ClipboardCheck, Star,
  FileText, BarChart3, Settings, GraduationCap, ChevronLeft,
  ChevronRight, Moon, Sun, LogOut, Menu, X
} from 'lucide-react'
import { useAppStore, useAuthStore } from '@/store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Mis cursos' },
  { to: '/students', icon: Users, label: 'Estudiantes' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Asistencia' },
  { to: '/grades', icon: Star, label: 'Calificaciones' },
  { to: '/exams', icon: FileText, label: 'Exámenes' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, setMobileSidebar, toggleTheme, theme } = useAppStore()
  const { user, logout } = useAuthStore()

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn('sidebar-overlay', mobileSidebarOpen && 'visible')}
        onClick={() => setMobileSidebar(false)}
      />

      <aside className={cn('sidebar', sidebarCollapsed && 'collapsed', mobileSidebarOpen && 'mobile-open')}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]" style={{ minHeight: 'var(--topbar-height)' }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <GraduationCap size={18} color="white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-base leading-none" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}>
                ClassFlow
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Tu aula, organizada.</p>
            </div>
          )}
          {/* Mobile close */}
          <button className="ml-auto lg:hidden btn btn-ghost btn-icon" onClick={() => setMobileSidebar(false)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn('nav-item', isActive && 'active')}
              onClick={() => setMobileSidebar(false)}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={18} className="nav-icon" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[var(--color-border)] p-3 flex flex-col gap-1">
          <button
            className="nav-item w-full text-left"
            onClick={toggleTheme}
            title={sidebarCollapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
          >
            {theme === 'dark' ? <Sun size={18} className="nav-icon" /> : <Moon size={18} className="nav-icon" />}
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>

          {user && (
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)]', !sidebarCollapsed && 'border border-[var(--color-border)] mt-1')}>
              <div className="avatar avatar-sm flex-shrink-0" style={{ background: 'var(--color-primary)', color: 'white', fontSize: 11 }}>
                {user.name.charAt(0)}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{user.name}</p>
                    <p className="text-[11px] text-[var(--color-muted)] truncate">{user.email}</p>
                  </div>
                  <button className="btn btn-ghost btn-icon p-1" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
                    <LogOut size={15} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Collapse toggle – desktop only */}
          <button
            className="nav-item hidden lg:flex justify-center mt-1"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} />{!sidebarCollapsed && <span>Contraer</span>}</>}
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Topbar ───────────────────────────────────────────────────
import { Bell, Search } from 'lucide-react'
import { db } from '@/lib/mockData'
import { useAppStore as _useApp } from '@/store'

export function Topbar() {
  const { setMobileSidebar, selectedCourseId, setSelectedCourse } = useAppStore()
  const location = useLocation()
  const courses = db.courses.list()

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard', '/courses': 'Mis cursos', '/students': 'Estudiantes',
    '/attendance': 'Asistencia', '/grades': 'Calificaciones', '/exams': 'Exámenes',
    '/reports': 'Reportes', '/settings': 'Configuración',
  }
  const title = pageTitles[location.pathname] ?? 'ClassFlow'

  return (
    <header className="topbar">
      <button
        className="btn btn-ghost btn-icon lg:hidden"
        onClick={() => setMobileSidebar(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <h2 className="text-base font-semibold hidden sm:block" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>

      <div className="flex-1" />

      {/* Course selector */}
      <div className="hidden sm:block">
        <select
          className="form-select text-sm py-1.5 pl-3 pr-8 w-44"
          value={selectedCourseId ?? ''}
          onChange={(e) => setSelectedCourse(e.target.value || null)}
          aria-label="Seleccionar curso"
        >
          <option value="">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name} – {c.group}</option>
          ))}
        </select>
      </div>

      <button className="btn btn-ghost btn-icon" aria-label="Notificaciones">
        <div className="relative">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">3</span>
        </div>
      </button>
    </header>
  )
}

// ─── Mobile Bottom Nav ────────────────────────────────────────
export function MobileBottomNav() {
  const MOBILE_NAV = [
    { to: '/', icon: LayoutDashboard, label: 'Inicio' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Lista' },
    { to: '/students', icon: Users, label: 'Alumnos' },
    { to: '/grades', icon: Star, label: 'Notas' },
    { to: '/courses', icon: BookOpen, label: 'Cursos' },
  ]

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
      {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium',
              isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]')
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

// ─── App Layout ───────────────────────────────────────────────
import { ToastContainer } from '@/components/ui'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore()

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-content" id="main-content">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <ToastContainer />
    </div>
  )
}
