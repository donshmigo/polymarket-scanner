'use client'

import { ScoredTicket } from '@/types'
import { getMarketUrl } from '@/lib/polymarket'
import { ExternalLink, Plus, Check } from 'lucide-react'
import MomentumSpark from './MomentumSpark'
import ExecBadge from './ExecBadge'

interface Props {
  ticket: ScoredTicket
  tracked?: boolean
  onTrack?: (ticket: ScoredTicket) => void
}

const tierStyles: Record<string, { ring: string; chip: string; border: string }> = {
  STRONG: { ring: 'text-emerald-300', chip: '', border: '' },
  TAKE: { ring: 'text-blue-300', chip: '', border: '' },
  WATCH: { ring: 'text-gray-400', chip: '', border: '' },
  AVOID: { ring: 'text-gray-500', chip: '', border: '' },
}

export default function SignalTicket({ ticket, tracked, onTrack }: Props) {
  const { market, signal, score, action, side, tier, edgePp } = ticket
  const isYes = side === 'YES'
  const entryPrice = isYes ? market.yesPrice : market.noPrice

  const actionColor = isYes
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : 'bg-red-500/15 text-red-300 border-red-500/30'

  const borderAccent =
    tier === 'STRONG'
      ? isYes
        ? 'border-l-2 border-l-emerald-500'
        : 'border-l-2 border-l-red-500'
      : 'border-l-2 border-l-transparent'

  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 60 ? 'text-blue-400' : 'text-gray-400'

  const days = market.daysToResolution

  return (
    <div className={`bg-gray-900/70 border border-gray-800 ${borderAccent} rounded-xl px-4 py-3.5 hover:bg-gray-900 transition-colors`}>
      <div className="flex items-start gap-3">
        {/* Score */}
        <div className="shrink-0 text-center w-12">
          <div className={`text-xl font-bold ${scoreColor} leading-none`}>{score}</div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mt-1">{tier}</div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${actionColor}`}>
              {action} @ {Math.round(entryPrice * 100)}%
            </span>
            <span className="text-xs text-gray-400">
              edge <span className="text-gray-200 font-medium">{edgePp > 0 ? '+' : ''}{edgePp.toFixed(0)}pp</span>
            </span>
            <span className="text-xs text-gray-400">
              conviction <span className="text-gray-200 font-medium">{signal.confidenceScore}</span>
            </span>
            <span className="text-xs text-gray-400">
              resolves <span className={`font-medium ${days <= 7 ? 'text-amber-300' : 'text-gray-200'}`}>{days}d</span>
            </span>
            <MomentumSpark day={market.oneDayPriceChange} hour={market.oneHourPriceChange} />
            <ExecBadge spread={market.spread} liquidity={market.liquidity} />
          </div>

          <p className="text-sm text-gray-100 leading-snug line-clamp-2">{market.question}</p>
          {signal.rationale && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{signal.rationale}</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <a
            href={getMarketUrl(market)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            Trade <ExternalLink className="w-3 h-3" />
          </a>
          {onTrack && (
            <button
              onClick={() => !tracked && onTrack(ticket)}
              disabled={tracked}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                tracked
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
              }`}
            >
              {tracked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {tracked ? 'Tracked' : 'Track'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
