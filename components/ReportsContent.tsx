'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

interface MonthlyData {
  month: string
  year: number
  monthNum: number
  expenses: number
  income: number
}

interface CategoryData {
  name: string
  icon: string
  color: string
  amount: number
}

interface ReportsContentProps {
  currency: string
  monthlyTrend: MonthlyData[]
  categoryData: CategoryData[]
  thisMonthExpenses: number
  thisMonthIncomes: number
  totalExpenses: number
  totalIncomes: number
  avgMonthlyExpenses: number
  avgMonthlyIncome: number
}

const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316']

function formatCurrency(amount: number, currency: string = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatCompact(amount: number) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`
  }
  return amount.toString()
}

export default function ReportsContent({
  currency,
  monthlyTrend,
  categoryData,
  thisMonthExpenses,
  thisMonthIncomes,
  totalExpenses,
  totalIncomes,
  avgMonthlyExpenses,
  avgMonthlyIncome,
}: ReportsContentProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')
  
  const balance = thisMonthIncomes - thisMonthExpenses
  const totalBalance = totalIncomes - totalExpenses
  
  // Calcular variación respecto al mes anterior
  const lastMonth = monthlyTrend[monthlyTrend.length - 2]
  const thisMonth = monthlyTrend[monthlyTrend.length - 1]
  const expenseChange = lastMonth?.expenses > 0 
    ? ((thisMonth?.expenses - lastMonth?.expenses) / lastMonth.expenses) * 100 
    : 0

  // Preparar datos para el pie chart
  const pieData = categoryData.map((cat, index) => ({
    name: cat.name,
    value: cat.amount,
    color: COLORS[index % COLORS.length],
  }))

  // Total para calcular porcentajes
  const totalCategoryAmount = categoryData.reduce((acc, cat) => acc + cat.amount, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-slate-400">Análisis de tus finanzas</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Este mes - Gastos */}
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Gastos este mes</span>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(thisMonthExpenses, currency)}
          </p>
          {expenseChange !== 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${expenseChange > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {expenseChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(expenseChange).toFixed(0)}% vs mes anterior
            </p>
          )}
        </div>

        {/* Este mes - Ingresos */}
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Ingresos este mes</span>
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(thisMonthIncomes, currency)}
          </p>
        </div>

        {/* Balance este mes */}
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Balance este mes</span>
            <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {balance >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(balance, currency)}
          </p>
        </div>

        {/* Promedio mensual */}
        <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-5 border border-primary/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 text-sm">Gasto promedio</span>
            <div className="p-2 bg-white/10 rounded-lg">
              <Calendar className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(avgMonthlyExpenses, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">por mes (6 meses)</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend chart */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Tendencia mensual</h3>
              <p className="text-sm text-slate-500">Últimos 6 meses</p>
            </div>
            <div className="flex rounded-lg bg-slate-700 p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'bar' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'line' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickFormatter={(value) => formatCompact(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                    }}
                    formatter={(value?: number) => [formatCurrency(value || 0, currency), '']}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickFormatter={(value) => formatCompact(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                    }}
                    formatter={(value?: number) => [formatCurrency(value || 0, currency), '']}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    name="Ingresos"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Gastos"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-400">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-slate-400">Gastos</span>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Gastos por categoría</h3>
              <p className="text-sm text-slate-500">Este mes</p>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          {pieData.length > 0 ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                      }}
                      formatter={(value?: number) => [formatCurrency(value || 0, currency), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category list */}
              <div className="space-y-3 mt-4 max-h-40 overflow-y-auto">
                {categoryData.map((cat, index) => {
                  const percentage = totalCategoryAmount > 0 
                    ? (cat.amount / totalCategoryAmount) * 100 
                    : 0
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm text-slate-300 flex-1 truncate">{cat.name}</span>
                      <span className="text-sm text-slate-500">{percentage.toFixed(0)}%</span>
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(cat.amount, currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-slate-500">No hay gastos este mes</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary totals */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Resumen (últimos 6 meses)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-1">Total ingresos</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIncomes, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Total gastos</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Balance total</p>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totalBalance, currency)}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        {totalIncomes > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Uso del ingreso</span>
              <span className={totalExpenses / totalIncomes > 1 ? 'text-red-400' : 'text-slate-400'}>
                {((totalExpenses / totalIncomes) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  totalExpenses / totalIncomes > 1 ? 'bg-red-500' : 
                  totalExpenses / totalIncomes > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min((totalExpenses / totalIncomes) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
