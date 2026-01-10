export default function SettingsLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-slate-400 text-sm">Cargando configuración...</p>
      </div>
    </div>
  )
}
