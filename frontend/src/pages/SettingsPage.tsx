import React, { useState, useRef, useEffect } from 'react'
import {
  Settings, User as UserIcon, Bell, Shield, Palette, Database,
  Users, Plus, Trash2, Edit3, Check, CheckCheck, Upload, Image,
  ShieldCheck, RefreshCw, KeyRound, Smartphone, Lock, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Download, UserCheck, ToggleLeft, ToggleRight
} from 'lucide-react'
import { Card, PageHeader, Button, Input, Select, Modal, ConfirmDialog, Badge } from '@/components/ui'
import { useAuthStore, useAppStore, toast } from '@/store'
import type { User, UserRole, SystemModuleConfig } from '@/types'
import { cn } from '@/lib/utils'
import { db } from '@/lib/mockData'

type TabType = 'profile' | 'users' | 'notifications' | 'appearance' | 'security' | 'data'

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
]

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  teacher: 'Profesor',
  coordinator: 'Coordinador',
  student: 'Estudiante',
}

const MODULE_DEFINITIONS: Array<{ key: keyof SystemModuleConfig; name: string; desc: string }> = [
  { key: 'courses', name: 'Mis Cursos', desc: 'Gestión y creación de asignaturas, grupos y horarios' },
  { key: 'students', name: 'Estudiantes', desc: 'Directorio de alumnos, matrículas y perfiles individuales' },
  { key: 'attendance', name: 'Pase de Asistencia', desc: 'Registro diario de asistencia, tardanzas y justificaciones' },
  { key: 'grades', name: 'Calificaciones y Planilla', desc: 'Control de notas por período con ponderación automática' },
  { key: 'exams', name: 'Exámenes y Evaluaciones', desc: 'Creación de pruebas, tareas y criterios ponderados' },
  { key: 'reports', name: 'Reportes y Estadísticas', desc: 'Análisis de rendimiento, gráficos y estudiantes en riesgo' },
]

// ─── Componente Aislado para Editar Perfil (Garantiza independencia por usuario) ───
function ProfileEditForm({
  currentUser,
  onSave,
}: {
  currentUser: User
  onSave: (data: Partial<User>) => void
}) {
  const [name, setName] = useState(currentUser.name ?? '')
  const [email, setEmail] = useState(currentUser.email ?? '')
  const [phone, setPhone] = useState(currentUser.phone ?? '')
  const [dept, setDept] = useState(currentUser.department ?? '')
  const [photo, setPhoto] = useState(currentUser.photo ?? '')
  const [showAvatarPresets, setShowAvatarPresets] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar inmediatamente los campos si el usuario activo cambia o se actualiza desde el servidor
  useEffect(() => {
    setName(currentUser.name ?? '')
    setEmail(currentUser.email ?? '')
    setPhone(currentUser.phone ?? '')
    setDept(currentUser.department ?? '')
    setPhoto(currentUser.photo ?? '')
  }, [currentUser.id, currentUser.name, currentUser.email, currentUser.phone, currentUser.department, currentUser.photo])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Archivo no válido', 'Por favor selecciona una imagen (JPG, PNG, WebP)')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPhoto(dataUrl)
      onSave({ photo: dataUrl })
      toast.success('Foto de perfil actualizada', 'Tu nueva imagen ha sido cargada con éxito')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Campos obligatorios', 'El nombre y correo electrónico son requeridos')
      return
    }

    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: dept.trim(),
      photo,
    })

    toast.success('Perfil actualizado', `Los datos de "${name.trim()}" han sido guardados correctamente`)
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[var(--color-border)]">
        <div>
          <h2 className="font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
            Información del perfil
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Estás editando exclusivamente tu cuenta: <strong className="text-[var(--color-foreground)]">{currentUser.name}</strong>
          </p>
        </div>
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full',
          currentUser.role === 'admin'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
        )}>
          {ROLE_LABELS[currentUser.role] ?? currentUser.role} • Sesión activa
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo and Identity */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
          <div className="relative group">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="w-20 h-20 rounded-full object-cover border-2 border-[var(--color-primary)] shadow-md"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
                style={{ background: currentUser.role === 'admin' ? '#7C3AED' : 'var(--color-primary)' }}
              >
                {name.charAt(0) || 'U'}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] cursor-pointer"
              title="Subir foto desde archivo"
            >
              <Upload size={16} />
              <span>Cambiar</span>
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div>
              <h3 className="font-semibold text-base">{name || 'Usuario'}</h3>
              <p className="text-xs text-[var(--color-muted)]">{email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={14} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Subir foto
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Image size={14} />}
                onClick={() => setShowAvatarPresets((p) => !p)}
              >
                Elegir avatar
              </Button>

              {photo && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto('')
                    onSave({ photo: '' })
                    toast.info('Foto eliminada', 'Se restableció el avatar con iniciales')
                  }}
                  className="btn btn-ghost btn-sm text-red-500 hover:text-red-600"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preset Avatars Selector */}
        {showAvatarPresets && (
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] space-y-3 animate-in fade-in">
            <p className="text-xs font-semibold text-[var(--color-muted)]">
              Selecciona un avatar prediseñado para tu perfil:
            </p>
            <div className="flex flex-wrap gap-3">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPhoto(url)
                    onSave({ photo: url })
                    setShowAvatarPresets(false)
                    toast.success('Foto de perfil actualizada')
                  }}
                  className={cn(
                    'w-12 h-12 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer',
                    photo === url ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/40' : 'border-transparent'
                  )}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Teléfono de contacto"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Departamento / Área"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </Card>
  )
}

export default function SettingsPage() {
  const {
    user, updateUser, users, createUser, updateUserById, deleteUser,
    systemModules, toggleSystemModule, switchUser, notifications,
    markAllNotificationsRead, clearNotification, addNotification
  } = useAuthStore()
  const { theme, toggleTheme } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // User Management State
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('teacher')
  const [newUserDept, setNewUserDept] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null)

  // Edit Existing User Modal (Allows editing Pedro without switching session)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('teacher')
  const [editDept, setEditDept] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPassword, setEditPassword] = useState('')

  // Security tab state
  const [currPassword, setCurrPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Notification Preferences
  const [notifRiskAlerts, setNotifRiskAlerts] = useState(true)
  const [notifAttendanceAlerts, setNotifAttendanceAlerts] = useState(true)
  const [notifDeadlines, setNotifDeadlines] = useState(true)
  const [notifEmailDigest, setNotifEmailDigest] = useState('daily')

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error('Campos incompletos', 'Nombre y correo son requeridos')
      return
    }

    const emailTrimmed = newUserEmail.trim().toLowerCase()
    const alreadyExists = users.some((u) => u.email.trim().toLowerCase() === emailTrimmed)
    if (alreadyExists) {
      toast.error('Correo ya registrado', 'Ya existe un usuario con este correo electrónico.')
      return
    }

    const created = createUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      department: newUserDept.trim() || 'Académico',
      phone: newUserPhone.trim() || '+1 (555) 000-0000',
      active: true,
      photo: '',
      password: newUserPassword.trim() || 'demo1234',
    })

    // Immediately activate the newly created user as the current active session
    switchUser(created.id)

    toast.success('Usuario creado y activado', `${created.name} ha sido registrado como ${ROLE_LABELS[created.role]} y activado como sesión actual`)
    setCreateUserModalOpen(false)
    setNewUserName('')
    setNewUserEmail('')
    setNewUserPassword('')
    setNewUserDept('')
    setNewUserPhone('')
  }

  // Handle Delete User Confirmation
  const confirmDeleteUser = () => {
    if (!deleteTargetUser) return
    const success = deleteUser(deleteTargetUser.id)
    if (success) {
      toast.success('Usuario eliminado', `El usuario ${deleteTargetUser.name} ha sido removido del sistema`)
    } else {
      toast.error('Operación no permitida', 'No puedes eliminar la cuenta que estás usando actualmente')
    }
    setDeleteTargetUser(null)
  }

  // Handle Password Update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currPassword) {
      toast.error('Error', 'Ingresa tu contraseña actual')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Contraseña débil', 'La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Error de coincidencia', 'Las nuevas contraseñas no coinciden')
      return
    }

    if (user) {
      updateUserById(user.id, { password: newPassword })
    }

    setCurrPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Contraseña actualizada', 'Tu clave de acceso ha sido cambiada exitosamente')
  }

  // Handle Save Edited User in Directory Modal
  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return
    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Campos obligatorios', 'El nombre y correo son requeridos')
      return
    }

    const emailTaken = users.some(
      (u) => u.id !== userToEdit.id && u.email.trim().toLowerCase() === editEmail.trim().toLowerCase()
    )
    if (emailTaken) {
      toast.error('Correo duplicado', 'Ya existe otra cuenta registrada con ese correo electrónico')
      return
    }

    const payload: Partial<User> = {
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      department: editDept.trim(),
      phone: editPhone.trim(),
    }
    if (editPassword.trim()) {
      payload.password = editPassword.trim()
    }

    updateUserById(userToEdit.id, payload)
    toast.success('Usuario actualizado', `Los datos de "${editName.trim()}" fueron actualizados correctamente`)
    setEditUserModalOpen(false)
    setUserToEdit(null)
  }

  // Trigger test notification
  const handleSendTestNotification = () => {
    addNotification({
      title: 'Notificación de prueba',
      message: 'Las alertas del sistema y avisos de evaluaciones están funcionando correctamente.',
      type: 'info',
      link: '/settings',
    })
    toast.info('Notificación enviada', 'Revisa la campana en la barra superior')
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Personaliza tu cuenta, administra funciones y gestiona usuarios del sistema"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <Card padding="sm" className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'nav-item w-full text-left font-medium transition-colors',
                activeTab === 'profile' && 'active'
              )}
            >
              <UserIcon size={16} /> <span>Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                'nav-item w-full text-left font-medium transition-colors flex items-center justify-between',
                activeTab === 'users' && 'active'
              )}
            >
              <div className="flex items-center gap-2">
                <Users size={16} /> <span>Usuarios y Funciones</span>
              </div>
              <span className="badge badge-primary text-[9px] px-1.5 py-0 uppercase">Admin</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                'nav-item w-full text-left font-medium transition-colors',
                activeTab === 'notifications' && 'active'
              )}
            >
              <Bell size={16} /> <span>Notificaciones</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={cn(
                'nav-item w-full text-left font-medium transition-colors',
                activeTab === 'appearance' && 'active'
              )}
            >
              <Palette size={16} /> <span>Apariencia</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                'nav-item w-full text-left font-medium transition-colors',
                activeTab === 'security' && 'active'
              )}
            >
              <Shield size={16} /> <span>Seguridad</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={cn(
                'nav-item w-full text-left font-medium transition-colors',
                activeTab === 'data' && 'active'
              )}
            >
              <Database size={16} /> <span>Datos y Respaldos</span>
            </button>
          </Card>

          {/* Quick role switcher info card */}
          <div className="mt-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
              <ShieldCheck size={16} className="text-[var(--color-primary)]" />
              <span>Rol actual: {ROLE_LABELS[user?.role ?? 'teacher']}</span>
            </div>
            <p className="text-[var(--color-muted)] leading-relaxed">
              En la pestaña <strong>Usuarios y Funciones</strong> puedes habilitar o deshabilitar módulos del sistema y crear cuentas adicionales.
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: PERFIL - Totalmente aislado por usuario */}
          {activeTab === 'profile' && user && (
            <ProfileEditForm
              key={user.id}
              currentUser={user}
              onSave={(data) => updateUserById(user.id, data)}
            />
          )}

          {/* TAB 2: USUARIOS Y CONTROL DE FUNCIONES (Super Admin Panel) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Module Toggles Header */}
              <Card>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                      Habilitar / Deshabilitar Funciones del Sistema
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      Activa o suspende funciones globalmente. Los cambios se reflejan inmediatamente en la barra de navegación.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MODULE_DEFINITIONS.map((mod) => {
                    const isEnabled = systemModules[mod.key] !== false
                    return (
                      <div
                        key={mod.key}
                        className={cn(
                          'p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3',
                          isEnabled
                            ? 'bg-[var(--color-card)] border-[var(--color-border)]'
                            : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 opacity-75'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-sm block">{mod.name}</span>
                            <span className="text-[11px] text-[var(--color-muted)] line-clamp-2 mt-0.5">
                              {mod.desc}
                            </span>
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                            isEnabled
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          )}>
                            {isEnabled ? 'Activo' : 'Pausado'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                          <span className="text-xs font-medium text-[var(--color-muted)]">
                            {isEnabled ? 'Módulo visible' : 'Módulo oculto'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              toggleSystemModule(mod.key)
                              toast.info(
                                isEnabled ? `Módulo ${mod.name} pausado` : `Módulo ${mod.name} habilitado`,
                                isEnabled ? 'Oculto para los usuarios regulares' : 'Disponible en la navegación'
                              )
                            }}
                            className={cn(
                              'relative inline-flex items-center w-11 h-6 rounded-full transition-colors cursor-pointer',
                              isEnabled ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                            )}
                            role="switch"
                            aria-checked={isEnabled}
                          >
                            <span
                              className={cn(
                                'w-4 h-4 bg-white rounded-full shadow-md transition-transform',
                                isEnabled ? 'translate-x-6' : 'translate-x-1'
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Users Directory */}
              <Card>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                      Gestión de Usuarios del Sistema
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      Crea usuarios, asigna roles y cambia entre cuentas para comprobar permisos.
                    </p>
                  </div>

                  <Button
                    leftIcon={<Plus size={16} />}
                    onClick={() => setCreateUserModalOpen(true)}
                  >
                    Nuevo usuario
                  </Button>
                </div>

                {/* Users List */}
                <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                  {users.map((u) => {
                    const isCurrent = user?.id === u.id
                    return (
                      <div
                        key={u.id}
                        className={cn(
                          'p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
                          isCurrent ? 'bg-[var(--color-primary-light)]/30' : 'hover:bg-[var(--color-bg-secondary)]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {u.photo ? (
                            <img
                              src={u.photo}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover border border-[var(--color-border)]"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm"
                              style={{ background: u.role === 'admin' ? '#7C3AED' : 'var(--color-primary)' }}
                            >
                              {u.name.charAt(0)}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{u.name}</span>
                              {isCurrent && (
                                <span className="badge badge-success text-[10px] py-0 px-1.5 font-bold">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--color-muted)]">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              )}>
                                {ROLE_LABELS[u.role] ?? u.role}
                              </span>
                              {u.department && (
                                <span className="text-[10px] text-[var(--color-muted)]">
                                  • {u.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Botón para editar este usuario de forma independiente */}
                          <button
                            type="button"
                            onClick={() => {
                              setUserToEdit(u)
                              setEditName(u.name)
                              setEditEmail(u.email)
                              setEditRole(u.role)
                              setEditDept(u.department ?? '')
                              setEditPhone(u.phone ?? '')
                              setEditPassword('')
                              setEditUserModalOpen(true)
                            }}
                            className="btn btn-ghost btn-icon text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/50 rounded-lg p-2 transition-colors cursor-pointer"
                            title={`Editar perfil de ${u.name}`}
                          >
                            <Edit3 size={16} />
                          </button>

                          {!isCurrent ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<UserCheck size={14} />}
                              onClick={() => {
                                switchUser(u.id)
                                toast.success(`Sesión cambiada`, `Ahora estás usando ClassFlow como ${u.name}`)
                              }}
                            >
                              Usar cuenta
                            </Button>
                          ) : (
                            <span className="text-xs font-medium text-[var(--color-primary)] px-2">
                              Sesión activa
                            </span>
                          )}

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetUser(u)}
                              className="btn btn-ghost btn-icon text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg p-2 transition-colors cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: NOTIFICACIONES */}
          {activeTab === 'notifications' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                    Preferencias de Notificaciones
                  </h2>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Configura qué alertas deseas recibir en el sistema y por correo.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Bell size={14} />}
                  onClick={handleSendTestNotification}
                >
                  Probar alerta
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)]">
                  <div>
                    <p className="font-medium text-sm">Alumnos en riesgo académico</p>
                    <p className="text-xs text-[var(--color-muted)]">Avisar cuando un estudiante tenga promedio inferior al 70%</p>
                  </div>
                  <button
                    onClick={() => setNotifRiskAlerts((p) => !p)}
                    className={cn(
                      'relative inline-flex items-center w-11 h-6 rounded-full transition-colors cursor-pointer',
                      notifRiskAlerts ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                    )}
                    role="switch"
                    aria-checked={notifRiskAlerts}
                  >
                    <span className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', notifRiskAlerts ? 'translate-x-6' : 'translate-x-1')} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)]">
                  <div>
                    <p className="font-medium text-sm">Alertas de baja asistencia</p>
                    <p className="text-xs text-[var(--color-muted)]">Notificar si la asistencia de un curso o alumno cae bajo el 80%</p>
                  </div>
                  <button
                    onClick={() => setNotifAttendanceAlerts((p) => !p)}
                    className={cn(
                      'relative inline-flex items-center w-11 h-6 rounded-full transition-colors cursor-pointer',
                      notifAttendanceAlerts ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                    )}
                    role="switch"
                    aria-checked={notifAttendanceAlerts}
                  >
                    <span className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', notifAttendanceAlerts ? 'translate-x-6' : 'translate-x-1')} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)]">
                  <div>
                    <p className="font-medium text-sm">Recordatorios de evaluaciones</p>
                    <p className="text-xs text-[var(--color-muted)]">Avisos 48h antes de fechas de exámenes y entregas</p>
                  </div>
                  <button
                    onClick={() => setNotifDeadlines((p) => !p)}
                    className={cn(
                      'relative inline-flex items-center w-11 h-6 rounded-full transition-colors cursor-pointer',
                      notifDeadlines ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                    )}
                    role="switch"
                    aria-checked={notifDeadlines}
                  >
                    <span className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', notifDeadlines ? 'translate-x-6' : 'translate-x-1')} />
                  </button>
                </div>

                {/* History Header */}
                <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Historial reciente ({notifications.length})</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <CheckCheck size={14} /> Marcar todas como leídas
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] overflow-hidden max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className={cn('font-semibold', !n.read && 'text-[var(--color-primary)]')}>
                          {n.title}
                        </p>
                        <p className="text-[var(--color-muted)]">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-[var(--color-muted)] flex-shrink-0">{n.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: APARIENCIA */}
          {activeTab === 'appearance' && (
            <Card>
              <h2 className="font-semibold mb-4 text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                Apariencia y Tema
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-semibold text-sm">Modo oscuro</p>
                    <p className="text-xs text-[var(--color-muted)]">Alterna entre la paleta clara y oscura para descanso visual</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={cn(
                      'relative inline-flex items-center w-12 h-6 rounded-full transition-colors cursor-pointer',
                      theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                    )}
                    role="switch"
                    aria-checked={theme === 'dark'}
                  >
                    <span className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', theme === 'dark' ? 'translate-x-7' : 'translate-x-1')} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-muted)] mb-2">
                    Acento de Marca y Color Principal
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Azul Real (Default)', color: '#2563EB' },
                      { name: 'Índigo ClassFlow', color: '#4F46E5' },
                      { name: 'Esmeralda', color: '#059669' },
                      { name: 'Púrpura Directivo', color: '#7C3AED' },
                    ].map((accent, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          document.documentElement.style.setProperty('--color-primary', accent.color)
                          toast.success('Color aplicado', accent.name)
                        }}
                        className="p-3 rounded-xl border border-[var(--color-border)] flex items-center gap-2 hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer text-left"
                      >
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: accent.color }} />
                        <span className="text-xs font-medium truncate">{accent.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 5: SEGURIDAD */}
          {activeTab === 'security' && (
            <Card>
              <h2 className="font-semibold mb-4 text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                Seguridad de la cuenta
              </h2>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <Input
                  label="Contraseña actual"
                  type={showPass ? 'text' : 'password'}
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  required
                />

                <Input
                  label="Nueva contraseña"
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />

                <Input
                  label="Confirmar nueva contraseña"
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                />

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="showPass"
                    checked={showPass}
                    onChange={(e) => setShowPass(e.target.checked)}
                    className="rounded border-[var(--color-border)]"
                  />
                  <label htmlFor="showPass" className="text-xs text-[var(--color-muted)] cursor-pointer">
                    Mostrar contraseñas
                  </label>
                </div>

                <div className="pt-2">
                  <Button type="submit">Actualizar contraseña</Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 6: DATOS */}
          {activeTab === 'data' && (
            <Card>
              <h2 className="font-semibold mb-4 text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                Gestión de Datos y Copias de Seguridad
              </h2>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">Exportar Respaldo Completo</p>
                    <p className="text-xs text-[var(--color-muted)]">Descarga un archivo JSON con todos los cursos, alumnos y notas</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download size={14} />}
                    onClick={() => {
                      const data = {
                        users,
                        systemModules,
                        date: new Date().toISOString(),
                      }
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `ClassFlow_Backup_${new Date().toISOString().split('T')[0]}.json`
                      a.click()
                      toast.success('Copia descargada', 'Tu archivo de respaldo ha sido generado')
                    }}
                  >
                    Descargar JSON
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--color-bg-secondary)]/30">
                  <div>
                    <p className="font-medium text-sm">Restaurar Copia de Seguridad</p>
                    <p className="text-xs text-[var(--color-muted)]">Carga un archivo de respaldo JSON (como ClassFlow_Backup.json) para restaurar perfiles y datos</p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      id="restore-backup-file-input"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          try {
                            const parsed = JSON.parse(ev.target?.result as string)
                            if (parsed && Array.isArray(parsed.users)) {
                              const currentUsers = useAuthStore.getState().users
                              const merged = [...currentUsers]
                              parsed.users.forEach((u: User) => {
                                const idx = merged.findIndex((m) => m.id === u.id)
                                if (idx >= 0) {
                                  merged[idx] = { ...merged[idx], ...u }
                                } else {
                                  merged.push(u)
                                }
                              })
                              useAuthStore.getState().setUsers(merged)
                              db.users.sync(merged)
                              if (user) {
                                const freshUser = merged.find((m) => m.id === user.id)
                                if (freshUser) {
                                  useAuthStore.getState().updateUser(freshUser)
                                }
                              }
                              toast.success('Respaldo restaurado', 'Los datos del perfil y usuarios se han restaurado con éxito')
                            } else {
                              toast.error('Formato no reconocido', 'El archivo no contiene un formato de respaldo válido de ClassFlow')
                            }
                          } catch (err) {
                            toast.error('Error al restaurar', 'No se pudo leer el archivo JSON seleccionado')
                          }
                        }
                        reader.readAsText(file)
                        e.target.value = ''
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Upload size={14} />}
                      onClick={() => document.getElementById('restore-backup-file-input')?.click()}
                    >
                      Restaurar JSON
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Crear Nuevo Usuario */}
      <Modal
        open={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        title="Registrar Nuevo Usuario"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Nombre completo"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Ej: Ing. Roberto Mendoza"
            required
          />

          <Input
            label="Correo electrónico"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="usuario@classflow.com"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--color-foreground)]">
                Rol en el sistema
              </label>
              <select
                className="form-select text-sm w-full"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              >
                <option value="teacher">Profesor</option>
                <option value="admin">Administrador (Control total)</option>
                <option value="coordinator">Coordinador Académico</option>
                <option value="student">Estudiante</option>
              </select>
            </div>

            <Input
              label="Departamento"
              value={newUserDept}
              onChange={(e) => setNewUserDept(e.target.value)}
              placeholder="Ej: Matemáticas"
            />
          </div>

          <Input
            label="Contraseña inicial"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setCreateUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Usuario Existente (Independiente) */}
      <Modal
        open={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title={`Editar Usuario: ${userToEdit?.name}`}
      >
        {userToEdit && (
          <form onSubmit={handleSaveEditedUser} className="space-y-4">
            <Input
              label="Nombre completo"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            <Input
              label="Correo electrónico"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-foreground)]">
                  Rol en el sistema
                </label>
                <select
                  className="form-select text-sm w-full"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                >
                  <option value="teacher">Profesor</option>
                  <option value="admin">Administrador (Control total)</option>
                  <option value="coordinator">Coordinador Académico</option>
                  <option value="student">Estudiante</option>
                </select>
              </div>

              <Input
                label="Departamento"
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                placeholder="Ej: Matemáticas"
              />
            </div>

            <Input
              label="Teléfono"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />

            <Input
              label="Nueva contraseña (dejar en blanco para conservar la actual)"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setEditUserModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Dialog: Eliminar Usuario */}
      <ConfirmDialog
        open={!!deleteTargetUser}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={confirmDeleteUser}
        title="Eliminar usuario"
        message={`¿Estás seguro de que deseas eliminar a "${deleteTargetUser?.name}"? Esta acción removerá sus accesos al sistema.`}
        confirmLabel="Eliminar usuario"
        danger
      />
    </>
  )
}
