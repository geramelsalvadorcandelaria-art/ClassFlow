import React from 'react'
import { Settings, User, Bell, Shield, Palette, Database } from 'lucide-react'
import { Card, PageHeader, Button, Input, Select } from '@/components/ui'
import { useAuthStore, useAppStore } from '@/store'
import { toast } from '@/store'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useAppStore()

  return (
    <>
      <PageHeader title="Configuración" subtitle="Personaliza tu cuenta y la aplicación" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-1">
              {[
                { icon: <User size={16} />, label: 'Perfil' },
                { icon: <Bell size={16} />, label: 'Notificaciones' },
                { icon: <Palette size={16} />, label: 'Apariencia' },
                { icon: <Shield size={16} />, label: 'Seguridad' },
                { icon: <Database size={16} />, label: 'Datos' },
              ].map((item) => (
                <button key={item.label} className="nav-item w-full text-left font-medium">
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile */}
          <Card>
            <h2 className="font-semibold mb-4 text-base" style={{ fontFamily: 'var(--font-heading)' }}>Información del perfil</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="avatar avatar-xl" style={{ background: 'var(--color-primary)', color: 'white', fontSize: 24 }}>
                  {user?.name.charAt(0) ?? 'P'}
                </div>
                <div>
                  <p className="font-semibold">{user?.name ?? 'Profesor'}</p>
                  <p className="text-sm text-[var(--color-muted)]">{user?.email ?? 'profesor@classflow.com'}</p>
                  <Button variant="secondary" size="sm" className="mt-2">Cambiar foto</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre completo" defaultValue={user?.name ?? ''} />
                <Input label="Correo electrónico" type="email" defaultValue={user?.email ?? ''} />
              </div>
              <Button onClick={() => toast.success('Perfil actualizado')}>Guardar cambios</Button>
            </div>
          </Card>

          {/* Appearance */}
          <Card>
            <h2 className="font-semibold mb-4 text-base" style={{ fontFamily: 'var(--font-heading)' }}>Apariencia</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Modo oscuro</p>
                <p className="text-xs text-[var(--color-muted)]">Cambia entre tema claro y oscuro</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                aria-label="Alternar modo oscuro"
                role="switch"
                aria-checked={theme === 'dark'}
              >
                <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </Card>

          {/* System info */}
          <Card>
            <h2 className="font-semibold mb-4 text-base" style={{ fontFamily: 'var(--font-heading)' }}>Acerca de ClassFlow</h2>
            <div className="space-y-2 text-sm text-[var(--color-muted)]">
              <div className="flex justify-between"><span>Versión</span><span className="font-medium text-[var(--color-foreground)]">1.0.0 MVP</span></div>
              <div className="flex justify-between"><span>Plataforma</span><span className="font-medium text-[var(--color-foreground)]">Web App</span></div>
              <div className="flex justify-between"><span>Soporte</span><span className="font-medium text-[var(--color-primary)]">soporte@classflow.com</span></div>
            </div>
            <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-sm text-[var(--color-primary)]">
              <p className="font-semibold">ClassFlow MVP</p>
              <p className="text-xs mt-1">Sistema de gestión académica diseñado para hacer el trabajo del profesor más rápido, organizado y efectivo.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
