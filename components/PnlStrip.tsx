'use client'

import { PortfolioPayload, PerfPoint } from '@/types'
import { Wallet, TrendingUp, Award, Layers } from 'lucide-react'

function Sparkline({ series }: { series: PerfPoint[] }) {
  if (series.length === 0) return null
  const max = Math.max(...series.map(s => Math.abs(s.pnl)), 1)
  return (
    <div className="flex items-end gap-1 h-10">
      {series.map((s, i) => {
        const h = Math.max(2, (Math.abs(s.pnl) / max) * 40)
        const pos = s.pnl >= 0
        return (
          <div
            key={i}
            className={`w-1.5 rounded-sm ${pos ? 'bg-emerald-500/70' : 'bg-red-500/70'}`}
            style={{ height: `${h}px` }}
            title={`${s.label}: ${s.pnl >= 0 ? '+' : ''}${s.pnl}%`}
          />
        )
      })}
    </div>
  )
}

function Card({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: 'neutral' | 'pos' | 'neg'
}) {
  const color = tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-gray-100'
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

function pnlStr(v: number | null) {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v}%`
}

export default function PnlStrip({ data }: { data: PortfolioPayload | null }) {
  const k = data?.kpis
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Card icon={Layers} label="Open positions" value={k ? String(k.openCount) : '—'} />
      <Card
        icon={Wallet}
        label="Unrealized P&L"
        value={k ? pnlStr(k.unrealizedPnl) : '—'}
        tone={k?.unrealizedPnl != null ? (k.unrealizedPnl >= 0 ? 'pos' : 'neg') : 'neutral'}
      />
      <Card
        icon={TrendingUp}
        label="Realized P&L"
        value={k ? pnlStr(k.realizedPnl) : '—'}
        tone={k?.realizedPnl != null ? (k.realizedPnl >= 0 ? 'pos' : 'neg') : 'neutral'}
      />
      <Card
        icon={Award}
        label="Win rate"
        value={k?.winRate != null ? `${k.winRate}%` : '—'}
        tone={k?.winRate != null && k.winRate >= 50 ? 'pos' : 'neutral'}
      />
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 flex flex-col justify-between">
        <p className="text-xs text-gray-500 mb-1">Realized trend</p>
        {data && data.series.length > 0 ? (
          <Sparkline series={data.series} />
        ) : (
          <p className="text-xs text-gray-600">No resolved trades yet</p>
        )}
      </div>
    </div>
  )
}
