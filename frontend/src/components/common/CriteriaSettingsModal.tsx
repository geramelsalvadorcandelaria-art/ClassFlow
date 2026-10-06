import React, { useState, useEffect } from 'react'
import { Modal, Button, Badge } from '@/components/ui'
import {
  getCriteriaWeights, saveCriteriaWeights, resetCriteriaWeights,
  getCriteriaConfig, CriteriaCategoryKey, CriteriaCategoryInfo
} from '@/lib/utils'
import { toast } from '@/store'
import { Calculator, CheckCircle2, AlertTriangle, RotateCcw, SlidersHorizontal, Info } from 'lucide-react'

interface CriteriaSettingsModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  onSaved?: () => void
}

export function CriteriaSettingsModal({ isOpen, open, onClose, onSaved }: CriteriaSettingsModalProps) {
  const show = isOpen ?? open ?? false
  const [weights, setWeights] = useState<Record<CriteriaCategoryKey, number>>({
    exam: 30,
    task: 30,
    participation: 20,
    attitude: 20,
  })

  // Cargar pesos actuales al abrir el modal
  useEffect(() => {
    if (show) {
      setWeights(getCriteriaWeights())
    }
  }, [show])

  const criteriaConfig = getCriteriaConfig()
  const categories = Object.values(criteriaConfig)

  const currentTotal = Object.values(weights).reduce((acc, v) => acc + (Number(v) || 0), 0)
  const isValidTotal = currentTotal === 100

  const handleChange = (key: CriteriaCategoryKey, valStr: string) => {
    const parsed = parseFloat(valStr)
    const val = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, Math.round(parsed)))
    setWeights((prev) => ({ ...prev, [key]: val }))
  }

  const handleReset = () => {
    const defaults = resetCriteriaWeights()
    setWeights(defaults)
    toast.info('Valores restablecidos', 'Se aplicó la configuración por defecto (30/30/20/20)')
    onSaved?.()
  }

  const handleSave = () => {
    if (!isValidTotal) {
      toast.error('Suma inválida', `Los criterios deben sumar exactamente 100 puntos (actual: ${currentTotal} pts)`)
      return
    }

    saveCriteriaWeights(weights)
    toast.success('Ponderaciones guardadas', 'La fórmula se aplicó a todas las calificaciones y períodos')
    onSaved?.()
    onClose()
  }

  // Simulación didáctica basada en los valores actuales
  const simExams = weights.exam || 0
  const simPointsPerExam = (simExams / 3).toFixed(1)
  const simSampleAporte = ((85 / 100) * (simExams / 3)).toFixed(1)

  return (
    <Modal
      open={show}
      onClose={onClose}
      title="Ajustar Criterios y Ponderaciones"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Banner Explicativo de la Fórmula */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Calculator size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Fórmula Matemática Activa:</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-[11px] leading-relaxed pt-1">
            <div className="p-2 rounded bg-white/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30">
              <strong className="block text-blue-800 dark:text-blue-300">1. Puntos por Actividad:</strong>
              <code>Puntos = Peso del Criterio ÷ Cantidad de Actividades</code>
            </div>
            <div className="p-2 rounded bg-white/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30">
              <strong className="block text-blue-800 dark:text-blue-300">2. Aporte de la Nota:</strong>
              <code>Aporte = (Nota / 100) × Puntos por Actividad</code>
            </div>
          </div>
        </div>

        {/* Formulario de Criterios */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-muted)] px-1">
            <span>Criterio de Evaluación</span>
            <span>Puntos Asignados (de 100)</span>
          </div>

          {categories.map((cat) => {
            const val = weights[cat.key] ?? 0
            return (
              <div
                key={cat.key}
                className="flex items-center justify-between p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: `${cat.color}40`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <div className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                      {cat.name}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        {cat.key === 'exam' && 'Pruebas y Quices'}
                        {cat.key === 'task' && 'Tareas, Trabajos y Proyectos'}
                        {cat.key === 'participation' && 'Desempeño en clase'}
                        {cat.key === 'attitude' && 'Convivencia y Valores'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                      {val > 0 ? (
                        <span>
                          Si programas 2 actividades, cada una aportará <strong>{(val / 2).toFixed(1)} pts</strong>
                        </span>
                      ) : (
                        <span>Sin puntos asignados</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={val}
                      onChange={(e) => handleChange(cat.key, e.target.value)}
                      className="w-20 h-9 px-2 text-center text-sm font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none tabular-nums"
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-muted)] w-8">pts</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Suma y Validador en Tiempo Real */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-colors ${
            isValidTotal
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300'
              : 'bg-amber-50/80 border-amber-300 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isValidTotal ? (
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            )}
            <span>
              {isValidTotal
                ? 'Distribución equilibrada: Total 100 puntos'
                : `Total actual: ${currentTotal} / 100 puntos (Diferencia: ${100 - currentTotal > 0 ? `faltan ${100 - currentTotal}` : `sobran ${currentTotal - 100}`} pts)`}
            </span>
          </div>
          <span className="text-base font-extrabold tabular-nums">
            {currentTotal} / 100
          </span>
        </div>

        {/* Ejemplo Dinámico de Cálculo */}
        <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-muted)] flex items-start gap-2">
          <Info size={16} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Ejemplo con tu configuración:</strong> Si en {criteriaConfig.exam.name} ({simExams} pts) programas 3 evaluaciones, cada una valdrá <strong>{simPointsPerExam} pts</strong>. Un alumno con 85/100 en un examen aportará exactamente <strong className="text-[var(--color-foreground)]">{simSampleAporte} pts</strong> a su nota del período.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw size={14} />}
          >
            Restablecer (30/30/20/20)
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!isValidTotal}
              onClick={handleSave}
              leftIcon={<CheckCircle2 size={15} />}
            >
              Guardar y Aplicar Fórmula
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
