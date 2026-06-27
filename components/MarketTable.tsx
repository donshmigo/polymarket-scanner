'use client'

import { useState, useMemo } from 'react'
import { ParsedMarket, SortConfig } from '@/types'
import { getMarketUrl } from '@/lib/polymarket'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Plus } from 'lucide-react'

interface Props {
  markets: ParsedMarket[]
  onAddToWatchlist?: (market: ParsedMarket) => void
  onAnalyze?: (market: ParsedMarket) => void
}

type SortableKey = 'yesPrice' | 'volumeNum' | 'endDate' | 'question'

function SortIcon({ column, sort }: { column: SortableKey; sort: SortConfig | null }) {
  if (!sort || sort.key !== column) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
  return sort.direction === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
    : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
}

function ProbabilityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-sm font-semibold">{pct}%</span>
    </div>
  )
}

function formatVolume(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

function formatDate(d: string) {
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(d: string): number {
  const diff = new Date(d).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function MarketTable({ markets, onAddToWatchlist, onAnalyze }: Props) {
  const [sort, setSort] = useState<SortConfig | null>({ key: 'volumeNum', direction: 'desc' })
  const [search, setSearch] = useState('')

  function toggleSort(key: SortableKey) {
    setSort(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
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
      <div className="flex items-center gap-1.5">
        {label}
        <SortIcon column={col} sort={sort} />
      </div>
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
              <Th col="question" label="Market" />
              <Th col="yesPrice" label="YES Prob." />
              <Th col="volumeNum" label="Volume" />
              <Th col="endDate" label="Resolves" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                  No markets match the current filters.
                </td>
              </tr>
            )}
            {filtered.map(m => {
              const days = daysUntil(m.endDate)
              const urgency = days <= 7 ? 'text-red-400' : days <= 30 ? 'text-amber-400' : 'text-gray-400'
              return (
                <tr key={m.id} className="hover:bg-gray-800/40 transition-colors group">
                  <td className="px-4 py-4 max-w-md">
                    <a
                      href={getMarketUrl(m)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-100 hover:text-emerald-400 transition-colors flex items-start gap-1.5 group/link"
                    >
                      <span className="line-clamp-2 leading-snug">{m.question}</span>
                      <ExternalLink className="w-3 h-3 mt-0.5 opacity-0 group-hover/link:opacity-60 shrink-0 transition-opacity" />
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <ProbabilityBar value={m.yesPrice} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono text-gray-300">{formatVolume(m.volumeNum)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-gray-300">{formatDate(m.endDate)}</p>
                      {!isNaN(days) && (
                        <p className={`text-xs mt-0.5 ${urgency}`}>
                          {days > 0 ? `${days}d left` : 'Expired'}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {m.category ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300">
                        {m.category}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onAnalyze && (
                        <button
                          onClick={() => onAnalyze(m)}
                          className="px-2.5 py-1 text-xs rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                        >
                          Analyze
                        </button>
                      )}
                      {onAddToWatchlist && (
                        <button
                          onClick={() => onAddToWatchlist(m)}
                          className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
