'use client'

import { BarChart3, TrendingUp, Award, Activity } from 'lucide-react'

const MOCK_PERFORMANCE = [
  { month: 'Jan', pnl: 12, markets: 3 },
  { month: 'Feb', pnl: -5, markets: 2 },
  { month: 'Mar', pnl: 28, markets: 5 },
  { month: 'Apr', pnl: 15, markets: 4 },
  { month: 'May', pnl: 8, markets: 3 },
  { month: 'Jun', pnl: 31, markets: 6 },
]

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = Math.abs(value) / max * 100
  const positive = value >= 0
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-4 bg-gray-800 rounded overflow-hidden flex items-center">
        {positive ? (
          <div className="ml-auto" style={{ width: `${pct}%` }}>
            <div className="h-full bg-emerald-500 rounded" />
          </div>
        ) : (
          <div className="ml-auto" style={{ width: `${pct}%` }}>
            <div className="h-full bg-red-500 rounded" />
          </div>
        )}
      </div>
      <span className={`text-xs font-mono ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}{value}%
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const totalPnl = MOCK_PERFORMANCE.reduce((s, m) => s + m.pnl, 0)
  const wins = MOCK_PERFORMANCE.filter(m => m.pnl > 0).length
  const winRate = Math.round((wins / MOCK_PERFORMANCE.length) * 100)
  const avgEdge = Math.round(MOCK_PERFORMANCE.filter(m => m.pnl > 0).reduce((s, m) => s + m.pnl, 0) / wins)
  const totalMarkets = MOCK_PERFORMANCE.reduce((s, m) => s + m.markets, 0)
  const maxAbs = Math.max(...MOCK_PERFORMANCE.map(m => Math.abs(m.pnl)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Track your prediction market edge over time</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-gray-500">Total ROI</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">+{totalPnl}%</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{winRate}%</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-gray-500">Avg Edge (wins)</p>
          </div>
          <p className="text-2xl font-bold text-purple-400">+{avgEdge}%</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-gray-500">Markets Tracked</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{totalMarkets}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-5">Monthly P&amp;L</h2>
        <div className="space-y-3">
          {MOCK_PERFORMANCE.map(m => (
            <div key={m.month} className="flex items-center gap-4">
              <span className="text-xs text-gray-500 w-8 shrink-0">{m.month}</span>
              <MiniBar value={m.pnl} max={maxAbs} />
              <span className="text-xs text-gray-600">{m.markets} markets</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Data shown is illustrative. Connect Supabase to track your real performance.
      </p>
    </div>
  )
}
