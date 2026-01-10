import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Wallet, Home, BarChart3, Settings, LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardSidebar() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4c0619d2-9be9-47c4-91b3-8b54a28f5e91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/DashboardSidebar.tsx:9',message:'DashboardSidebar entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v3',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  // El middleware ya maneja la autenticación, así que no necesitamos verificar el usuario aquí
  // Si llegamos aquí, el usuario está autenticado (el middleware lo verificó)

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-primary">Bolsillos</h1>
          <p className="text-sm text-muted-foreground">Tu dinero, organizado</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/expenses">
            <Button variant="ghost" className="w-full justify-start">
              <Wallet className="mr-2 h-4 w-4" />
              Gastos
            </Button>
          </Link>
          <Link href="/dashboard/reports">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reportes
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </Link>
        </nav>

        <div className="border-t p-4">
          <form action={handleSignOut}>
            <Button type="submit" variant="ghost" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
