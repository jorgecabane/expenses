'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, 
  LayoutDashboard, 
  Receipt, 
  TrendingUp,
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Plus,
  Bell,
  ChevronDown,
  Check,
  Loader2,
  User
} from 'lucide-react'

interface Group {
  id: string
  name: string
  currency: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Gastos', href: '/dashboard/expenses', icon: Receipt },
  { name: 'Ingresos', href: '/dashboard/incomes', icon: TrendingUp },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
]

function Sidebar({ mobile, onClose, onLogout, loggingOut }: { mobile?: boolean; onClose?: () => void; onLogout?: () => void; loggingOut?: boolean }) {
  const pathname = usePathname()
  
  const handleNewExpense = () => {
    // Cerrar sidebar mobile si está abierto
    onClose?.()
    
    // Si ya estamos en el dashboard, disparar evento para abrir modal
    if (pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent('openExpenseForm'))
    }
    // Si no, la navegación con ?new=true lo abrirá
  }
  
  return (
    <div className={`flex flex-col h-full ${mobile ? 'bg-slate-900' : ''}`}>
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Bolsillos</span>
        </Link>
      </div>
      
      {/* Quick action */}
      <div className="px-4 mb-6">
        <Link 
          href="/dashboard?new=true"
          onClick={handleNewExpense}
          className="w-full flex items-center justify-center gap-2 gradient-primary text-white font-medium py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all group"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo gasto</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* User section */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span className="font-medium">{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string | null; email: string | null } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Función para cerrar sesión
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signOut()
      toast.success('Sesión cerrada')
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Error al cerrar sesión')
      setLoggingOut(false)
    }
  }

  // Función para cargar grupos
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
        if (data.groups && data.groups.length > 0) {
          // Si ya hay un grupo activo, actualizarlo con los nuevos datos
          if (activeGroup) {
            const updated = data.groups.find((g: Group) => g.id === activeGroup.id)
            if (updated) setActiveGroup(updated)
          } else {
            setActiveGroup(data.groups[0])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }, [activeGroup])

  // Función para cargar información del usuario
  const fetchUserInfo = useCallback(async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserInfo({
          name: user.user_metadata?.name || null,
          email: user.email || null,
        })
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }, [])

  // Cargar información del usuario
  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  // Escuchar actualizaciones del usuario
  useEffect(() => {
    const handleUserUpdate = () => {
      fetchUserInfo()
    }
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [fetchUserInfo])

  // Cargar grupos inicialmente
  useEffect(() => {
    fetchGroups()
  }, [])

  // Escuchar eventos de actualización de grupos
  useEffect(() => {
    const handleGroupUpdate = () => {
      fetchGroups()
    }
    window.addEventListener('groupUpdated', handleGroupUpdate)
    return () => window.removeEventListener('groupUpdated', handleGroupUpdate)
  }, [fetchGroups])

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setGroupDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className="flex h-screen bg-slate-950">
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid #475569',
            color: '#f1f5f9',
          },
          descriptionClassName: '!text-slate-300',
        }}
      />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-slate-800 bg-slate-900/50">
        <Sidebar onLogout={handleLogout} loggingOut={loggingOut} />
      </aside>
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <Sidebar mobile onClose={() => setSidebarOpen(false)} onLogout={handleLogout} loggingOut={loggingOut} />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Group selector dropdown */}
            <div className="relative" ref={dropdownRef}>
              {loadingGroups ? (
                <div className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 animate-pulse" />
                  <div className="hidden sm:block w-24 h-4 rounded bg-slate-700 animate-pulse" />
                </div>
              ) : activeGroup ? (
                <button 
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                  className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-slate-500 hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {activeGroup.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-white font-medium">{activeGroup.name}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                  className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-emerald-500 hover:bg-slate-700 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-700 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                  </div>
                  <span className="hidden sm:inline text-slate-300 group-hover:text-white font-medium">Crear espacio</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* Dropdown menu */}
              {groupDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/30 overflow-hidden z-50">
                  {groups.length > 0 && (
                    <>
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Mis espacios
                        </p>
                        {groups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => {
                              setActiveGroup(group)
                              setGroupDropdownOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              activeGroup?.id === group.id 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activeGroup?.id === group.id ? 'gradient-primary' : 'bg-slate-600'
                            }`}>
                              <span className="text-sm font-bold text-white">
                                {group.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium flex-1 text-left">{group.name}</span>
                            {activeGroup?.id === group.id && (
                              <Check className="w-4 h-4 text-emerald-400" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-700" />
                    </>
                  )}
                  
                  <div className="p-2">
                    <Link
                      href="/dashboard/setup"
                      onClick={() => setGroupDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="font-medium">Crear nuevo espacio</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-slate-950" />
            </button>
            
            {/* User avatar */}
            <div className="relative" ref={userDropdownRef}>
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-colors"
              >
                {userInfo?.name 
                  ? userInfo.name[0].toUpperCase() 
                  : userInfo?.email 
                    ? userInfo.email[0].toUpperCase() 
                    : 'U'}
              </button>
              
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-700">
                    <p className="text-white font-medium text-sm truncate">
                      {userInfo?.name || 'Usuario'}
                    </p>
                    <p className="text-slate-400 text-xs truncate">
                      {userInfo?.email || ''}
                    </p>
                  </div>
                  
                  <div className="p-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="font-medium">Editar perfil</span>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {loggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      <span className="font-medium">Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
