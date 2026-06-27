'use client'

import { RefreshCw, Zap } from 'lucide-react'

export type SideFilter = 'ALL' | 'YES' | 'NO'
export type TierFilter = 'ALL' | 'STRONG' | 'TAKE'

interface Props {
  sideFilter: SideFilter
  tierFilter: TierFilter
  autoRefresh: boolean
  countdown: number
  loading: boolean
  onSide: (s: SideFilter) => void
  onTier: (t: TierFilter) => void
  onToggleAuto: () => void
  onRefresh: () => void
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { v: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-700 bg-gray-800 p-0.5">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            value === o.v ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function FeedControls({
  sideFilter,
  tierFilter,
  autoRefresh,
  countdown,
  loading,
  onSide,
  onTier,
  onToggleAuto,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Seg
        value={sideFilter}
        onChange={onSide}
        options={[
          { v: 'ALL', label: 'All' },
          { v: 'YES', label: 'Buy Yes' },
          { v: 'NO', label: 'Buy No' },
        ]}
      />
      <Seg
        value={tierFilter}
        onChange={onTier}
        options={[
          { v: 'ALL', label: 'All tiers' },
          { v: 'TAKE', label: 'Take+' },
          { v: 'STRONG', label: 'Strong' },
        ]}
      />
      <div className="flex-1" />
      <button
        onClick={onToggleAuto}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
          autoRefresh
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
        }`}
      >
        <Zap className="w-3.5 h-3.5" />
        Auto {autoRefresh ? `· ${countdown}s` : 'off'}
      </button>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  )
}
