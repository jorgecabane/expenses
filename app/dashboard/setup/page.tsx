'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Wallet, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Sparkles,
  Car,
  Film,
  Heart,
  Lightbulb,
  ShoppingBag,
  Plane,
  GraduationCap,
  PiggyBank,
  Gift,
  Coffee,
  Dumbbell,
  Smartphone,
  CreditCard,
  PartyPopper
} from 'lucide-react'

// Bolsillos predeterminados con iconos y colores
const defaultPockets = [
  { id: 'food', name: 'Alimentación', emoji: '🍕', icon: Coffee, color: 'bg-emerald-500', suggested: 200000 },
  { id: 'transport', name: 'Transporte', emoji: '🚗', icon: Car, color: 'bg-blue-500', suggested: 80000 },
  { id: 'entertainment', name: 'Entretenimiento', emoji: '🎬', icon: Film, color: 'bg-purple-500', suggested: 50000 },
  { id: 'health', name: 'Salud', emoji: '💊', icon: Heart, color: 'bg-red-500', suggested: 60000 },
  { id: 'services', name: 'Servicios', emoji: '💡', icon: Lightbulb, color: 'bg-amber-500', suggested: 100000 },
  { id: 'shopping', name: 'Compras', emoji: '🛍️', icon: ShoppingBag, color: 'bg-pink-500', suggested: 80000 },
  { id: 'travel', name: 'Viajes', emoji: '✈️', icon: Plane, color: 'bg-cyan-500', suggested: 100000 },
  { id: 'education', name: 'Educación', emoji: '📚', icon: GraduationCap, color: 'bg-indigo-500', suggested: 50000 },
  { id: 'savings', name: 'Ahorro', emoji: '🐷', icon: PiggyBank, color: 'bg-emerald-400', suggested: 150000 },
  { id: 'gifts', name: 'Regalos', emoji: '🎁', icon: Gift, color: 'bg-rose-500', suggested: 30000 },
  { id: 'fitness', name: 'Fitness', emoji: '💪', icon: Dumbbell, color: 'bg-orange-500', suggested: 40000 },
  { id: 'tech', name: 'Tecnología', emoji: '📱', icon: Smartphone, color: 'bg-slate-400', suggested: 50000 },
]

interface SetupData {
  groupName: string
  currency: string
  selectedPockets: string[]
  budgets: Record<string, number>
}

// Step indicator component - currentStep es 1-based (1, 2, 3)
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNumber = i + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep
        
        return (
          <div key={i} className="flex items-center">
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' 
                  : isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' 
                    : 'bg-slate-700 text-slate-300 border-2 border-slate-500'
              }`}
            >
              {isCompleted ? <Check className="w-6 h-6" strokeWidth={3} /> : stepNumber}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-16 h-1 mx-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Step 1: Create Group
function Step1CreateGroup({ 
  data, 
  onUpdate, 
  onNext 
}: { 
  data: SetupData
  onUpdate: (data: Partial<SetupData>) => void
  onNext: () => void 
}) {
  const isValid = data.groupName.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        {/* Badge con mejor contraste */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white mb-6 shadow-lg shadow-primary/30">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">Paso 1 de 3</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Crea tu espacio
        </h1>
        <p className="text-lg text-slate-400">
          Un espacio para organizar tu dinero. Puedes tener varios espacios para diferentes propósitos.
        </p>
      </div>

      <div className="space-y-8">
        {/* Group name */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-300">
            Nombre de tu espacio
          </label>
          <input
            type="text"
            value={data.groupName}
            onChange={(e) => onUpdate({ groupName: e.target.value })}
            placeholder="Ej: Casa, Familia González, Mi presupuesto..."
            className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl py-4 px-6 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>

        {/* Currency */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-300">
            Moneda
          </label>
          <select
            value={data.currency}
            onChange={(e) => onUpdate({ currency: e.target.value })}
            className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl py-4 px-6 text-white text-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none cursor-pointer"
          >
            <option value="CLP">🇨🇱 Peso Chileno (CLP)</option>
            <option value="USD">🇺🇸 Dólar (USD)</option>
            <option value="EUR">🇪🇺 Euro (EUR)</option>
            <option value="MXN">🇲🇽 Peso Mexicano (MXN)</option>
            <option value="ARS">🇦🇷 Peso Argentino (ARS)</option>
            <option value="COP">🇨🇴 Peso Colombiano (COP)</option>
          </select>
        </div>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-full gradient-primary text-white font-semibold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-lg"
        >
          Continuar
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}

// Step 2: Select Pockets
function Step2SelectPockets({ 
  data, 
  onUpdate, 
  onNext,
  onBack 
}: { 
  data: SetupData
  onUpdate: (data: Partial<SetupData>) => void
  onNext: () => void
  onBack: () => void 
}) {
  const togglePocket = (id: string) => {
    const current = data.selectedPockets
    if (current.includes(id)) {
      onUpdate({ selectedPockets: current.filter(p => p !== id) })
    } else {
      onUpdate({ selectedPockets: [...current, id] })
    }
  }

  const selectAll = () => {
    onUpdate({ selectedPockets: defaultPockets.map(p => p.id) })
  }

  const selectNone = () => {
    onUpdate({ selectedPockets: [] })
  }

  const isValid = data.selectedPockets.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        {/* Badge con mejor contraste */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-white mb-6 shadow-lg shadow-secondary/30">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-semibold">Paso 2 de 3</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Elige tus bolsillos
        </h1>
        <p className="text-lg text-slate-400">
          Selecciona las categorías que usarás para organizar tus gastos. Podrás agregar más después.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button 
          onClick={selectAll}
          className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          Seleccionar todos
        </button>
        <span className="text-slate-600">|</span>
        <button 
          onClick={selectNone}
          className="text-sm text-slate-400 hover:text-white font-semibold transition-colors"
        >
          Limpiar selección
        </button>
      </div>

      {/* Pockets grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {defaultPockets.map((pocket) => {
          const isSelected = data.selectedPockets.includes(pocket.id)
          return (
            <button
              key={pocket.id}
              onClick={() => togglePocket(pocket.id)}
              className={`relative p-5 rounded-2xl transition-all text-center group ${
                isSelected
                  ? 'bg-emerald-500/20 border-2 border-emerald-400'
                  : 'border-2 border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
              <div className="text-4xl mb-3">{pocket.emoji}</div>
              <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {pocket.name}
              </h3>
            </button>
          )
        })}
      </div>

      {/* Selection count */}
      <div className="text-center mb-8">
        <span className="text-slate-400 bg-slate-800 px-4 py-2 rounded-full">
          {data.selectedPockets.length} bolsillo{data.selectedPockets.length !== 1 ? 's' : ''} seleccionado{data.selectedPockets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-600 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 gradient-primary text-white font-semibold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          Continuar
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}

// Step 3: Set Budgets
function Step3SetBudgets({ 
  data, 
  onUpdate, 
  onNext,
  onBack,
  loading
}: { 
  data: SetupData
  onUpdate: (data: Partial<SetupData>) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}) {
  const selectedPocketData = defaultPockets.filter(p => data.selectedPockets.includes(p.id))
  
  const updateBudget = (id: string, value: number) => {
    onUpdate({ 
      budgets: { 
        ...data.budgets, 
        [id]: value 
      } 
    })
  }

  const totalBudget = Object.values(data.budgets).reduce((a, b) => a + b, 0)

  // Initialize budgets with suggested values if empty
  useEffect(() => {
    const initialBudgets: Record<string, number> = {}
    selectedPocketData.forEach(p => {
      if (data.budgets[p.id] === undefined) {
        initialBudgets[p.id] = p.suggested
      }
    })
    if (Object.keys(initialBudgets).length > 0) {
      onUpdate({ budgets: { ...data.budgets, ...initialBudgets } })
    }
  }, [data.selectedPockets])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CL')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        {/* Badge con mejor contraste */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white mb-6 shadow-lg shadow-accent/30">
          <CreditCard className="w-4 h-4" />
          <span className="text-sm font-semibold">Paso 3 de 3</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Define tus límites
        </h1>
        <p className="text-lg text-slate-400">
          ¿Cuánto quieres gastar máximo en cada bolsillo al mes?
        </p>
      </div>

      {/* Total budget card */}
      <div className="bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl p-6 border-2 border-primary/30 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm mb-1 font-medium">Presupuesto total mensual</p>
            <p className="text-4xl font-bold text-white">${formatCurrency(totalBudget)}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Budget inputs */}
      <div className="space-y-4 mb-8">
        {selectedPocketData.map((pocket) => (
          <div 
            key={pocket.id}
            className="bg-slate-800 rounded-2xl p-5 border-2 border-slate-600"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{pocket.emoji}</div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">{pocket.name}</h3>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={data.budgets[pocket.id] || ''}
                    onChange={(e) => updateBudget(pocket.id, parseInt(e.target.value) || 0)}
                    placeholder={pocket.suggested.toString()}
                    className="w-full bg-slate-700 border-2 border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-600 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="flex-1 gradient-primary text-white font-semibold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creando...
            </>
          ) : (
            <>
              ¡Listo, empezar!
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Step 4: Success
function StepSuccess() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Animated celebration */}
      <div className="relative mb-8">
        <div className="absolute inset-0 gradient-primary rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="relative w-32 h-32 mx-auto rounded-full gradient-primary flex items-center justify-center animate-scale-in shadow-2xl shadow-primary/50">
          <PartyPopper className="w-16 h-16 text-white" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
        ¡Todo listo! 🎉
      </h1>
      <p className="text-xl text-slate-300 mb-8 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
        Tu espacio está configurado. Ya puedes empezar a organizar tu dinero.
      </p>
      
      <div className="animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
        <p className="text-slate-500">
          Redirigiendo al dashboard...
        </p>
      </div>
    </div>
  )
}

// Main Setup Page
export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SetupData>({
    groupName: '',
    currency: 'CLP',
    selectedPockets: ['food', 'transport', 'entertainment', 'services'],
    budgets: {},
  })

  const updateData = (newData: Partial<SetupData>) => {
    setData(prev => ({ ...prev, ...newData }))
  }

  const handleComplete = async () => {
    setLoading(true)
    
    try {
      // Crear grupo
      const groupResponse = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.groupName,
          currency: data.currency,
        }),
      })
      
      if (!groupResponse.ok) throw new Error('Error al crear grupo')
      
      const { group } = await groupResponse.json()
      
      // Crear categorías (bolsillos)
      for (const pocketId of data.selectedPockets) {
        const pocket = defaultPockets.find(p => p.id === pocketId)
        if (!pocket) continue
        
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: group.id,
            name: pocket.name,
            icon: pocket.emoji,
            color: pocket.color,
            monthlyLimit: data.budgets[pocketId] || pocket.suggested,
            isPersonal: false,
          }),
        })
      }
      
      // Mostrar pantalla de éxito
      setStep(4)
    } catch (error) {
      console.error('Error en setup:', error)
      alert('Hubo un error al configurar tu espacio. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-mesh opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Bolsillos</span>
        </Link>
      </header>
      
      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12">
        {step < 4 && <StepIndicator currentStep={step} totalSteps={3} />}
        
        {step === 1 && (
          <Step1CreateGroup 
            data={data} 
            onUpdate={updateData} 
            onNext={() => setStep(2)} 
          />
        )}
        {step === 2 && (
          <Step2SelectPockets 
            data={data} 
            onUpdate={updateData} 
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3SetBudgets 
            data={data} 
            onUpdate={updateData} 
            onNext={handleComplete}
            onBack={() => setStep(2)}
            loading={loading}
          />
        )}
        {step === 4 && <StepSuccess />}
      </main>
    </div>
  )
}
