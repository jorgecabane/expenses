import Link from 'next/link'
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  PiggyBank, 
  Shield, 
  Zap,
  ArrowRight,
  Check,
  Sparkles,
  Target,
  BarChart3,
  LayoutDashboard
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function Navbar() {
  // Verificar si el usuario está loggeado
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Bolsillos</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
              Características
            </a>
            <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
              Cómo funciona
            </a>
            <a href="#pricing" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
              Precios
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className="gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium px-4 py-2 flex items-center justify-center whitespace-nowrap"
                >
                  Iniciar sesión
                </Link>
                <Link 
                  href="/register" 
                  className="gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center whitespace-nowrap"
                >
                  Comenzar gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-mesh opacity-60" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      
      {/* Contenido principal centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white">El método que realmente funciona</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
            Tu dinero,
            <br />
            <span className="text-gradient-hero">organizado.</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            Controla tus gastos familiares con el método de bolsillos. 
            Simple, visual y efectivo. Porque ahorrar no tiene que ser complicado.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <Link 
              href="/register" 
              className="group gradient-primary text-white text-lg font-semibold px-8 py-4 rounded-full hover:shadow-2xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-1 flex items-center gap-2"
            >
              Comenzar gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#how-it-works" 
              className="text-white/70 hover:text-white text-lg font-medium px-8 py-4 rounded-full border border-white/20 hover:border-white/40 transition-all"
            >
              Ver cómo funciona
            </a>
          </div>
          
          {/* Scroll indicator - justo después de los botones */}
          <div className="animate-bounce mb-12">
            <div className="w-6 h-10 mx-auto rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-white/50 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Stats y preview en sección separada */}
        <div className="max-w-6xl mx-auto w-full">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-12 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">100%</div>
              <div className="text-sm text-white/50">Gratis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">2min</div>
              <div className="text-sm text-white/50">Para empezar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">∞</div>
              <div className="text-sm text-white/50">Bolsillos</div>
            </div>
          </div>
          
          {/* Hero visual */}
          <div className="relative animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
            <div className="relative mx-auto max-w-4xl">
              {/* Glow effect */}
              <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20 scale-95" />
              
              {/* App preview card */}
              <div className="relative bg-gradient-to-b from-white/10 to-white/5 rounded-3xl border border-white/10 p-8 backdrop-blur-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pocket cards preview */}
                  {[
                    { name: 'Alimentación', spent: 45000, limit: 150000, color: 'bg-emerald-500' },
                    { name: 'Transporte', spent: 28000, limit: 50000, color: 'bg-purple-500' },
                    { name: 'Entretenimiento', spent: 15000, limit: 30000, color: 'bg-orange-500' },
                  ].map((pocket, i) => (
                    <div 
                      key={pocket.name}
                      className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white font-medium">{pocket.name}</span>
                        <div className={`w-3 h-3 rounded-full ${pocket.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        ${pocket.spent.toLocaleString('es-CL')}
                      </div>
                      <div className="text-sm text-white/50 mb-3">
                        de ${pocket.limit.toLocaleString('es-CL')}
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${pocket.color} rounded-full transition-all group-hover:opacity-80`}
                          style={{ width: `${(pocket.spent / pocket.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      emoji: '👛',
      title: 'Método de bolsillos',
      description: 'Asigna dinero a categorías para controlar tus gastos antes de que sucedan.',
      gradient: 'gradient-primary',
      shadowColor: 'shadow-emerald-500/20',
    },
    {
      emoji: '👥',
      title: 'Gastos compartidos',
      description: 'Administra bolsillos con tu pareja o familia. Cada uno con su espacio.',
      gradient: 'gradient-secondary',
      shadowColor: 'shadow-secondary/20',
    },
    {
      emoji: '📊',
      title: 'Reportes visuales',
      description: 'Entiende a dónde va tu dinero con gráficos claros y simples.',
      gradient: 'gradient-accent',
      shadowColor: 'shadow-accent/20',
    },
    {
      emoji: '🎯',
      title: 'Metas de ahorro',
      description: 'Define cuánto quieres ahorrar y te ayudamos a llegar ahí.',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/20',
    },
    {
      emoji: '⚡',
      title: 'Registro rápido',
      description: 'Agrega gastos en segundos. Sin formularios interminables.',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/20',
    },
    {
      emoji: '🔒',
      title: 'Privacidad total',
      description: 'Tus bolsillos personales son solo tuyos. Sin miradas indiscretas.',
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/20',
    },
  ]
  
  return (
    <section id="features" className="py-32 bg-[#030712] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white font-medium">Características</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Gastos en excel?
            <br />
            <span className="text-gradient-primary">Ya es cosa del pasado.</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Diseñado para ser simple pero poderoso. Cada función tiene un propósito.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`group relative bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-2xl ${feature.shadowColor}`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.gradient} mb-6 shadow-lg ${feature.shadowColor}`}>
                <span className="text-2xl">{feature.emoji}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Crea tu grupo',
      description: 'Empieza solo o invita a tu pareja, familia o roommates. Cada quien con su rol.',
      visual: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="flex -space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`w-16 h-16 rounded-full border-4 border-[#0a0f1a] flex items-center justify-center text-white font-bold ${i === 1 ? 'gradient-primary' : i === 2 ? 'gradient-secondary' : 'gradient-accent'}`}>
                {i === 1 ? 'Tú' : i === 2 ? 'P' : '+'}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      number: '02',
      title: 'Define tus bolsillos',
      description: 'Alimentación, transporte, entretenimiento... Crea los que necesites con sus límites.',
      visual: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-3">
            {['🍕', '🚗', '🎬', '💊'].map((emoji, i) => (
              <div key={i} className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl hover:scale-105 transition-transform">
                {emoji}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      number: '03',
      title: 'Registra gastos',
      description: 'Cada vez que gastes, agrégalo al bolsillo correspondiente. Toma 5 segundos.',
      visual: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 w-64">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span className="text-lg">🍕</span>
              </div>
              <div>
                <div className="text-white font-medium">Pizza familiar</div>
                <div className="text-white/50 text-sm">Alimentación</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-white">$12.990</div>
          </div>
        </div>
      ),
    },
    {
      number: '04',
      title: 'Controla y ahorra',
      description: 'Visualiza tu progreso, ajusta límites y alcanza tus metas de ahorro.',
      visual: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="relative">
            <span className="text-8xl">🐷</span>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      ),
    },
  ]
  
  return (
    <section id="how-it-works" className="py-32 bg-[#0a0f1a] relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white font-medium">Cómo funciona</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Tan simple como
            <br />
            <span className="text-gradient-hero">contar hasta 4.</span>
          </h2>
        </div>
        
        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="relative bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="text-6xl font-bold text-gradient-hero opacity-30">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">{step.description}</p>
                </div>
              </div>
              {step.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="pricing" className="py-32 bg-[#030712] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
          <span className="text-lg">💰</span>
          <span className="text-sm text-white font-medium">Precios</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Gratis.
          <br />
          <span className="text-gradient-hero">Para siempre.</span>
        </h2>
        
        <p className="text-lg text-white/60 max-w-xl mx-auto mb-12">
          Sin trucos, sin planes premium ocultos. Bolsillos es y será gratuito. 
          Creemos que organizar tu dinero no debería costarte dinero.
        </p>
        
        {/* Pricing card */}
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-0 gradient-primary rounded-3xl blur-xl opacity-20" />
          <div className="relative bg-white/5 rounded-3xl p-8 border border-white/10">
            <div className="text-5xl font-bold text-white mb-2">$0</div>
            <div className="text-white/50 mb-8">por siempre</div>
            
            <ul className="space-y-4 text-left mb-8">
              {[
                'Bolsillos ilimitados',
                'Gastos ilimitados',
                'Miembros ilimitados',
                'Reportes completos',
                'Metas de ahorro',
                'Sin publicidad',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-white/80">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            
            <Link 
              href="/register" 
              className="block w-full gradient-primary text-white text-lg font-semibold py-4 rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all text-center"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-32 bg-[#0a0f1a] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          ¿Listo para tomar
          <br />
          <span className="text-gradient-hero">el control?</span>
        </h2>
        
        <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
          Únete a miles de personas que ya organizan su dinero con Bolsillos. 
          Es gratis y toma menos de 2 minutos empezar.
        </p>
        
        <Link 
          href="/register" 
          className="inline-flex items-center gap-2 gradient-primary text-white text-lg font-semibold px-10 py-5 rounded-full hover:shadow-2xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-1 group"
        >
          Crear mi cuenta gratis
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 bg-[#030712] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Bolsillos</span>
          </div>
          
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} Bolsillos. Hecho con 💚 para tu bolsillo.
          </div>
          
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <main className="bg-[#030712]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
