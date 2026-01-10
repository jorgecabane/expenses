'use client'

import { useState, useEffect } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { 
  generateQuickRecurrenceOptions, 
  formatRecurrenceConfig,
  type RecurringConfig,
  type QuickRecurrenceOption 
} from '@/lib/recurrence'
import RecurrenceCustomizer from './RecurrenceCustomizer'

interface RecurrenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  value: RecurringConfig | null
  onSave: (config: RecurringConfig | null) => void
  isEdit?: boolean // Si es true, es edición (mostrar eliminar). Si es false/undefined, es creación
}

export default function RecurrenceModal({
  open,
  onOpenChange,
  selectedDate,
  value,
  onSave,
  isEdit = false,
}: RecurrenceModalProps) {
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [tempConfig, setTempConfig] = useState<RecurringConfig | null>(value)
  
  // Reset tempConfig cuando se abre el modal
  useEffect(() => {
    if (open) {
      setTempConfig(value)
    }
  }, [open, value])
  
  const quickOptions = generateQuickRecurrenceOptions(selectedDate)
  
  // Determinar qué opción está seleccionada
  const getSelectedOptionValue = () => {
    if (!tempConfig) return null
    if (tempConfig.type === 'custom') return 'custom'
    if (tempConfig.type === 'daily') return 'daily'
    if (tempConfig.type === 'weekly') return 'weekly'
    if (tempConfig.type === 'monthly') {
      if (typeof tempConfig.days === 'object' && 'ordinal' in tempConfig.days) {
        return 'monthly_ordinal'
      }
      return 'monthly'
    }
    if (tempConfig.type === 'yearly') return 'yearly'
    return null
  }
  
  const selectedOptionValue = getSelectedOptionValue()

  const handleSelectOption = (option: QuickRecurrenceOption) => {
    if (option.value === 'custom') {
      setShowCustomizer(true)
    } else {
      setTempConfig(option.config)
    }
  }

  const handleCustomSave = (config: RecurringConfig) => {
    setTempConfig(config)
    setShowCustomizer(false)
  }

  const handleSave = () => {
    onSave(tempConfig)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTempConfig(value) // Resetear a valor original
    onOpenChange(false)
  }

  const handleRemove = () => {
    setTempConfig(null)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleCancel}
        />
        
        {/* Modal - Full screen en mobile, centrado en desktop */}
        <div className="relative w-full max-w-md max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-white">Configurar recurrencia</h2>
              <p className="text-sm text-slate-500">Selecciona cómo se repetirá</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Opciones rápidas */}
            <div className="space-y-2">
              {quickOptions.map((option) => {
                const isSelected = option.value === selectedOptionValue
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
              
              {isEdit && tempConfig && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full text-left px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all mt-2"
                >
                  Eliminar recurrencia
                </button>
              )}
            </div>

            {/* Vista previa */}
            {tempConfig && (
              <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Vista previa</p>
                <p className="text-sm text-white font-medium">
                  {formatRecurrenceConfig(tempConfig)}
                </p>
                {tempConfig.endType === 'on_date' && tempConfig.endDate && (
                  <p className="text-xs text-slate-400 mt-1">
                    Termina el {new Date(tempConfig.endDate).toLocaleDateString('es-CL')}
                  </p>
                )}
                {tempConfig.endType === 'after' && tempConfig.endAfter && (
                  <p className="text-xs text-slate-400 mt-1">
                    Después de {tempConfig.endAfter} repeticiones
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700 flex-shrink-0">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de personalización sobrepuesto */}
      {showCustomizer && (
        <RecurrenceCustomizer
          open={showCustomizer}
          onOpenChange={setShowCustomizer}
          selectedDate={selectedDate}
          initialConfig={tempConfig || undefined}
          onSave={handleCustomSave}
        />
      )}
    </>
  )
}
