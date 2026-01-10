import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/RegisterForm'
import Link from 'next/link'
import { Wallet, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const benefits = [
    'Bolsillos ilimitados para organizar tu dinero',
    'Comparte gastos con tu familia o pareja',
    'Reportes visuales y metas de ahorro',
    'Sin publicidad, sin pagos ocultos',
  ]

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
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
              Empieza a organizar<br />
              <span className="text-gradient-hero">tu dinero hoy</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-8">
              Únete a miles de personas que ya controlan sus finanzas 
              con el método de bolsillos.
            </p>
            
            {/* Benefits */}
            <ul className="space-y-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-white/80">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Social proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {['#10B981', '#A855F7', '#F97316', '#3B82F6'].map((color, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-[#030712] flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: color }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="text-white/60 text-sm">
              +2,000 usuarios<br />
              <span className="text-white/40">ya organizan su dinero</span>
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
              <h2 className="text-3xl font-bold text-white mb-2">Crear cuenta</h2>
              <p className="text-white/60">
                Gratis, para siempre. Sin trucos.
              </p>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}
