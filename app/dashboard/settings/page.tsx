'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Settings, 
  Users, 
  Wallet,
  Trash2,
  Save,
  AlertTriangle,
  Crown,
  Mail,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Pencil,
  Loader2,
  Copy,
  Link,
  Send,
  UserPlus,
  LogOut
} from 'lucide-react'

interface Group {
  id: string
  name: string
  currency: string
  createdAt: string
  currentUserRole: 'owner' | 'member'
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      email: string
      name: string | null
    }
  }>
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  isPersonal: boolean
  monthlyLimit: number | null
  ownerId: string | null
  owner: {
    id: string
    name: string | null
    email: string
  } | null
}

interface PendingInvitation {
  id: string
  email: string
  token: string
  status: string
  createdAt: string
  expiresAt: string | null
  inviteLink: string
  isExpired: boolean
  inviter: {
    id: string
    email: string
    name: string | null
  }
}

const currencies = [
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: 'MX$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: 'AR$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: 'CO$' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [leavingGroup, setLeavingGroup] = useState(false)
  
  // Permisos derivados del rol
  const isOwner = group?.currentUserRole === 'owner'
  
  // Form states
  const [groupName, setGroupName] = useState('')
  const [groupCurrency, setGroupCurrency] = useState('CLP')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // Category edit states
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editLimit, setEditLimit] = useState('')
  
  // Invitation states
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [resendingInvite, setResendingInvite] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  // Función para cargar datos del grupo
  const loadGroupData = async (selectedGroup: Group) => {
    setGroup(selectedGroup)
    setGroupName(selectedGroup.name)
    setGroupCurrency(selectedGroup.currency || 'CLP')
    
    // Obtener categorías del grupo
    const categoriesRes = await fetch(`/api/categories?groupId=${selectedGroup.id}`)
    if (categoriesRes.ok) {
      const catData = await categoriesRes.json()
      setCategories(catData.categories || [])
    }
    
    // Obtener invitaciones pendientes (solo si es owner)
    if (selectedGroup.currentUserRole === 'owner') {
      const invitationsRes = await fetch(`/api/invitations?groupId=${selectedGroup.id}`)
      if (invitationsRes.ok) {
        const invData = await invitationsRes.json()
        setPendingInvitations(invData.invitations || [])
      }
    } else {
      // Limpiar invitaciones si no es owner
      setPendingInvitations([])
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener usuario (que incluye activeGroupId) y grupos
        const [userRes, groupsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/groups'),
        ])
        
        if (groupsRes.ok) {
          const data = await groupsRes.json()
          if (data.groups && data.groups.length > 0) {
            let selectedGroup = data.groups[0]
            
            // Si tenemos el usuario con activeGroupId, usarlo
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.user?.activeGroupId) {
                const found = data.groups.find((g: Group) => g.id === userData.user.activeGroupId)
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
            
            // Obtener el ID del usuario actual
            if (data.currentUserId) {
              setCurrentUserId(data.currentUserId)
            }
            
            // Cargar datos del grupo seleccionado
            await loadGroupData(selectedGroup)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Escuchar cambios de grupo desde el layout
  useEffect(() => {
    const handleGroupUpdate = async () => {
      try {
        // Obtener usuario (que incluye activeGroupId) y grupos
        const [userRes, groupsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/groups'),
        ])
        
        if (groupsRes.ok) {
          const data = await groupsRes.json()
          if (data.groups && data.groups.length > 0) {
            let selectedGroup = data.groups[0]
            
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.user?.activeGroupId) {
                const found = data.groups.find((g: Group) => g.id === userData.user.activeGroupId)
                if (found) {
                  selectedGroup = found
                }
              }
            }
            
            // Recargar datos del nuevo grupo
            await loadGroupData(selectedGroup)
          }
        }
      } catch (error) {
        console.error('Error reloading group:', error)
      }
    }

    window.addEventListener('groupUpdated', handleGroupUpdate)
    return () => window.removeEventListener('groupUpdated', handleGroupUpdate)
  }, [])

  // Guardar configuración del grupo
  const handleSaveGroup = async () => {
    if (!group) return
    setSaving(true)
    
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          currency: groupCurrency,
        }),
      })

      if (res.ok) {
        setGroup({ ...group, name: groupName, currency: groupCurrency })
        // Notificar al header para que actualice el nombre del grupo
        window.dispatchEvent(new CustomEvent('groupUpdated'))
        toast.success('Configuración guardada', {
          description: 'Los cambios se aplicaron correctamente',
        })
      } else {
        toast.error('Error al guardar', {
          description: 'No se pudieron aplicar los cambios',
        })
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al guardar', {
        description: 'Ocurrió un error inesperado',
      })
    } finally {
      setSaving(false)
    }
  }

  // Verificar si el usuario puede editar una categoría
  const canEditCategory = (category: Category): boolean => {
    // Categorías compartidas: cualquier miembro puede editar
    if (!category.isPersonal) return true
    
    // Categorías personales: solo el dueño puede editar
    if (category.isPersonal && category.ownerId === currentUserId) return true
    
    return false
  }

  // Iniciar edición de categoría
  const startEditCategory = (category: Category) => {
    // Verificar permisos antes de permitir edición
    if (!canEditCategory(category)) return
    
    setEditingCategory(category.id)
    setEditName(category.name)
    setEditEmoji(category.icon || '📁')
    setEditLimit(category.monthlyLimit?.toString() || '')
  }

  // Guardar categoría
  const handleSaveCategory = async (categoryId: string) => {
    setSavingCategory(true)
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          icon: editEmoji,
          monthlyLimit: editLimit ? parseFloat(editLimit) : null,
        }),
      })

      if (res.ok) {
        setCategories(categories.map(cat => 
          cat.id === categoryId 
            ? { ...cat, name: editName, icon: editEmoji, monthlyLimit: editLimit ? parseFloat(editLimit) : null }
            : cat
        ))
        setEditingCategory(null)
        toast.success('Bolsillo actualizado')
      } else {
        toast.error('Error al guardar bolsillo')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Error al guardar bolsillo')
    } finally {
      setSavingCategory(false)
    }
  }

  // Eliminar categoría
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    
    // Mostrar confirmación antes de eliminar
    toast.custom((t) => (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl max-w-sm">
        <p className="text-white font-medium mb-2">¿Eliminar bolsillo?</p>
        <p className="text-slate-400 text-sm mb-4">
          Esta acción no se puede deshacer. El bolsillo "{category?.name}" será eliminado permanentemente.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t)
              try {
                const res = await fetch(`/api/categories/${categoryId}`, {
                  method: 'DELETE',
                })
                if (res.ok) {
                  setCategories(categories.filter(cat => cat.id !== categoryId))
                  toast.success('Bolsillo eliminado')
                } else {
                  const data = await res.json()
                  toast.error(data.error || 'No se puede eliminar este bolsillo', {
                    description: data.message || 'Este bolsillo tiene gastos asociados y no puede ser eliminado para mantener la integridad de tus registros.',
                    duration: 6000,
                  })
                }
              } catch {
                toast.error('Error al eliminar')
              }
            }}
            className="flex-1 bg-red-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="flex-1 bg-slate-700 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 10000 })
  }

  // Enviar invitación
  const handleSendInvite = async () => {
    if (!group || !inviteEmail.trim()) return
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      toast.error('Email inválido')
      return
    }
    
    setSendingInvite(true)
    setInviteLink(null)
    
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          email: inviteEmail,
          sendEmail: true,
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setInviteLink(data.invitation.inviteLink)
        // Agregar a la lista de pendientes
        setPendingInvitations([data.invitation, ...pendingInvitations])
        toast.success('Invitación enviada', {
          description: `Se envió un email a ${inviteEmail}`,
        })
        setInviteEmail('')
      } else {
        toast.error('Error al enviar invitación', {
          description: data.error,
        })
      }
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error('Error al enviar invitación')
    } finally {
      setSendingInvite(false)
    }
  }

  // Copiar link de invitación
  const copyInviteLink = (link?: string) => {
    const linkToCopy = link || inviteLink
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy)
      toast.success('Link copiado al portapapeles')
    }
  }

  // Handler para el botón de copiar
  const handleCopyClick = () => {
    copyInviteLink()
  }

  // Reenviar invitación por email
  const handleResendInvite = async (invitation: PendingInvitation) => {
    if (!group) return
    
    setResendingInvite(invitation.id)
    
    try {
      // Creamos una nueva invitación con el mismo email (esto actualizará el token)
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          email: invitation.email,
          sendEmail: true,
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Actualizar la invitación en la lista
        setPendingInvitations(pendingInvitations.map(inv => 
          inv.email === invitation.email ? { ...data.invitation, inviter: invitation.inviter } : inv
        ))
        toast.success('Invitación reenviada', {
          description: `Se envió un nuevo email a ${invitation.email}`,
        })
      } else if (res.status === 400 && data.error?.includes('pendiente')) {
        // Si ya existe, solo reenviamos el email
        toast.info('El email se reenviará', {
          description: 'La invitación ya estaba activa',
        })
      } else {
        toast.error('Error al reenviar invitación', {
          description: data.error,
        })
      }
    } catch (error) {
      console.error('Error resending invite:', error)
      toast.error('Error al reenviar invitación')
    } finally {
      setResendingInvite(null)
    }
  }

  // Cancelar/eliminar invitación pendiente
  const handleCancelInvite = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId))
        toast.success('Invitación cancelada')
      } else {
        toast.error('Error al cancelar invitación')
      }
    } catch (error) {
      console.error('Error canceling invite:', error)
      toast.error('Error al cancelar invitación')
    }
  }

  // Eliminar grupo (solo owner)
  const handleDeleteGroup = async () => {
    if (!group || deleteConfirmText !== group.name || !isOwner) return

    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Espacio eliminado')
        router.push('/dashboard/setup')
      } else {
        toast.error('Error al eliminar espacio')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Error al eliminar espacio')
    }
  }

  // Abandonar grupo (solo member)
  const handleLeaveGroup = async () => {
    if (!group || isOwner) return
    
    setLeavingGroup(true)
    
    try {
      const res = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Has abandonado el espacio', {
          description: 'Ya no tienes acceso a este espacio',
        })
        router.push('/dashboard/setup')
      } else {
        const data = await res.json()
        toast.error('Error al abandonar', {
          description: data.error || 'Ocurrió un error inesperado',
        })
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      toast.error('Error al abandonar el espacio')
    } finally {
      setLeavingGroup(false)
    }
  }

  // Eliminar miembro del grupo (solo owner)
  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!group || !isOwner) return

    // Confirmar eliminación
    toast.custom((t) => (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl max-w-sm">
        <p className="text-white font-medium mb-2">¿Eliminar miembro?</p>
        <p className="text-slate-400 text-sm mb-4">
          Se eliminará a <strong className="text-white">{memberEmail}</strong> del espacio. 
          Sus bolsillos personales también serán eliminados.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t)
              setRemovingMember(memberId)
              try {
                const res = await fetch(`/api/groups/${group.id}/members/${memberId}`, {
                  method: 'DELETE',
                })
                
                if (res.ok) {
                  const data = await res.json()
                  // Actualizar la lista de miembros
                  setGroup({
                    ...group,
                    members: group.members.filter(m => m.id !== memberId),
                  })
                  toast.success('Miembro eliminado', {
                    description: data.message,
                  })
                } else {
                  const errorData = await res.json()
                  toast.error('Error al eliminar miembro', {
                    description: errorData.error || 'Ocurrió un error inesperado',
                  })
                }
              } catch (error) {
                console.error('Error removing member:', error)
                toast.error('Error al eliminar miembro')
              } finally {
                setRemovingMember(null)
              }
            }}
            className="flex-1 bg-red-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
          <button
            onClick={() => {
              toast.dismiss(t)
              setRemovingMember(null)
            }}
            className="flex-1 bg-slate-700 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 10000 })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No tienes un espacio configurado</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400 text-sm mt-1">Administra tu espacio y bolsillos</p>
      </div>

      {/* Configuración del grupo */}
      <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Espacio</h2>
              <p className="text-sm text-slate-400">Configuración general de tu espacio</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isOwner && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-400">
              Solo el dueño del espacio puede modificar estos datos
            </div>
          )}
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del espacio
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={!isOwner}
              className={`w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Moneda
            </label>
            <div className="relative">
              <select
                value={groupCurrency}
                onChange={(e) => setGroupCurrency(e.target.value)}
                disabled={!isOwner}
                className={`w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>


          {/* Botón guardar - solo visible para owner */}
          {isOwner && (
            <button
              onClick={handleSaveGroup}
              disabled={saving}
              className="flex items-center gap-2 gradient-primary text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Guardar cambios
            </button>
          )}
        </div>
      </section>

      {/* Miembros */}
      <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Miembros</h2>
                <p className="text-sm text-slate-400">{group.members.length} miembro(s)</p>
              </div>
            </div>
            {isOwner && (
              <button 
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="flex items-center gap-1 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invitar
              </button>
            )}
          </div>
        </div>

        {/* Formulario de invitación - solo owner */}
        {isOwner && showInviteForm && (
          <div className="p-6 bg-slate-900/50 border-b border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email del invitado
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@ejemplo.com"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                    />
                  </div>
                  <button
                    onClick={handleSendInvite}
                    disabled={sendingInvite || !inviteEmail.trim()}
                    className="flex items-center gap-2 gradient-primary text-white font-medium py-3 px-5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingInvite ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>
              </div>
              
              {/* Link de invitación generado */}
              {inviteLink && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
                    <Check className="w-4 h-4" />
                    ¡Invitación enviada!
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    También puedes compartir este link directamente:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm text-slate-300 truncate"
                    />
                    <button
                      onClick={handleCopyClick}
                      className="flex items-center gap-1 bg-slate-700 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-700/50">
          {/* Miembros activos */}
          {group.members.map(member => (
            <div key={member.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                {(member.user.name || member.user.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {member.user.name || member.user.email.split('@')[0]}
                </p>
                <p className="text-sm text-slate-500 truncate">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.role === 'owner' && (
                  <span className="flex items-center gap-1 text-amber-400 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    Dueño
                  </span>
                )}
                {member.role === 'member' && (
                  <span className="text-slate-400 text-xs font-medium bg-slate-700 px-2 py-1 rounded-full">
                    Miembro
                  </span>
                )}
                {/* Botón eliminar - solo para owner y solo para miembros (no para el owner mismo) */}
                {isOwner && member.role === 'member' && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user.email)}
                    disabled={removingMember === member.id}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar miembro"
                  >
                    {removingMember === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Invitaciones pendientes - solo visible para owner */}
          {isOwner && pendingInvitations.length > 0 && (
            <>
              <div className="px-4 py-2 bg-slate-900/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  Invitaciones pendientes ({pendingInvitations.length})
                </p>
              </div>
              {pendingInvitations.map(invitation => (
                <div key={invitation.id} className="p-4 flex items-center gap-4 bg-slate-800/30">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 font-medium truncate">{invitation.email}</p>
                    <p className="text-xs text-slate-500">
                      {invitation.isExpired ? (
                        <span className="text-amber-400">Expirada</span>
                      ) : (
                        <>Expira el {new Date(invitation.expiresAt!).toLocaleDateString('es-CL')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyInviteLink(invitation.inviteLink)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Copiar link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResendInvite(invitation)}
                      disabled={resendingInvite === invitation.id}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Reenviar email"
                    >
                      {resendingInvite === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelInvite(invitation.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Cancelar invitación"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Bolsillos */}
      <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Bolsillos</h2>
                <p className="text-sm text-slate-400">{categories.length} bolsillo(s)</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard/pockets/new?returnTo=settings')}
              className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
            >
              + Nuevo bolsillo
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {categories.map(category => (
            <div key={category.id} className="p-4">
              {editingCategory === category.id ? (
                // Modo edición
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => {
                        const value = e.target.value
                        // Solo tomar el último caracter (emoji)
                        if (value.length > 0) {
                          const chars = [...value]
                          setEditEmoji(chars[chars.length - 1])
                        }
                      }}
                      className="w-16 h-12 text-2xl text-center bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nombre del bolsillo"
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">Límite mensual</label>
                      <input
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        placeholder="Sin límite"
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <button
                        onClick={() => handleSaveCategory(category.id)}
                        disabled={savingCategory}
                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingCategory ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        disabled={savingCategory}
                        className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl">
                    {category.icon || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{category.name}</p>
                    <p className="text-sm text-slate-500">
                      {category.isPersonal ? (
                        <>
                          👤 Personal
                          {category.owner && category.ownerId !== currentUserId && (
                            <span className="ml-1 text-slate-400">
                              ({category.owner.name || category.owner.email.split('@')[0]})
                            </span>
                          )}
                        </>
                      ) : '👥 Grupal'}
                      {category.monthlyLimit && (
                        <span className="ml-2">• Límite: ${category.monthlyLimit.toLocaleString('es-CL')}</span>
                      )}
                    </p>
                  </div>
                  {canEditCategory(category) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-slate-400">No tienes bolsillos configurados</p>
            </div>
          )}
        </div>
      </section>

      {/* Zona de peligro */}
      <section className="bg-red-500/5 rounded-2xl border border-red-500/20 overflow-hidden">
        <div className="p-6 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-400">Zona de peligro</h2>
              <p className="text-sm text-slate-400">Acciones irreversibles</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isOwner ? (
            // Owner puede eliminar el grupo
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar este espacio
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-300">
                    Esta acción eliminará permanentemente el espacio <strong className="text-white">{group.name}</strong>, 
                    todos sus bolsillos, gastos e ingresos. Esta acción no se puede deshacer.
                  </p>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Escribe <strong className="text-white">{group.name}</strong> para confirmar:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full bg-slate-900 border border-red-500/30 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      placeholder={group.name}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeleteGroup}
                      disabled={deleteConfirmText !== group.name}
                      className="flex items-center gap-2 bg-red-500 text-white font-medium py-2 px-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar permanentemente
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Member solo puede abandonar el grupo
            <div className="space-y-4">
              <p className="text-slate-300">
                Si abandonas este espacio, perderás acceso a todos sus datos y ya no podrás ver los gastos compartidos.
                Tus bolsillos personales serán eliminados.
              </p>
              <button
                onClick={handleLeaveGroup}
                disabled={leavingGroup}
                className="flex items-center gap-2 bg-red-500/20 text-red-400 font-medium py-2 px-4 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {leavingGroup ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Abandonar este espacio
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
