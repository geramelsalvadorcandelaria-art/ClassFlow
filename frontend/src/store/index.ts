import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { storage } from '@/lib/utils'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        storage.remove('auth')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    { name: 'classflow-auth' }
  )
)

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
