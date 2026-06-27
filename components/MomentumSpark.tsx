import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

export default function MomentumSpark({ day, hour }: { day?: number; hour?: number }) {
  if (day == null) return <span className="text-gray-600 text-xs">—</span>
  const up = day > 0
  const Icon = day === 0 ? Minus : up ? ArrowUp : ArrowDown
  const color = day === 0 ? 'text-gray-500' : up ? 'text-emerald-400' : 'text-red-400'
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono ${color}`}
      title={hour != null ? `1h: ${(hour * 100).toFixed(1)}pp` : undefined}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(day * 100).toFixed(1)}
    </span>
  )
}
