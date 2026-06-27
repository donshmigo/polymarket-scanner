'use client'

import { useState, useEffect } from 'react'
import { PortfolioPayload } from '@/types'
import { BarChart3, TrendingUp, Award, Activity, AlertCircle } from 'lucide-react'

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = (Math.abs(value) / max) * 100
  const positive = value >= 0
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-4 bg-gray-800 rounded overflow-hidden flex items-center">
        <div className="ml-auto" style={{ width: `${pct}%` }}>
          <div className={`h-full rounded ${positive ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>
      </div>
      <span className={`text-xs font-mono ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}
        {value}%
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<PortfolioPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/portfolio')
        if (!res.ok) throw new Error(`Error ${res.status}`)
        setData(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const k = data?.kpis
  const series = data?.series ?? []
  const maxAbs = Math.max(...series.map(s => Math.abs(s.pnl)), 1)
  const totalMarkets = (k?.resolvedCount ?? 0) + (k?.openCount ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance</h1>
        <p className="text-gray-400 text-sm mt-1">Your real prediction-market edge over time</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-gray-500">Realized ROI</p>
          </div>
          <p className={`text-2xl font-bold ${(k?.realizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {k ? `${k.realizedPnl >= 0 ? '+' : ''}${k.realizedPnl}%` : '—'}
          </p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{k?.winRate != null ? `${k.winRate}%` : '—'}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-gray-500">Avg P&amp;L (wins)</p>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {k?.avgEdgeOnWins != null ? `+${k.avgEdgeOnWins}%` : '—'}
          </p>
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
        <h2 className="text-sm font-semibold text-gray-300 mb-5">Realized P&amp;L by Month</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-800/50 rounded animate-pulse" />
            ))}
          </div>
        ) : series.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No resolved positions yet. Resolve trades on the Deck to build your track record.
          </p>
        ) : (
          <div className="space-y-3">
            {series.map(m => (
              <div key={m.label} className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-14 shrink-0">{m.label}</span>
                <MiniBar value={m.pnl} max={maxAbs} />
                <span className="text-xs text-gray-600">{m.markets} markets</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
