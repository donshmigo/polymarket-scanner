'use client'

import { LivePosition } from '@/types'
import { getMarketUrl } from '@/lib/polymarket'
import { ExternalLink, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react'

const driftStyles: Record<string, { label: string; className: string }> = {
  ON_TRACK: { label: 'On track', className: 'bg-emerald-500/10 text-emerald-400' },
  REVIEW: { label: 'Review', className: 'bg-amber-500/10 text-amber-400' },
  RESOLVING_SOON: { label: 'Resolving soon', className: 'bg-blue-500/10 text-blue-400' },
}

interface Props {
  positions: LivePosition[]
  busyId?: string | null
  onResolve: (id: string, outcome: boolean) => void
  onReanalyze: (p: LivePosition) => void
  onDelete: (id: string) => void
}

export default function TrackedPositions({ positions, busyId, onResolve, onReanalyze, onDelete }: Props) {
  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 px-6 py-8 text-center">
        <p className="text-sm text-gray-500">No open positions.</p>
        <p className="text-xs text-gray-600 mt-1">Track a recommendation above to monitor it live.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden divide-y divide-gray-800/60">
      {positions.map(p => {
        const drift = driftStyles[p.drift] ?? driftStyles.ON_TRACK
        const pnl = p.unrealizedPnl
        return (
          <div key={p.entry.id} className="px-4 py-3 flex items-center gap-3 group">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-100 truncate">{p.entry.question}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    p.entry.position === 'YES'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {p.entry.position}
                </span>
                <span className="text-xs text-gray-500">entry {Math.round(p.entry.entry_price * 100)}%</span>
                <span className="text-xs text-gray-500">
                  now {p.currentSidePrice != null ? `${Math.round(p.currentSidePrice * 100)}%` : '—'}
                </span>
                {p.daysToResolution != null && (
                  <span className="text-xs text-gray-500">{p.daysToResolution}d left</span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded ${drift.className}`}>{drift.label}</span>
                {p.recoChanged && (
                  <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> reco changed
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={`text-sm font-semibold ${
                  pnl == null ? 'text-gray-500' : pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {pnl == null ? '—' : `${pnl >= 0 ? '+' : ''}${pnl}%`}
              </p>
              <p className="text-[10px] text-gray-600">indicative</p>
            </div>

            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={getMarketUrl(p)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-colors"
                title="Trade on Polymarket"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => onReanalyze(p)}
                disabled={busyId === p.entry.id}
                className="p-1.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition-colors"
                title="Re-analyze"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${busyId === p.entry.id ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => onResolve(p.entry.id, true)}
                className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                Won
              </button>
              <button
                onClick={() => onResolve(p.entry.id, false)}
                className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Lost
              </button>
              <button
                onClick={() => onDelete(p.entry.id)}
                className="p-1.5 rounded-md text-gray-600 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
