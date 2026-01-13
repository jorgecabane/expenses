'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  CheckSquare, 
  Plus, 
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Group {
  id: string
  name: string
  currency: string
  autoCreateExpensesFromReminders: boolean
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface PaymentTemplate {
  id: string
  name: string
  defaultCategoryId: string
  estimatedDay: number | null
  estimatedAmount: number | null
  category: Category
}

interface MonthlyPaymentTask {
  id: string
  templateId: string
  groupId: string
  isCompleted: boolean
  paidAmount: number | null
  paidDate: string | null
  expenseId: string | null
  lastResetAt: string | null
  template: PaymentTemplate
  completer: {
    id: string
    name: string | null
    email: string
  } | null
}

function formatCurrency(amount: number, currency: string = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export default function RemindersPage() {
  const [tasks, setTasks] = useState<MonthlyPaymentTask[]>([])
  const [templates, setTemplates] = useState<PaymentTemplate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [currency, setCurrency] = useState('CLP')
  const [autoCreateExpenses, setAutoCreateExpenses] = useState(false)
  
  // Modales
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [checkModalOpen, setCheckModalOpen] = useState(false)
  const [uncheckConfirmOpen, setUncheckConfirmOpen] = useState(false)
  const [deleteTemplateConfirmOpen, setDeleteTemplateConfirmOpen] = useState(false)
  const [taskToUncheck, setTaskToUncheck] = useState<MonthlyPaymentTask | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<MonthlyPaymentTask | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<PaymentTemplate | null>(null)
  
  // Form states
  const [templateName, setTemplateName] = useState('')
  const [templateCategoryId, setTemplateCategoryId] = useState('')
  const [templateDay, setTemplateDay] = useState<number | null>(null)
  const [paidAmount, setPaidAmount] = useState('')
  const [shouldCreateExpense, setShouldCreateExpense] = useState(false)
  const [saving, setSaving] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null)

  // Obtener grupo activo y datos iniciales
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Obtener usuario (que incluye activeGroupId) y grupos
        const [userRes, groupsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/groups'),
        ])
        
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json()
          if (groupsData.groups && groupsData.groups.length > 0) {
            let selectedGroup = groupsData.groups[0]
            
            // Si tenemos el usuario con activeGroupId, usarlo
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.user?.activeGroupId) {
                const found = groupsData.groups.find((g: Group) => g.id === userData.user.activeGroupId)
                if (found) {
                  selectedGroup = found
                }
              } else {
                // Si no hay grupo activo guardado, guardar el primero
                await fetch('/api/user', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ activeGroupId: selectedGroup.id }),
                })
              }
            }
            
            // Solo establecer el grupo - el useEffect que escucha groupId recargará los datos
            setGroupId(selectedGroup.id)
            setCurrency(selectedGroup.currency || 'CLP')
            setAutoCreateExpenses(selectedGroup.autoCreateExpensesFromReminders || false)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Cargar tareas del grupo (ahora son persistentes, no por mes)
  const loadTasks = useCallback(async (groupId: string) => {
    if (!groupId) return
    try {
      const res = await fetch(`/api/monthly-payment-tasks?groupId=${groupId}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Error al cargar tareas')
    }
  }, [])

  // Recargar cuando cambie el grupo activo
  useEffect(() => {
    if (!groupId) return
    
    // Recargar tareas cuando cambie el grupo
    loadTasks(groupId)
    
    // También recargar categorías
    fetch(`/api/categories?groupId=${groupId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setCategories(data.categories || [])
        }
      })
      .catch(err => console.error('Error loading categories:', err))
  }, [groupId, loadTasks])

  // Escuchar cambios de grupo desde el layout
  useEffect(() => {
    const handleGroupUpdate = async () => {
      // Solo actualizar el grupo activo - el useEffect que escucha groupId se encargará de recargar los datos
      try {
        const [userRes, groupsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/groups'),
        ])
        
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json()
          if (groupsData.groups && groupsData.groups.length > 0) {
            let selectedGroup = groupsData.groups[0]
            
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.user?.activeGroupId) {
                const found = groupsData.groups.find((g: Group) => g.id === userData.user.activeGroupId)
                if (found) {
                  selectedGroup = found
                }
              }
            }
            
            // Solo actualizar el estado - el useEffect que escucha groupId recargará los datos
            setGroupId(selectedGroup.id)
            setCurrency(selectedGroup.currency || 'CLP')
            setAutoCreateExpenses(selectedGroup.autoCreateExpensesFromReminders || false)
          }
        }
      } catch (error) {
        console.error('Error reloading group:', error)
      }
    }

    window.addEventListener('groupUpdated', handleGroupUpdate)
    return () => window.removeEventListener('groupUpdated', handleGroupUpdate)
  }, []) // Sin dependencias para que el listener no se recree

  // Abrir modal para checkear tarea
  const openCheckModal = (task: MonthlyPaymentTask) => {
    setSelectedTask(task)
    setPaidAmount('')
    setShouldCreateExpense(false) // Empezar desactivado, usuario decide
    setCheckModalOpen(true)
  }

  // Checkear tarea
  const handleCheckTask = async () => {
    if (!selectedTask || !paidAmount || parseFloat(paidAmount) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    setSaving(true)
    try {
      const requestBody = {
        isCompleted: true,
        paidAmount: parseFloat(paidAmount),
        createExpense: shouldCreateExpense,
      }
      const res = await fetch(`/api/monthly-payment-tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (res.ok) {
        toast.success('Pago registrado')
        setCheckModalOpen(false)
        setPaidAmount('')
        setShouldCreateExpense(false)
        setSelectedTask(null)
        if (groupId) {
          await loadTasks(groupId)
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al registrar pago')
      }
    } catch (error) {
      console.error('Error checking task:', error)
      toast.error('Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  // Abrir modal de confirmación para desmarcar
  const openUncheckConfirm = (task: MonthlyPaymentTask) => {
    setTaskToUncheck(task)
    setUncheckConfirmOpen(true)
  }

  // Descheckear tarea
  const handleUncheckTask = async () => {
    if (!taskToUncheck) return

    try {
      const res = await fetch(`/api/monthly-payment-tasks/${taskToUncheck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: false,
        }),
      })

      if (res.ok) {
        toast.success('Pago desmarcado')
        setUncheckConfirmOpen(false)
        setTaskToUncheck(null)
        if (groupId) {
          await loadTasks(groupId)
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al desmarcar pago')
      }
    } catch (error) {
      console.error('Error unchecking task:', error)
      toast.error('Error al desmarcar pago')
    }
  }

  // Abrir modal para crear template
  const openCreateTemplateModal = () => {
    setEditingTemplate(null)
    setTemplateName('')
    setTemplateCategoryId('')
    setTemplateDay(null)
    setTemplateModalOpen(true)
  }

  // Guardar template
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateCategoryId) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    if (groupId) {
      setSaving(true)
      try {
        const url = editingTemplate 
          ? `/api/payment-templates/${editingTemplate.id}`
          : '/api/payment-templates'
        
        const method = editingTemplate ? 'PUT' : 'POST'
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            name: templateName.trim(),
            defaultCategoryId: templateCategoryId,
            estimatedDay: templateDay || null,
          }),
        })

        if (res.ok) {
          toast.success(editingTemplate ? 'Template actualizado' : 'Template creado')
          setTemplateModalOpen(false)
          if (groupId) {
            await loadTasks(groupId)
          }
        } else {
          const error = await res.json()
          toast.error(error.error || 'Error al guardar template')
        }
      } catch (error) {
        console.error('Error saving template:', error)
        toast.error('Error al guardar template')
      } finally {
        setSaving(false)
      }
    }
  }

  // Abrir modal de confirmación para borrar template
  const openDeleteTemplateConfirm = (templateId: string) => {
    setTemplateToDelete(templateId)
    setDeleteTemplateConfirmOpen(true)
  }

  // Borrar template (recordatorio)
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    setDeletingTemplate(templateToDelete)
    try {
      const res = await fetch(`/api/payment-templates/${templateToDelete}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Recordatorio eliminado')
        setDeleteTemplateConfirmOpen(false)
        setTemplateToDelete(null)
        if (groupId) {
          await loadTasks(groupId)
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al eliminar recordatorio')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar recordatorio')
    } finally {
      setDeletingTemplate(null)
    }
  }

  // Ordenar tareas: pendientes primero (por día estimado), luego completadas
  const sortedTasks = [...tasks].sort((a: MonthlyPaymentTask, b: MonthlyPaymentTask) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1
    }
    const dayA = a.template.estimatedDay || 32
    const dayB = b.template.estimatedDay || 32
    return dayA - dayB
  })

  const completedCount = tasks.filter((t: MonthlyPaymentTask) => t.isCompleted).length
  const totalCount = tasks.length
  const now = new Date()
  const monthName = now.toLocaleDateString('es-CL', { 
    month: 'long', 
    year: 'numeric',
    timeZone: 'UTC'
  })

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Cargando recordatorios...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Recordatorios</h1>
              <p className="text-slate-400">
                {monthName} • {completedCount}/{totalCount} completados
              </p>
            </div>
            <button
              onClick={openCreateTemplateModal}
              className="hidden md:flex items-center gap-2 gradient-primary text-white font-medium py-2 px-4 rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo recordatorio
            </button>
          </div>
          {/* Botón mobile - debajo del header */}
          <button
            onClick={openCreateTemplateModal}
            className="md:hidden w-full flex items-center justify-center gap-2 gradient-primary text-white font-medium py-3 px-4 rounded-xl hover:shadow-lg transition-all mb-4"
          >
            <Plus className="w-4 h-4" />
            Nuevo recordatorio
          </button>
        </div>

        {/* Info box - Acordeón */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl overflow-hidden">
          <button
            onClick={() => setInfoExpanded(!infoExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-300">¿Qué son los recordatorios?</span>
            </div>
            {infoExpanded ? (
              <ChevronUp className="w-5 h-5 text-blue-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-400" />
            )}
          </button>
          {infoExpanded && (
            <div className="px-4 pb-4 pt-0">
              <div className="text-sm text-slate-300 space-y-2">
                <p>
                  Esta sección te ayuda a gestionar pagos recurrentes con montos variables (como luz, agua, gas, arriendo en UF).
                  Crea recordatorios para cada pago mensual y márcalos como completados cuando los realices.
                </p>
                <p className="text-slate-400">
                  💡 <strong>Importante:</strong> Al finalizar el mes, las tareas se resetean automáticamente para que puedas empezar de nuevo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tasks list */}
        {sortedTasks.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <CheckSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No hay recordatorios configurados</p>
            <p className="text-slate-500 text-sm mb-6">
              Crea tu primer recordatorio para empezar a gestionar tus pagos mensuales
            </p>
            <button
              onClick={openCreateTemplateModal}
              className="inline-flex items-center gap-2 gradient-primary text-white font-medium py-2 px-4 rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Crear recordatorio
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task: MonthlyPaymentTask) => (
              <div
                key={task.id}
                className={`bg-slate-800/50 rounded-xl p-4 border transition-all relative ${
                  task.isCompleted
                    ? 'border-slate-700 opacity-75'
                    : 'border-slate-700 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (task.isCompleted) {
                        openUncheckConfirm(task)
                      } else {
                        openCheckModal(task)
                      }
                    }}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      task.isCompleted
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600 hover:border-emerald-500'
                    }`}
                  >
                    {task.isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>

                  {/* Content - clickeable */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (!task.isCompleted) {
                        openCheckModal(task)
                      } else {
                        openUncheckConfirm(task)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${task.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {task.template.name}
                      </h3>
                      {task.template.estimatedDay && (
                        <span className="text-xs text-slate-500">
                          Día ~{task.template.estimatedDay}
                        </span>
                      )}
                    </div>
                    {task.isCompleted ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-400 font-semibold">
                          {formatCurrency(task.paidAmount || 0, currency)}
                        </span>
                        {task.paidDate && (
                          <span className="text-slate-500">
                            • {formatDate(task.paidDate)}
                          </span>
                        )}
                        {task.completer && (
                          <span className="text-slate-500">
                            • {task.completer.name || task.completer.email.split('@')[0]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Bolsillo: {task.template.category.name}
                      </p>
                    )}
                  </div>

                  {/* Botón borrar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteTemplateConfirm(task.template.id)
                    }}
                    disabled={deletingTemplate === task.template.id}
                    className="flex-shrink-0 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar recordatorio"
                  >
                    {deletingTemplate === task.template.id ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Checkear tarea */}
        <Dialog open={checkModalOpen} onOpenChange={setCheckModalOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Registrar pago: {selectedTask?.template.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Ingresa el monto que pagaste
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Monto pagado
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {currency === 'CLP' ? '$' : currency}
                  </span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Switch estilo gastos recurrentes */}
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                    Crear como gasto automáticamente
                  </span>
                  <button
                    type="button"
                    onClick={() => setShouldCreateExpense(!shouldCreateExpense)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      shouldCreateExpense
                        ? 'bg-emerald-500'
                        : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        shouldCreateExpense ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
                {shouldCreateExpense && selectedTask?.template.defaultCategoryId && (
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedTask.template.category.icon || '📁'}</span>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Se creará en</p>
                        <p className="text-sm text-white font-medium">
                          {selectedTask.template.category.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCheckModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCheckTask}
                  disabled={saving || !paidAmount || parseFloat(paidAmount) <= 0}
                  className="flex-1 py-2 px-4 gradient-primary text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Confirmar desmarcar tarea con gasto asociado */}
        <Dialog open={uncheckConfirmOpen} onOpenChange={setUncheckConfirmOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                ¿Desmarcar recordatorio?
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {taskToUncheck?.expenseId 
                  ? 'Este recordatorio tiene un gasto asociado que ya fue creado. ¿Estás seguro de que quieres desmarcarlo?'
                  : '¿Estás seguro de que quieres desmarcar este recordatorio?'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {taskToUncheck?.expenseId && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    ℹ️ Este recordatorio tiene un gasto asociado que ya fue creado. Al desmarcar, el gasto seguirá existiendo en tu lista de gastos.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setUncheckConfirmOpen(false)
                    setTaskToUncheck(null)
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 font-medium hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUncheckTask}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-all"
                >
                  Desmarcar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Confirmar eliminar template */}
        <Dialog open={deleteTemplateConfirmOpen} onOpenChange={setDeleteTemplateConfirmOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                ¿Eliminar recordatorio?
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Esta acción no se puede deshacer. El recordatorio será eliminado permanentemente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setDeleteTemplateConfirmOpen(false)
                    setTemplateToDelete(null)
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 font-medium hover:bg-slate-700 transition-all"
                  disabled={deletingTemplate !== null}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTemplate}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:opacity-50"
                  disabled={deletingTemplate !== null}
                >
                  {deletingTemplate ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Crear/Editar template */}
        <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                {editingTemplate ? 'Editar recordatorio' : 'Nuevo recordatorio'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configura un recordatorio para pagos mensuales recurrentes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del pago *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Luz, Agua, Gas, Arriendo"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bolsillo por defecto *
                </label>
                <select
                  value={templateCategoryId}
                  onChange={(e) => setTemplateCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona un bolsillo</option>
                  {categories.map((cat: Category) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Día aproximado del mes (opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={templateDay || ''}
                  onChange={(e) => setTemplateDay(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ej: 15"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Día aproximado cuando sueles pagar (solo para ordenar la lista)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setTemplateModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving || !templateName.trim() || !templateCategoryId}
                  className="flex-1 py-2 px-4 gradient-primary text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : editingTemplate ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
