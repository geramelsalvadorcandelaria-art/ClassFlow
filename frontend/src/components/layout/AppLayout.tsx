import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, ClipboardCheck, Star,
  FileText, BarChart3, Settings, GraduationCap, ChevronLeft,
  ChevronRight, Moon, Sun, LogOut, Menu, X, Bell, CheckCheck,
  AlertTriangle, Clock, Info, CheckCircle2, ShieldCheck, UserCheck
} from 'lucide-react'
import { useAppStore, useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import { db, useCourses } from '@/lib/mockData'
import type { SystemModuleConfig } from '@/types'
import { ToastContainer } from '@/components/ui'

interface NavDef {
  to: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  moduleKey: keyof SystemModuleConfig
}

const ALL_NAV_ITEMS: NavDef[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', moduleKey: 'dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Mis cursos', moduleKey: 'courses' },
  { to: '/students', icon: Users, label: 'Estudiantes', moduleKey: 'students' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Asistencia', moduleKey: 'attendance' },
  { to: '/grades', icon: Star, label: 'Calificaciones', moduleKey: 'grades' },
  { to: '/exams', icon: FileText, label: 'Exámenes', moduleKey: 'exams' },
  { to: '/reports', icon: BarChart3, label: 'Reportes', moduleKey: 'reports' },
  { to: '/settings', icon: Settings, label: 'Configuración', moduleKey: 'settings' },
]

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, setMobileSidebar, toggleTheme, theme } = useAppStore()
  const { user, logout, systemModules } = useAuthStore()

  // Filter navigation items based on system modules enabled or admin role
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    // Settings is always accessible
    if (item.moduleKey === 'settings') return true
    // Admins see all items (with inactive indicator if disabled)
    if (user?.role === 'admin') return true
    // For non-admin, only show if the module is enabled by administrator
    return systemModules[item.moduleKey] !== false
  })

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    teacher: 'Profesor',
    coordinator: 'Coordinador',
    student: 'Estudiante',
  }

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
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shadow-sm">
            <GraduationCap size={18} color="white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-base leading-none" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}>
                  ClassFlow
                </p>
                {user?.role === 'admin' && (
                  <span className="badge badge-primary text-[9px] py-0 px-1 font-bold uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-0.5 truncate">Tu aula, organizada.</p>
            </div>
          )}
          {/* Mobile close */}
          <button className="ml-auto lg:hidden btn btn-ghost btn-icon" onClick={() => setMobileSidebar(false)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto" aria-label="Navegación principal">
          {visibleNavItems.map(({ to, icon: Icon, label, moduleKey }) => {
            const isDisabledForUsers = user?.role === 'admin' && systemModules[moduleKey] === false && moduleKey !== 'settings'
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => cn('nav-item relative', isActive && 'active')}
                onClick={() => setMobileSidebar(false)}
                title={sidebarCollapsed ? `${label}${isDisabledForUsers ? ' (Inactivo p/ usuarios)' : ''}` : undefined}
              >
                <Icon size={18} className="nav-icon" />
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{label}</span>
                    {isDisabledForUsers && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold">
                        Pausado
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom user card and toggles */}
        <div className="border-t border-[var(--color-border)] p-3 flex flex-col gap-1.5">
          <button
            className="nav-item w-full text-left"
            onClick={toggleTheme}
            title={sidebarCollapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
          >
            {theme === 'dark' ? <Sun size={18} className="nav-icon text-amber-400" /> : <Moon size={18} className="nav-icon" />}
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>

          {user && (
            <div className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] transition-colors',
              !sidebarCollapsed ? 'border border-[var(--color-border)] bg-[var(--color-card)]' : 'justify-center'
            )}>
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[var(--color-border)] flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-xs shadow-xs"
                  style={{ background: user.role === 'admin' ? '#7C3AED' : 'var(--color-primary)' }}
                >
                  {user.name.charAt(0)}
                </div>
              )}

              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-tight">{user.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.2 rounded-full',
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      )}>
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon p-1.5 text-[var(--color-muted)] hover:text-red-500 transition-colors"
                    onClick={logout}
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                  >
                    <LogOut size={16} />
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
export function Topbar() {
  const { setMobileSidebar, selectedCourseId, setSelectedCourse } = useAppStore()
  const { user, notifications, markNotificationRead, markAllNotificationsRead, clearNotification } = useAuthStore()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const courses = useCourses()

  const unreadCount = notifications.filter((n) => !n.read).length

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard', '/courses': 'Mis cursos', '/students': 'Estudiantes',
    '/attendance': 'Asistencia', '/grades': 'Calificaciones', '/exams': 'Exámenes',
    '/reports': 'Reportes', '/settings': 'Configuración',
  }
  const title = pageTitles[location.pathname] ?? 'ClassFlow'

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  return (
    <header className="topbar relative">
      <button
        className="btn btn-ghost btn-icon lg:hidden"
        onClick={() => setMobileSidebar(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold hidden sm:block" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h2>
        {user?.role === 'admin' && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
            <ShieldCheck size={12} /> Modo Administrador
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Course selector - Actualizado reactivamente */}
      <div className="hidden sm:block">
        <select
          className="form-select text-sm py-1.5 pl-3 pr-8 w-48"
          value={selectedCourseId ?? ''}
          onChange={(e) => setSelectedCourse(e.target.value || null)}
          aria-label="Seleccionar curso"
        >
          <option value="">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.room ? ` (Aula ${c.room})` : (c.group ? ` (${c.group})` : '')}
            </option>
          ))}
        </select>
      </div>

      {/* Notifications Popover */}
      <div className="relative" ref={notifRef}>
        <button
          className={cn(
            'btn btn-ghost btn-icon relative transition-colors',
            notificationsOpen && 'bg-[var(--color-bg-secondary)]'
          )}
          aria-label="Notificaciones del sistema"
          title="Notificaciones"
          onClick={() => setNotificationsOpen((prev) => !prev)}
        >
          <div className="relative">
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
        </button>

        {/* Dropdown Panel */}
        {notificationsOpen && (
          <div
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                  Notificaciones
                </span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    {unreadCount} nuevas
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--color-muted)]">Al día</span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <CheckCheck size={14} /> Leídas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--color-border)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-muted)]">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No tienes notificaciones pendientes</p>
                  <p className="text-xs mt-1">Te avisaremos cuando haya novedades en tus cursos.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-3.5 flex gap-3 transition-colors hover:bg-[var(--color-bg-secondary)] group relative',
                      !n.read && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {n.type === 'alert' && (
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 flex items-center justify-center">
                          <AlertTriangle size={15} />
                        </div>
                      )}
                      {n.type === 'warning' && (
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 flex items-center justify-center">
                          <Clock size={15} />
                        </div>
                      )}
                      {n.type === 'info' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center">
                          <Info size={15} />
                        </div>
                      )}
                      {n.type === 'success' && (
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle2 size={15} />
                        </div>
                      )}
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        markNotificationRead(n.id)
                        if (n.link) {
                          navigate(n.link)
                          setNotificationsOpen(false)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={cn('text-xs truncate font-semibold', !n.read && 'text-[var(--color-foreground)]')}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-[var(--color-muted)] flex-shrink-0">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearNotification(n.id)
                      }}
                      className="text-[var(--color-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 self-start"
                      title="Descartar"
                      aria-label="Descartar"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] text-center">
              <button
                onClick={() => {
                  setNotificationsOpen(false)
                  navigate('/settings')
                }}
                className="text-xs text-[var(--color-primary)] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Settings size={13} /> Configurar notificaciones
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User profile avatar thumbnail */}
      {user && (
        <NavLink
          to="/settings"
          className="flex items-center gap-2 pl-2 hover:opacity-80 transition-opacity"
          title={`Conectado como ${user.name}`}
        >
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-[var(--color-border)] shadow-xs"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
              style={{ background: user.role === 'admin' ? '#7C3AED' : 'var(--color-primary)' }}
            >
              {user.name.charAt(0)}
            </div>
          )}
        </NavLink>
      )}
    </header>
  )
}

// ─── Mobile Bottom Nav ────────────────────────────────────────
export function MobileBottomNav() {
  const { systemModules, user } = useAuthStore()

  const MOBILE_NAV = [
    { to: '/', icon: LayoutDashboard, label: 'Inicio', moduleKey: 'dashboard' as const },
    { to: '/attendance', icon: ClipboardCheck, label: 'Lista', moduleKey: 'attendance' as const },
    { to: '/students', icon: Users, label: 'Alumnos', moduleKey: 'students' as const },
    { to: '/grades', icon: Star, label: 'Notas', moduleKey: 'grades' as const },
    { to: '/courses', icon: BookOpen, label: 'Cursos', moduleKey: 'courses' as const },
  ]

  const visibleMobileNav = MOBILE_NAV.filter((item) => {
    if (user?.role === 'admin') return true
    return systemModules[item.moduleKey] !== false
  })

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
      {visibleMobileNav.map(({ to, icon: Icon, label }) => (
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

