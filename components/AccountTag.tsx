import { CreditCard, Landmark } from 'lucide-react'

// Tag de proveniencia del gasto: 💳 tarjeta / 🏦 cuenta corriente (iconos Lucide, no emojis).
export default function AccountTag({
  accountType,
  iconOnly = false,
  className = '',
}: {
  accountType: string
  iconOnly?: boolean
  className?: string
}) {
  const isCredit = accountType === 'credit'
  const Icon = isCredit ? CreditCard : Landmark
  const label = isCredit ? 'Tarjeta' : 'Cuenta corriente'
  const title = isCredit
    ? 'Compra con tarjeta de crédito (se paga el próximo mes)'
    : 'Movimiento de tu cuenta corriente'

  if (iconOnly) {
    return (
      <span className={`inline-flex items-center text-slate-500 ${className}`} title={title}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-700/60 text-slate-400 text-[11px] font-medium ${className}`}
      title={title}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </span>
  )
}
