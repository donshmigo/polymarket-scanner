import { supabase } from '@/lib/supabase'
import { AISignal, ParsedMarket } from '@/types'

interface SignalRow {
  id: string
  market_id: string
  question: string
  yes_price: number | string
  confidence_score: number
  direction: AISignal['direction']
  rationale: string
  edge: number | string
  score: number | string | null
  created_at: string
}

function rowToSignal(r: SignalRow): AISignal {
  return {
    marketId: r.market_id,
    question: r.question,
    yesPrice: Number(r.yes_price),
    confidenceScore: r.confidence_score,
    direction: r.direction,
    rationale: r.rationale,
    edge: Number(r.edge),
    score: Number(r.score ?? 0),
    createdAt: r.created_at,
  }
}

/** Latest cached signal per market_id, keyed by marketId. Returns {} on any error. */
export async function getCachedSignals(marketIds: string[]): Promise<Record<string, AISignal>> {
  if (marketIds.length === 0) return {}
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .in('market_id', marketIds)
    .order('created_at', { ascending: false })

  if (error || !data) return {}

  const latest: Record<string, AISignal> = {}
  for (const row of data as SignalRow[]) {
    if (!latest[row.market_id]) latest[row.market_id] = rowToSignal(row)
  }
  return latest
}

/** Persist a signal (append-only history; latest wins on read). Best-effort. */
export async function upsertSignal(signal: AISignal): Promise<void> {
  try {
    await supabase.from('signals').insert({
      market_id: signal.marketId,
      question: signal.question,
      yes_price: signal.yesPrice,
      confidence_score: signal.confidenceScore,
      direction: signal.direction,
      rationale: signal.rationale,
      edge: signal.edge,
      score: signal.score,
    })
  } catch {
    // caching is best-effort — never block the feed on a write failure
  }
}

/** A cached signal is stale if older than 45 min or the price moved more than 3pp. */
export function isStale(signal: AISignal, market: ParsedMarket): boolean {
  const ageMin = (Date.now() - new Date(signal.createdAt).getTime()) / 60000
  return ageMin > 45 || Math.abs(market.yesPrice - signal.yesPrice) > 0.03
}
