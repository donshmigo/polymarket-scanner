'use client'

import { useState, useEffect } from 'react'
import { WatchlistEntry } from '@/types'
import { ListChecks, TrendingUp, TrendingDown, Clock, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/watchlist')
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setItems(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    await fetch(`/api/watchlist/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleResolve(id: string, outcome: boolean) {
    setResolvingId(id)
    const entry = items.find(i => i.id === id)
    if (!entry) return

    const exitPrice = outcome ? 1.0 : 0.0
    const pnl = entry.position === 'YES'
      ? (exitPrice - entry.entry_price) / entry.entry_price * 100
      : (entry.entry_price - exitPrice) / entry.entry_price * 100

    const res = await fetch(`/api/watchlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true, outcome, exit_price: exitPrice, pnl: Math.round(pnl * 10) / 10 }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
    }
    setResolvingId(null)
  }

  const active = items.filter(i => !i.resolved)
  const resolved = items.filter(i => i.resolved)
  const wins = resolved.filter(i => (i.pnl ?? 0) > 0)
  const totalPnl = resolved.reduce((s, i) => s + (i.pnl ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <p className="text-gray-400 text-sm mt-1">Markets you&apos;re tracking — add them from the Scanner</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Active</p>
          <p className="text-lg font-semibold text-gray-100">{active.length}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Resolved</p>
          <p className="text-lg font-semibold text-gray-100">{resolved.length}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Win Rate</p>
          <p className={`text-lg font-semibold ${wins.length > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {resolved.length ? `${Math.round((wins.length / resolved.length) * 100)}%` : '—'}
          </p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Total P&amp;L</p>
          <p className={`text-lg font-semibold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {resolved.length ? `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-800 px-6 py-12 text-center">
          <ListChecks className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No markets tracked yet.</p>
          <p className="text-gray-600 text-xs mt-1">Go to Scanner and click the + button on any market.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-gray-300">Active ({active.length})</span>
              </div>
              <div className="divide-y divide-gray-800/60">
                {active.map(item => (
                  <div key={item.id} className="px-4 py-4 flex items-center gap-4 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-100 truncate">{item.question}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.position === 'YES' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{item.position}</span>
                        <span className="text-xs text-gray-500">Entry: {Math.round(item.entry_price * 100)}%</span>
                        <span className="text-xs text-gray-500">{item.entry_date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <span className="text-xs text-gray-500">Resolved?</span>
                      <button
                        onClick={() => handleResolve(item.id, true)}
                        disabled={resolvingId === item.id}
                        className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                      >
                        YES
                      </button>
                      <button
                        onClick={() => handleResolve(item.id, false)}
                        disabled={resolvingId === item.id}
                        className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                      >
                        NO
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Resolved ({resolved.length})</span>
              </div>
              <div className="divide-y divide-gray-800/60">
                {resolved.map(item => (
                  <div key={item.id} className="px-4 py-4 flex items-center gap-4 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 truncate">{item.question}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600">Entry: {Math.round(item.entry_price * 100)}%</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.outcome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          Resolved {item.outcome ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(item.pnl ?? 0) > 0
                        ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                        : <TrendingDown className="w-4 h-4 text-red-400" />}
                      <span className={`text-sm font-medium ${(item.pnl ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(item.pnl ?? 0) > 0 ? '+' : ''}{item.pnl?.toFixed(1)}%
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
