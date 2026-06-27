import { Gauge } from 'lucide-react'

function fmt(v?: number) {
  if (v == null) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${Math.round(v)}`
}

export default function ExecBadge({ spread, liquidity }: { spread?: number; liquidity?: number }) {
  const color =
    spread == null
      ? 'text-amber-400'
      : spread <= 0.02
        ? 'text-emerald-400'
        : spread <= 0.05
          ? 'text-emerald-400'
          : spread <= 0.1
            ? 'text-amber-400'
            : 'text-red-400'

  const spreadLabel = spread == null ? 'spread n/a' : `${(spread * 100).toFixed(1)}¢ spread`

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`} title={`Liquidity ${fmt(liquidity)}`}>
      <Gauge className="w-3 h-3" />
      {spreadLabel}
      <span className="text-gray-600">·</span>
      <span className="text-gray-400">{fmt(liquidity)}</span>
    </span>
  )
}
