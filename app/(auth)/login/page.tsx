import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/LoginForm'
import Link from 'next/link'
import { Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si hay un código en la URL, redirigir al callback
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`)
  }

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Bolsillos</span>
          </Link>
          
          {/* Main content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4">
              Bienvenido de vuelta
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Continúa organizando tu dinero con el método de bolsillos. 
              Tus finanzas te esperan.
            </p>
          </div>
          
          {/* Testimonial */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 max-w-md">
            <p className="text-white/80 italic mb-4">
              &ldquo;Desde que uso Bolsillos, finalmente sé a dónde va mi dinero. 
              Es como tener un asistente financiero en el bolsillo.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-secondary flex items-center justify-center text-white font-bold">
                CZ
              </div>
              <div>
                <div className="text-white font-medium">Constanza Zúñiga</div>
                <div className="text-white/50 text-sm">Usuaria desde 2024</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Bolsillos</span>
          </Link>
        </div>
        
        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Iniciar sesión</h2>
              <p className="text-white/60">
                Ingresa a tu cuenta para continuar
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
