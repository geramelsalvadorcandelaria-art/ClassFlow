import React from 'react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// ─── Button ───────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger',
  }[variant]
  const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg', xl: 'btn-xl', icon: 'btn-icon' }[size]

  return (
    <button className={cn('btn', variantClass, sizeClass, className)} disabled={disabled || loading} {...props}>
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Input({ label, error, hint, required, leftIcon, rightIcon, className, id, ...props }: InputProps) {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}{required && <span className="required">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{leftIcon}</span>}
        <input
          id={inputId}
          className={cn('form-input', error && 'error', leftIcon && 'pl-9', rightIcon && 'pr-10', className)}
          {...props}
        />
        {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] flex items-center">{rightIcon}</span>}
      </div>
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, required, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? `select-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="form-label" htmlFor={selectId}>
          {label}{required && <span className="required">*</span>}
        </label>
      )}
      <select id={selectId} className={cn('form-select', error && 'error', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

export function Textarea({ label, error, hint, required, className, id, ...props }: TextareaProps) {
  const inputId = id ?? `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}{required && <span className="required">*</span>}
        </label>
      )}
      <textarea id={inputId} className={cn('form-textarea min-h-[80px] resize-y', error && 'error', className)} {...props} />
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────
interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'
  children: React.ReactNode
  dot?: boolean
  className?: string
}

export function Badge({ variant = 'neutral', children, dot, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────
interface AvatarProps {
  initials?: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ initials, src, size = 'md', className }: AvatarProps) {
  const sizeClass = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl' }[size]
  if (src) return <img src={src} alt={initials} className={cn('avatar', sizeClass, className)} />
  return <div className={cn('avatar', sizeClass, className)}>{initials?.slice(0, 2)}</div>
}

// ─── Card ─────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, interactive, onClick, padding = 'md' }: CardProps) {
  const padClass = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }[padding]
  return (
    <div className={cn('card', padClass, interactive && 'card-interactive', className)} onClick={onClick}>
      {children}
    </div>
  )
}

// ─── Stats Card ───────────────────────────────────────────────
interface StatsCardProps {
  icon: React.ReactNode
  iconBg?: string
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatsCard({ icon, iconBg = 'var(--color-primary-light)', label, value, trend, trendUp, className }: StatsCardProps) {
  return (
    <div className={cn('stats-card', className)}>
      <div className="flex items-start justify-between">
        <div className="stats-card-icon" style={{ background: iconBg }}>{icon}</div>
        {trend && (
          <span className={cn('stats-card-trend', trendUp ? 'text-green-600' : 'text-red-500')}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <div className="stats-card-value">{value}</div>
        <div className="stats-card-label">{label}</div>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, maxWidth = 'md', footer }: ModalProps) {
  const maxW = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }[maxWidth]
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn('modal-box w-full', maxW)}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
            <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 pt-0 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger, loading }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col gap-3 text-center py-2">
        <div className={cn('w-12 h-12 rounded-full mx-auto flex items-center justify-center', danger ? 'bg-red-100' : 'bg-yellow-100')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={danger ? '#DC2626' : '#D97706'} strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-[var(--color-muted)]">{message}</p>
        <div className="flex gap-2 mt-2 justify-center">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Loading State ────────────────────────────────────────────
export function LoadingState({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="loading-state">
      <div className="spinner spinner-lg" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div>
        <p className="font-semibold text-[var(--color-foreground)] mb-1">{title}</p>
        {description && <p className="text-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumb?: string[]
}

export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        {breadcrumb && (
          <p className="text-xs text-[var(--color-muted)] mb-1">{breadcrumb.join(' / ')}</p>
        )}
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// ─── Icon Button ──────────────────────────────────────────────
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  variant?: 'ghost' | 'secondary' | 'danger'
}

export function IconButton({ icon, label, variant = 'ghost', className, ...props }: IconButtonProps) {
  return (
    <button className={cn('btn btn-icon', `btn-${variant}`, className)} aria-label={label} title={label} {...props}>
      {icon}
    </button>
  )
}

// ─── Search Input ─────────────────────────────────────────────
interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        className="form-input pl-9 pr-4"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────
interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, color = 'var(--color-primary)', size = 'sm', showLabel, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const h = size === 'sm' ? '4px' : '8px'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: h, background: 'var(--color-border)' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 'inherit', transition: 'width 0.4s ease' }} />
      </div>
      {showLabel && <span className="text-xs text-[var(--color-muted)] w-8 text-right">{Math.round(pct)}%</span>}
    </div>
  )
}

// ─── Attendance Status Badge ──────────────────────────────────
import { attendanceLabels } from '@/lib/utils'
import type { AttendanceStatus } from '@/types'

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, 'success' | 'warning' | 'danger' | 'info'> = {
    present: 'success', late: 'warning', absent: 'danger', justified: 'info',
  }
  return <Badge variant={map[status]} dot>{attendanceLabels[status]}</Badge>
}

// ─── Grade Display ────────────────────────────────────────────
export function GradeDisplay({ grade, max = 100 }: { grade: number; max?: number }) {
  const pct = (grade / max) * 100
  const color = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-blue-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'
  return <span className={cn('font-semibold tabular-nums', color)}>{Math.round(grade)}</span>
}

// ─── Toast Container ──────────────────────────────────────────
import { useToastStore } from '@/store'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const icons = {
    success: <CheckCircle size={18} className="text-green-600 flex-shrink-0" />,
    error: <XCircle size={18} className="text-red-600 flex-shrink-0" />,
    warning: <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />,
    info: <Info size={18} className="text-blue-600 flex-shrink-0" />,
  }
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={cn('toast', `toast-${t.type}`)}>
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{t.title}</p>
            {t.message && <p className="text-xs text-[var(--color-muted)] mt-0.5">{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="btn btn-ghost btn-icon p-1" aria-label="Cerrar">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
