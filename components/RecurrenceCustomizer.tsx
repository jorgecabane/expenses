'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { type RecurringConfig } from '@/lib/recurrence'

interface RecurrenceCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  initialConfig?: RecurringConfig
  onSave: (config: RecurringConfig) => void
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const INTERVAL_UNITS = [
  { value: 'day', label: 'día' },
  { value: 'week', label: 'semana' },
  { value: 'month', label: 'mes' },
  { value: 'year', label: 'año' },
]

export default function RecurrenceCustomizer({
  open,
  onOpenChange,
  selectedDate,
  initialConfig,
  onSave,
}: RecurrenceCustomizerProps) {
  const [interval, setInterval] = useState(1)
  const [intervalUnit, setIntervalUnit] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [selectedDays, setSelectedDays] = useState<number[]>([selectedDate.getDay()])
  const [endType, setEndType] = useState<'never' | 'on_date' | 'after'>('never')
  const [endDate, setEndDate] = useState('')
  const [endAfter, setEndAfter] = useState(1)
  const [isUnitSelectOpen, setIsUnitSelectOpen] = useState(false)
  const unitSelectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialConfig && initialConfig.type === 'custom') {
      setInterval(initialConfig.interval || 1)
      setIntervalUnit(initialConfig.intervalUnit || 'week')
      if (Array.isArray(initialConfig.days)) {
        setSelectedDays(initialConfig.days)
      }
      setEndType(initialConfig.endType)
      setEndDate(initialConfig.endDate || '')
      setEndAfter(initialConfig.endAfter || 1)
    }
  }, [initialConfig])

  // Cerrar el select cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitSelectRef.current && !unitSelectRef.current.contains(event.target as Node)) {
        setIsUnitSelectOpen(false)
      }
    }

    if (isUnitSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUnitSelectOpen])

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const handleSave = () => {
    if (selectedDays.length === 0) {
      alert('Selecciona al menos un día')
      return
    }

    const config: RecurringConfig = {
      type: 'custom',
      interval,
      intervalUnit,
      days: selectedDays,
      endType,
      endDate: endType === 'on_date' ? endDate : undefined,
      endAfter: endType === 'after' ? endAfter : undefined,
      startDate: selectedDate.toISOString(),
    }

    onSave(config)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-visible">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-xl overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Periodicidad personalizada</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-visible">
          {/* Repetir cada */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Repetir cada
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-slate-900 border border-slate-600 rounded-xl py-2 px-3 text-white text-center focus:outline-none focus:border-emerald-500"
              />
              <div className="relative flex-1" ref={unitSelectRef}>
                <button
                  type="button"
                  onClick={() => setIsUnitSelectOpen(!isUnitSelectOpen)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl py-2 px-3 pr-10 text-white focus:outline-none focus:border-emerald-500 flex items-center justify-between"
                >
                  <span className="flex-1 text-left">{INTERVAL_UNITS.find(u => u.value === intervalUnit)?.label}</span>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUnitSelectOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isUnitSelectOpen && (
                  <div className="absolute z-[70] top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
                    {INTERVAL_UNITS.map(unit => (
                      <button
                        key={unit.value}
                        type="button"
                        onClick={() => {
                          setIntervalUnit(unit.value as any)
                          setIsUnitSelectOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          intervalUnit === unit.value
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {unit.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Se repite el */}
          {intervalUnit === 'week' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Se repite el
              </label>
              <div className="flex gap-2">
                {DAY_LABELS.map((label, index) => {
                  const dayIndex = index === 6 ? 0 : index + 1 // D = 0, L-S = 1-6
                  const isSelected = selectedDays.includes(dayIndex)
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(dayIndex)}
                      className={`flex-1 aspect-square rounded-full font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Termina */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Termina
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={endType === 'never'}
                  onChange={(e) => setEndType(e.target.value as any)}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-slate-300">Nunca</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="on_date"
                  checked={endType === 'on_date'}
                  onChange={(e) => setEndType(e.target.value as any)}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-slate-300">El</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endType !== 'on_date'}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-xl py-2 px-3 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-emerald-500"
                />
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="after"
                  checked={endType === 'after'}
                  onChange={(e) => setEndType(e.target.value as any)}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-slate-300">Después de</span>
                <input
                  type="number"
                  min="1"
                  value={endAfter}
                  onChange={(e) => setEndAfter(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={endType !== 'after'}
                  className="w-24 bg-slate-900 border border-slate-600 rounded-xl py-2 px-3 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400 text-sm">repeticiones</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Hecho
          </button>
        </div>
      </div>
    </div>
  )
}
