import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, Users, ClipboardCheck, BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/store'
import { Button, Input } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { LoginForm } from '@/types'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

const DEMO_USER = {
  id: 'u1',
  name: 'Prof. García',
  email: 'profesor@classflow.com',
  role: 'teacher' as const,
  createdAt: new Date().toISOString(),
}

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (_data: LoginForm) => {
    // Mock auth: accept any credentials
    setTimeout(() => {
      login(DEMO_USER, 'mock-jwt-token')
      navigate('/', { replace: true })
    }, 700)
  }

  const fillDemo = () => {
    setValue('email', 'profesor@classflow.com')
    setValue('password', 'demo1234')
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
        <p className="relative z-10 text-blue-300 text-xs">© 2026 ClassFlow. Todos los derechos reservados.</p>
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
          <p className="text-sm text-[var(--color-muted)] mb-6">Ingresa a tu cuenta para continuar.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              required
              error={errors.email?.message}
              placeholder="profesor@classflow.com"
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              required
              error={errors.password?.message}
              placeholder="Tu contraseña"
              {...register('password')}
            />
            <Button type="submit" size="xl" className="w-full" loading={isSubmitting}>
              Iniciar sesión
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="divider flex-1 my-0" />
            <span className="text-xs text-[var(--color-muted)]">o</span>
            <div className="divider flex-1 my-0" />
          </div>

          <button
            type="button"
            onClick={fillDemo}
            className="btn btn-secondary btn-xl w-full"
          >
            Usar cuenta de demostración
          </button>

          <p className="text-center text-xs text-[var(--color-muted)] mt-6">
            ¿No tienes cuenta?{' '}
            <span className="text-[var(--color-primary)] font-medium cursor-pointer">Solicitar acceso</span>
          </p>
        </div>
      </div>
    </div>
  )
}
