import { NextResponse } from 'next/server'
import { fetchFilteredMarkets } from '@/lib/polymarket'
import { analyzeMarket } from '@/lib/claude'
import { scoreOpportunity, rankTickets, preRankScore } from '@/lib/score'
import { getCachedSignals, upsertSignal, isStale } from '@/lib/signals-cache'
import { AISignal, ScoredTicket } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Cap how many markets we spend a Claude call on per load (cost + latency guard).
const ANALYZE_CAP = 10

export async function GET() {
  const generatedAt = new Date().toISOString()

  let markets
  try {
    markets = await fetchFilteredMarkets({
      minProbability: 0.05,
      maxProbability: 0.97,
      minVolume: 10000,
      maxDays: 60,
      maxPages: 8,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 502 })
  }

  // Cheap pre-rank decides which markets are worth a Claude call.
  const ranked = [...markets].sort((a, b) => preRankScore(b) - preRankScore(a))

  // Reuse cached signals; only (re)analyze uncached or stale top candidates.
  const cached = await getCachedSignals(ranked.map(m => m.id))
  const toAnalyze = ranked
    .filter(m => {
      const c = cached[m.id]
      return !c || isStale(c, m)
    })
    .slice(0, ANALYZE_CAP)

  const freshResults = await Promise.all(toAnalyze.map(m => analyzeMarket(m)))
  const fresh: Record<string, AISignal> = {}
  const writes: Promise<void>[] = []
  for (const s of freshResults) {
    if (s) {
      fresh[s.marketId] = s
      writes.push(upsertSignal(s))
    }
  }
  await Promise.all(writes)

  // Score every market that has a signal (fresh wins over cached).
  const tickets: ScoredTicket[] = []
  for (const m of markets) {
    const signal = fresh[m.id] ?? cached[m.id]
    if (!signal) continue
    tickets.push(scoreOpportunity(m, signal))
  }

  const live = tickets.filter(t => t.tier !== 'AVOID')
  const filtered = tickets.filter(t => t.tier === 'AVOID')

  return NextResponse.json({
    tickets: rankTickets(live),
    filtered: rankTickets(filtered).slice(0, 30),
    analyzed: toAnalyze.length,
    scanned: markets.length,
    generatedAt,
  })
}
