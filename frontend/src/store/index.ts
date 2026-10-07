import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, SystemModuleConfig, AppNotification } from '@/types'
import { storage } from '@/lib/utils'
import { db, onUsersSync, notifyCoursesChanged } from '@/lib/mockData'

export const DEFAULT_SYSTEM_MODULES: SystemModuleConfig = {
  dashboard: true,
  courses: true,
  students: true,
  attendance: true,
  grades: true,
  exams: true,
  reports: true,
  settings: true,
}

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'geramel',
    email: 'carooveneno@gmail.com',
    role: 'admin',
    password: 'admin',
    photo: '',
    department: 'geramelsalvadorcandelaria@gmail.com',
    phone: '829-505-4822',
    active: true,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'u-1791219104305',
    name: 'PEDRO',
    email: 'pjceballos12@gmail.com',
    role: 'admin',
    password: '12345678',
    photo: '',
    department: 'pjceballos12@gmail.com',
    phone: '+1 (555) 000-0000',
    active: true,
    createdAt: '2026-10-05T16:51:44.305Z',
  },
  {
    id: 'u1',
    name: 'Prof. García',
    email: 'profesor@classflow.com',
    role: 'teacher',
    password: 'demo',
    photo: '',
    department: 'Ciencias y Tecnología',
    phone: '+1 (555) 234-5678',
    active: true,
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'u-coord',
    name: 'Lic. Fernández',
    email: 'coordinacion@classflow.com',
    role: 'coordinator',
    password: 'coord',
    photo: '',
    department: 'Coordinación Académica',
    phone: '+1 (555) 876-5432',
    active: true,
    createdAt: '2026-03-01T00:00:00Z',
  },
]

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Alumnos en riesgo académico',
    message: 'Hay 8 estudiantes con promedio inferior al 70% o asistencia crítica.',
    type: 'alert',
    timestamp: 'Hace 15 min',
    read: false,
    link: '/reports',
  },
  {
    id: 'notif-2',
    title: 'Evaluaciones pendientes',
    message: 'Examen Parcial 2 tiene calificaciones pendientes por ingresar.',
    type: 'warning',
    timestamp: 'Hace 2 horas',
    read: false,
    link: '/exams',
  },
  {
    id: 'notif-3',
    title: 'Nuevo período escolar activo',
    message: 'El Período P1 está próximo a su cierre de ponderación.',
    type: 'info',
    timestamp: 'Ayer',
    read: false,
    link: '/grades',
  },
]

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  users: User[]
  systemModules: SystemModuleConfig
  notifications: AppNotification[]
  login: (user: User, token: string) => void
  logout: () => void
  setUsers: (users: User[]) => void
  updateUser: (data: Partial<User>) => void
  createUser: (data: Omit<User, 'id' | 'createdAt'>) => User
  updateUserById: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => boolean
  toggleSystemModule: (moduleKey: keyof SystemModuleConfig, force?: boolean) => void
  switchUser: (userId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotification: (id: string) => void
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      users: INITIAL_USERS,
      systemModules: DEFAULT_SYSTEM_MODULES,
      notifications: INITIAL_NOTIFICATIONS,

      login: (user, token) => {
        // Solo se agrega si no existe; NUNCA se sobreescribe el registro de otra cuenta
        const currentUsers = get().users
        const exists = currentUsers.find((u) => u.id === user.id)
        const updatedUsers = exists ? currentUsers : [...currentUsers, user]
        set({ user: exists ?? user, token, isAuthenticated: true, users: updatedUsers })
        db.users.sync(updatedUsers)
        // Cada cuenta ve solo sus propios cursos: reiniciar selección y refrescar listas
        useAppStore.getState().setSelectedCourse(null)
        notifyCoursesChanged()
      },

      logout: () => {
        storage.remove('auth')
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('classflow-auth-v3')
            localStorage.removeItem('classflow-auth-v2')
          } catch {}
        }
        set({ user: null, token: null, isAuthenticated: false })
        useAppStore.getState().setSelectedCourse(null)
        notifyCoursesChanged()
      },

      setUsers: (users) => {
        const cur = get().user
        if (cur) {
          // La sesión se toma SOLO del registro con el mismo id (nunca se mezcla con otra cuenta)
          const freshCur = users.find((u) => u.id === cur.id)
          set({ users, user: freshCur ?? cur })
        } else {
          set({ users })
        }
      },

      updateUser: (data) => {
        const cur = get().user
        if (!cur) return
        const updated = { ...cur, ...data, id: cur.id, updatedAt: Date.now() }
        const updatedUsers = get().users.map((u) => (u.id === cur.id ? updated : u))
        set({ user: updated, users: updatedUsers })
        db.users.sync(updatedUsers)
      },

      createUser: (data) => {
        const newUser: User = {
          ...data,
          id: `u-${Date.now()}`,
          active: data.active ?? true,
          createdAt: new Date().toISOString(),
        }
        const updatedUsers = [...get().users, newUser]
        set({ users: updatedUsers })
        db.users.sync(updatedUsers)
        return newUser
      },

      updateUserById: (id, data) => {
        const stamp = Date.now()
        const updatedUsers = get().users.map((u) => (u.id === id ? { ...u, ...data, id, updatedAt: stamp } : u))
        const cur = get().user
        const updatedCurrent = cur && cur.id === id ? { ...cur, ...data, id, updatedAt: stamp } : cur
        set({ users: updatedUsers, user: updatedCurrent })
        db.users.sync(updatedUsers)
      },

      deleteUser: (id) => {
        const cur = get().user
        if (cur?.id === id) return false // Prevent deleting yourself
        const updatedUsers = get().users.filter((u) => u.id !== id)
        set({ users: updatedUsers })
        db.users.sync(updatedUsers, [id])
        return true
      },

      toggleSystemModule: (moduleKey, force) => {
        set((s) => ({
          systemModules: {
            ...s.systemModules,
            [moduleKey]: force !== undefined ? force : !s.systemModules[moduleKey],
          },
        }))
      },

      switchUser: (userId) => {
        const target = get().users.find((u) => u.id === userId)
        if (target) {
          set({ user: target, isAuthenticated: true })
        }
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }))
      },

      markAllNotificationsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }))
      },

      clearNotification: (id) => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }))
      },

      addNotification: (notif) => {
        const newNotif: AppNotification = {
          ...notif,
          id: `notif-${Date.now()}`,
          timestamp: 'Justo ahora',
          read: false,
        }
        set((s) => ({
          notifications: [newNotif, ...s.notifications],
        }))
      },
    }),
    {
      name: 'classflow-auth-v3',
    }
  )
)

// Sincronizar usuarios cuando lleguen desde el servidor central / base de datos
onUsersSync((syncedUsers) => {
  if (Array.isArray(syncedUsers) && syncedUsers.length > 0) {
    useAuthStore.getState().setUsers(syncedUsers)
  }
})

// ─── App UI State ─────────────────────────────────────────────
interface AppState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  selectedCourseId: string | null
  toggleTheme: () => void
  toggleSidebar: () => void
  setMobileSidebar: (open: boolean) => void
  setSelectedCourse: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      selectedCourseId: 'c1',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
      setSelectedCourse: (id) => set({ selectedCourseId: id }),
    }),
    { name: 'classflow-app', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, selectedCourseId: s.selectedCourseId }) }
  )
)

// ─── Toast State ──────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info'
export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// ─── Toast helper ─────────────────────────────────────────────
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message }),
}
