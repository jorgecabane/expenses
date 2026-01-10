'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { 
  generateQuickRecurrenceOptions, 
  formatRecurrenceConfig,
  type RecurringConfig,
  type QuickRecurrenceOption 
} from '@/lib/recurrence'
import RecurrenceCustomizer from './RecurrenceCustomizer'

interface RecurrenceSelectorProps {
  selectedDate: Date
  value: RecurringConfig | null
  onChange: (config: RecurringConfig | null) => void
}

export default function RecurrenceSelector({
  selectedDate,
  value,
  onChange,
}: RecurrenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  
  const quickOptions = generateQuickRecurrenceOptions(selectedDate)
  
  // Determinar qué opción está seleccionada
  const getSelectedOptionValue = () => {
    if (!value) return null
    if (value.type === 'custom') return 'custom'
    if (value.type === 'daily') return 'daily'
    if (value.type === 'weekly') return 'weekly'
    if (value.type === 'monthly') {
      // Verificar si es ordinal o día específico
      if (typeof value.days === 'object' && 'ordinal' in value.days) {
        return 'monthly_ordinal'
      }
      return 'monthly'
    }
    if (value.type === 'yearly') return 'yearly'
    return null
  }
  
  const selectedOptionValue = getSelectedOptionValue()

  const handleSelectOption = (option: QuickRecurrenceOption) => {
    if (option.value === 'custom') {
      setShowCustomizer(true)
      setIsOpen(false)
    } else {
      onChange(option.config)
      setIsOpen(false)
    }
  }

  const handleCustomSave = (config: RecurringConfig) => {
    onChange(config)
    setShowCustomizer(false)
  }

  const handleRemove = () => {
    onChange(null)
    setIsOpen(false)
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-slate-800 border border-slate-600 rounded-xl py-3 px-4 text-left hover:border-slate-500 transition-colors"
        >
          <div className="flex-1 min-w-0">
            {value ? (
              <div>
                <p className="text-white font-medium text-sm">
                  {formatRecurrenceConfig(value)}
                </p>
                {value.isPaused && (
                  <p className="text-slate-400 text-xs mt-0.5">Pausado</p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No se repite</p>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
          )}
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
            <div className="divide-y divide-slate-700/50">
              {quickOptions.map((option) => {
                const isSelected = option.value === selectedOptionValue
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
              
              {value && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Eliminar recurrencia
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showCustomizer && (
        <RecurrenceCustomizer
          open={showCustomizer}
          onOpenChange={setShowCustomizer}
          selectedDate={selectedDate}
          initialConfig={value || undefined}
          onSave={handleCustomSave}
        />
      )}
    </>
  )
}
