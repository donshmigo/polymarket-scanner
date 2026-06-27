import { AISignal, ParsedMarket, ScoredTicket, Side, Action, Tier } from '@/types'

const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x))

/** Edge in percentage points: how far true probability sits above/below the market YES price. */
export function deriveEdge(trueProbability: number, yesPrice: number): number {
  return (trueProbability - yesPrice) * 100
}

/**
 * OpportunityScore — the single source of truth for ranking recommendations.
 *
 * Combines AI conviction + AI edge + confirming 24h momentum + near-term urgency +
 * liquidity depth, multiplied by an executability factor (spread). Hard gates force
 * the score to 0 and route the ticket into the "filtered" drawer with a reason.
 *
 * Every input has an explicit neutral fallback so missing Gamma fields never NaN-poison
 * the score.
 */
export function scoreOpportunity(market: ParsedMarket, signal: AISignal): ScoredTicket {
  const yesPrice = market.yesPrice

  // Prefer edge derived from the model's trueProbability; fall back to the signed legacy edge.
  let edgePp: number
  if (typeof signal.trueProbability === 'number') {
    edgePp = deriveEdge(signal.trueProbability, yesPrice)
  } else {
    const sign = signal.direction === 'OVERPRICED' ? -1 : signal.direction === 'UNDERPRICED' ? 1 : 0
    edgePp = sign * Math.abs(signal.edge ?? 0)
  }

  const absEdge = Math.abs(edgePp)
  const side: Side = edgePp >= 0 ? 'YES' : 'NO'
  const action: Action = side === 'YES' ? 'BUY YES' : 'BUY NO'

  // ---- Hard gates ---------------------------------------------------------
  const gatesFailed: string[] = []
  const spreadFrac =
    market.spread ?? (market.bestAsk != null && market.bestBid != null ? market.bestAsk - market.bestBid : null)

  if (signal.direction === 'FAIRLY_PRICED' || absEdge < 3) gatesFailed.push('fairly priced')
  if (signal.confidenceScore < 55) gatesFailed.push('low conviction')
  if (market.daysToResolution <= 0 || market.daysToResolution > 60) gatesFailed.push('out of window')
  if (market.volumeNum < 10000) gatesFailed.push('thin volume')
  if (spreadFrac != null && spreadFrac > 0.1) gatesFailed.push('spread too wide')
  if (!market.slug && !market.conditionId) gatesFailed.push('no deep link')

  // ---- Sub-scores (each clamped to 0..1) ----------------------------------
  const sConv = clamp(signal.confidenceScore / 100)
  const sEdge = clamp(absEdge / 15)

  const rawMove = market.oneDayPriceChange
  let sMom: number
  if (typeof rawMove === 'number') {
    const aligned = side === 'YES' ? rawMove : -rawMove // confirming move only
    sMom = clamp(aligned / 0.08)
  } else {
    sMom = 0.4 // mild-neutral, not rewarded
  }

  const sTime = clamp((45 - market.daysToResolution) / 45, 0.1, 1)

  const sLiq =
    0.5 * clamp((market.volume24hr ?? 0) / 100000) + 0.5 * clamp(market.volumeNum / 500000)

  const raw = 0.3 * sConv + 0.26 * sEdge + 0.18 * sMom + 0.14 * sTime + 0.12 * sLiq

  // ---- Executability multiplier -------------------------------------------
  const exec =
    spreadFrac == null
      ? 0.8
      : spreadFrac <= 0.02
        ? 1.0
        : spreadFrac <= 0.05
          ? 0.85
          : spreadFrac <= 0.1
            ? 0.6
            : 0.35

  const score = gatesFailed.length > 0 ? 0 : Math.round(100 * raw * exec)

  // ---- Tier ---------------------------------------------------------------
  let tier: Tier
  if (gatesFailed.length > 0 || score < 45) tier = 'AVOID'
  else if (score >= 75) tier = 'STRONG'
  else if (score >= 60) tier = 'TAKE'
  else tier = 'WATCH'

  return { market, signal, score, action, side, tier, edgePp, gatesFailed }
}

/** Rank: score desc, then sooner resolution, then larger edge. */
export function rankTickets(tickets: ScoredTicket[]): ScoredTicket[] {
  return [...tickets].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.market.daysToResolution !== b.market.daysToResolution)
      return a.market.daysToResolution - b.market.daysToResolution
    return Math.abs(b.edgePp) - Math.abs(a.edgePp)
  })
}

/** Cheap pre-rank used before spending Claude calls: near-term, executable, liquid. */
export function preRankScore(m: ParsedMarket): number {
  const time = clamp((60 - m.daysToResolution) / 60, 0, 1)
  const vol = clamp(m.volumeNum / 500000)
  const v24 = clamp((m.volume24hr ?? 0) / 100000)
  const spreadFrac = m.spread ?? (m.bestAsk != null && m.bestBid != null ? m.bestAsk - m.bestBid : null)
  const exec = spreadFrac == null ? 0.7 : clamp(1 - spreadFrac / 0.05)
  return 0.4 * time + 0.25 * vol + 0.2 * v24 + 0.15 * exec
}
