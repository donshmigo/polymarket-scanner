import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchMarketsByIds } from '@/lib/polymarket'
import { getCachedSignals } from '@/lib/signals-cache'
import { WatchlistEntry, LivePosition, PerfPoint, Drift, PortfolioPayload } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export async function GET() {
  const generatedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as WatchlistEntry[]
  const open = rows.filter(r => !r.resolved)
  const resolved = rows.filter(r => r.resolved)

  // Live re-price open positions + pull latest signal to detect reco changes.
  const priceMap = await fetchMarketsByIds(open.map(r => r.market_id))
  const signals = await getCachedSignals(open.map(r => r.market_id))

  const openPositions: LivePosition[] = open.map(entry => {
    const mk = priceMap[entry.market_id] ?? null
    const currentYes = mk ? mk.yesPrice : null
    const entryYes = entry.position === 'YES' ? entry.entry_price : 1 - entry.entry_price
    const currentSidePrice =
      currentYes == null ? null : entry.position === 'YES' ? currentYes : 1 - currentYes

    const unrealizedPnl =
      currentSidePrice == null || !entry.entry_price
        ? null
        : Math.round(((currentSidePrice - entry.entry_price) / entry.entry_price) * 1000) / 10

    const days = mk ? mk.daysToResolution : null
    const movedFavor =
      currentYes == null ? 0 : (entry.position === 'YES' ? currentYes - entryYes : entryYes - currentYes) * 100

    let drift: Drift = 'ON_TRACK'
    if (movedFavor <= -8) drift = 'REVIEW'
    else if (days != null && days < 5 && currentYes != null && Math.abs(currentYes - entryYes) < 0.02)
      drift = 'RESOLVING_SOON'

    const sig = signals[entry.market_id]
    const recoChanged =
      !!sig &&
      ((sig.direction === 'UNDERPRICED' && entry.position === 'NO') ||
        (sig.direction === 'OVERPRICED' && entry.position === 'YES'))

    return {
      entry,
      currentYes,
      currentSidePrice,
      unrealizedPnl,
      daysToResolution: days,
      drift,
      recoChanged,
      slug: mk?.slug,
      conditionId: mk?.conditionId,
    }
  })

  // Realized performance series, grouped by month of entry.
  const byMonth = new Map<string, { pnl: number; markets: number; sort: number }>()
  for (const r of resolved) {
    const key = monthLabel(r.entry_date)
    const sortKey = new Date(r.entry_date).getTime() || 0
    const cur = byMonth.get(key) ?? { pnl: 0, markets: 0, sort: sortKey }
    cur.pnl += r.pnl ?? 0
    cur.markets += 1
    cur.sort = Math.min(cur.sort || sortKey, sortKey)
    byMonth.set(key, cur)
  }
  const series: PerfPoint[] = [...byMonth.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .map(([label, v]) => ({ label, pnl: Math.round(v.pnl * 10) / 10, markets: v.markets }))

  const wins = resolved.filter(r => (r.pnl ?? 0) > 0)
  const unrealizedVals = openPositions.map(p => p.unrealizedPnl).filter((v): v is number => v != null)
  const realizedPnl = Math.round(resolved.reduce((s, r) => s + (r.pnl ?? 0), 0) * 10) / 10

  const payload: PortfolioPayload = {
    openPositions,
    kpis: {
      openCount: open.length,
      unrealizedPnl: unrealizedVals.length
        ? Math.round(unrealizedVals.reduce((s, v) => s + v, 0) * 10) / 10
        : null,
      realizedPnl,
      winRate: resolved.length ? Math.round((wins.length / resolved.length) * 100) : null,
      resolvedCount: resolved.length,
      avgEdgeOnWins: wins.length
        ? Math.round((wins.reduce((s, r) => s + (r.pnl ?? 0), 0) / wins.length) * 10) / 10
        : null,
    },
    series,
    generatedAt,
  }

  return NextResponse.json(payload)
}
