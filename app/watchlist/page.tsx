'use client'

import { useState } from 'react'
import { ListChecks, TrendingUp, TrendingDown, Clock } from 'lucide-react'

const PLACEHOLDER: Array<{
  id: string
  question: string
  entryPrice: number
  position: 'YES' | 'NO'
  entryDate: string
  resolved: boolean
  pnl?: number
}> = [
  {
    id: '1',
    question: 'Will the Federal Reserve cut rates by December 2025?',
    entryPrice: 0.82,
    position: 'YES',
    entryDate: '2025-01-10',
    resolved: false,
  },
  {
    id: '2',
    question: 'Will Elon Musk remain CEO of Tesla through 2025?',
    entryPrice: 0.78,
    position: 'YES',
    entryDate: '2025-02-01',
    resolved: true,
    pnl: 22,
  },
]

export default function WatchlistPage() {
  const [items] = useState(PLACEHOLDER)

  const resolved = items.filter(i => i.resolved)
  const active = items.filter(i => !i.resolved)
  const wins = resolved.filter(i => (i.pnl ?? 0) > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <p className="text-gray-400 text-sm mt-1">Markets you&apos;re tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Active</p>
          <p className="text-lg font-semibold text-gray-100">{active.length}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Win Rate</p>
          <p className="text-lg font-semibold text-emerald-400">
            {resolved.length ? `${Math.round((wins.length / resolved.length) * 100)}%` : '—'}
          </p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Total P&amp;L</p>
          <p className="text-lg font-semibold text-emerald-400">
            +{resolved.reduce((s, i) => s + (i.pnl ?? 0), 0)}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Tracked Markets</span>
        </div>
        <div className="divide-y divide-gray-800/60">
          {items.map(item => (
            <div key={item.id} className="px-4 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 truncate">{item.question}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.position === 'YES'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {item.position}
                  </span>
                  <span className="text-xs text-gray-500">Entry: {Math.round(item.entryPrice * 100)}%</span>
                  <span className="text-xs text-gray-500">{item.entryDate}</span>
                </div>
              </div>
              <div className="shrink-0">
                {item.resolved ? (
                  <div className="flex items-center gap-1.5">
                    {(item.pnl ?? 0) > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${(item.pnl ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(item.pnl ?? 0) > 0 ? '+' : ''}{item.pnl}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">Pending</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Add markets from the Scanner page. Full watchlist CRUD backed by Supabase once configured.
      </p>
    </div>
  )
}
