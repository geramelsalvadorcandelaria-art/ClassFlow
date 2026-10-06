import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, Users, ClipboardCheck, BarChart3, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { useAuthStore, toast } from '@/store'
import { Button, Input } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { LoginForm } from '@/types'
import { pullFromServer } from '@/lib/mockData'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  // Sincronizar automáticamente usuarios y estado central al abrir la pantalla de login
  useEffect(() => {
    pullFromServer()
  }, [])

  const onSubmit = async (data: LoginForm) => {
    // Intentar sincronizar antes de validar para asegurar que usuarios creados en otros dispositivos se reconozcan
    try {
      await pullFromServer()
    } catch {
      // Continuar con usuarios locales si no hay conexión
    }

    const currentUsers = useAuthStore.getState().users
    const inputEmail = data.email.trim().toLowerCase()
    const targetUser = currentUsers.find(
      (u) => u.email.trim().toLowerCase() === inputEmail
    )

    if (!targetUser || (targetUser.password && targetUser.password !== data.password)) {
      toast.error('Acceso denegado', 'El correo electrónico o la contraseña ingresada son incorrectos.')
      return
    }

    if (targetUser.active === false) {
      toast.error('Cuenta inactiva', 'Tu cuenta se encuentra deshabilitada. Contacta al administrador.')
      return
    }

    login(targetUser, `jwt-${targetUser.id}-${Date.now()}`)
    toast.success('Sesión iniciada', `Bienvenido(a), ${targetUser.name}`)
    navigate('/', { replace: true })
  }

  const FEATURES = [
    { icon: <BookOpen size={16} />, text: 'Gestiona múltiples cursos' },
    { icon: <Users size={16} />, text: 'Administra estudiantes' },
    { icon: <ClipboardCheck size={16} />, text: 'Pasa lista en segundos' },
    { icon: <BarChart3 size={16} />, text: 'Reportes y análisis académico' },
  ]

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 600" className="w-full h-full">
            <circle cx="350" cy="100" r="200" fill="white" />
            <circle cx="50" cy="500" r="150" fill="white" />
            <circle cx="200" cy="300" r="80" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap size={22} color="white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-heading)' }}>ClassFlow</p>
            <p className="text-blue-200 text-xs">Tu aula, organizada.</p>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Todo lo que necesitas<br />para gestionar tu aula.
          </h1>
          <p className="text-blue-100 text-base mb-8">
            Pasa lista, registra notas, revisa reportes — todo desde un solo lugar, en segundos.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-blue-100">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-blue-300 text-xs">
          <p>© 2026 ClassFlow. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1.5 opacity-80">
            <ShieldCheck size={14} />
            <span>Autenticación Segura</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col justify-center items-center p-8 bg-[var(--color-background)]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>ClassFlow</p>
              <p className="text-xs text-[var(--color-muted)]">Tu aula, organizada.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Bienvenido</h2>
          <p className="text-sm text-[var(--color-muted)] mb-6">Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              error={errors.email?.message}
              placeholder="tu-correo@ejemplo.com"
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              error={errors.password?.message}
              placeholder="Tu contraseña secreta"
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus:outline-none p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />
            <Button type="submit" size="xl" className="w-full cursor-pointer" loading={isSubmitting}>
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <Lock size={12} className="text-emerald-500" />
              <span>Acceso restringido y protegido para personal autorizado</span>
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              ¿Olvidaste tu contraseña o requieres una cuenta?{' '}
              <span className="text-[var(--color-primary)] font-medium cursor-pointer hover:underline">
                Contactar a soporte
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
