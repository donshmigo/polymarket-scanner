'use client'

import { useState, useMemo } from 'react'
import { ParsedMarket, AISignal, SortConfig } from '@/types'
import { getMarketUrl } from '@/lib/polymarket'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Plus, Check, TrendingDown, TrendingUp, Minus, Loader } from 'lucide-react'

interface Props {
  markets: ParsedMarket[]
  signals?: Record<string, AISignal>
  watchlistAdded?: Set<string>
  onAddToWatchlist?: (market: ParsedMarket) => void
  onAnalyze?: (market: ParsedMarket) => void
}

type SortableKey = 'yesPrice' | 'volumeNum' | 'endDate' | 'daysToResolution'

function SortIcon({ column, sort }: { column: SortableKey; sort: SortConfig | null }) {
  if (!sort || sort.key !== column) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
  return sort.direction === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
    : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
}

function ProbBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-sm font-semibold">{pct}%</span>
    </div>
  )
}

function SignalBadge({ signal }: { signal: AISignal }) {
  const cfg = {
    OVERPRICED: { label: 'Over', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: TrendingDown },
    UNDERPRICED: { label: 'Under', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
    FAIRLY_PRICED: { label: 'Fair', color: 'text-gray-400 bg-gray-700/50 border-gray-600/30', icon: Minus },
  }[signal.direction]
  const Icon = cfg.icon
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label} {signal.confidenceScore}%
    </div>
  )
}

function formatVol(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

export default function MarketTable({ markets, signals = {}, watchlistAdded = new Set(), onAddToWatchlist, onAnalyze }: Props) {
  const [sort, setSort] = useState<SortConfig | null>({ key: 'daysToResolution', direction: 'asc' })
  const [search, setSearch] = useState('')

  function toggleSort(key: SortableKey) {
    setSort(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
  }

  const filtered = useMemo(() => {
    let rows = markets
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(m => m.question.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q))
    }
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort.key as keyof ParsedMarket] as string | number
        const bv = b[sort.key as keyof ParsedMarket] as string | number
        if (typeof av === 'string' && typeof bv === 'string') {
          return sort.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
        }
        return sort.direction === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
      })
    }
    return rows
  }, [markets, sort, search])

  const Th = ({ col, label }: { col: SortableKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors"
      onClick={() => toggleSort(col)}
    >
      <div className="flex items-center gap-1.5">{label}<SortIcon column={col} sort={sort} /></div>
    </th>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <span className="text-sm text-gray-500 shrink-0">{filtered.length} markets</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Market</th>
              <Th col="yesPrice" label="YES Prob." />
              <Th col="daysToResolution" label="Resolves In" />
              <Th col="volumeNum" label="Volume" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">AI Signal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                  No markets match current filters.
                </td>
              </tr>
            )}
            {filtered.map(m => {
              const signal = signals[m.id]
              const days = m.daysToResolution
              const urgency = days <= 7 ? 'text-red-400 font-semibold' : days <= 21 ? 'text-amber-400' : 'text-gray-400'
              const added = watchlistAdded.has(m.id)

              return (
                <tr key={m.id} className={`hover:bg-gray-800/40 transition-colors group ${signal && signal.direction !== 'FAIRLY_PRICED' && signal.confidenceScore >= 60 ? 'border-l-2 border-l-emerald-500/40' : ''}`}>
                  <td className="px-4 py-4 max-w-xs">
                    <a
                      href={getMarketUrl(m)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-100 hover:text-emerald-400 transition-colors flex items-start gap-1.5 group/link"
                    >
                      <span className="line-clamp-2 leading-snug">{m.question}</span>
                      <ExternalLink className="w-3 h-3 mt-0.5 opacity-0 group-hover/link:opacity-60 shrink-0 transition-opacity" />
                    </a>
                    {m.category && (
                      <span className="mt-1 inline-flex px-1.5 py-0.5 rounded text-xs bg-gray-800 text-gray-500">{m.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-4"><ProbBar value={m.yesPrice} /></td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-mono ${urgency}`}>{days}d</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono text-gray-300">{formatVol(m.volumeNum)}</span>
                  </td>
                  <td className="px-4 py-4">
                    {signal ? (
                      <SignalBadge signal={signal} />
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onAnalyze && !signal && (
                        <button
                          onClick={() => onAnalyze(m)}
                          className="px-2.5 py-1 text-xs rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                        >
                          Analyze
                        </button>
                      )}
                      {onAddToWatchlist && (
                        <button
                          onClick={() => !added && onAddToWatchlist(m)}
                          disabled={added}
                          className={`p-1.5 rounded-md border transition-colors ${
                            added
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-default'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400 border-gray-600 hover:border-emerald-500/30'
                          }`}
                        >
                          {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
