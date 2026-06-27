'use client'

import { AISignal } from '@/types'
import { TrendingDown, TrendingUp, Minus, X } from 'lucide-react'

interface Props {
  signal: AISignal
  onClose?: () => void
}

const directionConfig = {
  OVERPRICED: {
    label: 'Overpriced',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: TrendingDown,
  },
  UNDERPRICED: {
    label: 'Underpriced',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: TrendingUp,
  },
  FAIRLY_PRICED: {
    label: 'Fair',
    color: 'text-gray-400',
    bg: 'bg-gray-700/50 border-gray-600/30',
    icon: Minus,
  },
}

export default function SignalCard({ signal, onClose }: Props) {
  const cfg = directionConfig[signal.direction]
  const Icon = cfg.icon

  return (
    <div className={`rounded-xl border p-5 ${cfg.bg} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-gray-500">Confidence</p>
            <p className="text-sm font-semibold text-gray-200">{signal.confidenceScore}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Edge</p>
            <p className="text-sm font-semibold text-gray-200">~{signal.edge}pp</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">{signal.rationale}</p>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-full rounded-full transition-all ${signal.confidenceScore >= 70 ? 'bg-emerald-500' : signal.confidenceScore >= 40 ? 'bg-amber-500' : 'bg-gray-500'}`}
            style={{ width: `${signal.confidenceScore}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 shrink-0">{signal.confidenceScore}/100</span>
      </div>
    </div>
  )
}
