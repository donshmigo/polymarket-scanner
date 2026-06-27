export interface PolymarketMarket {
  id: string
  question: string
  description?: string
  outcomePrices: string[]
  outcomes: string[]
  volume: string
  volumeNum: number
  volumeClob?: number
  volume24hr?: number
  liquidity?: number
  liquidityNum?: number
  oneDayPriceChange?: number
  oneHourPriceChange?: number
  bestBid?: number
  bestAsk?: number
  spread?: number
  lastTradePrice?: number
  startDate: string
  endDate: string
  category?: string
  tags?: string[]
  active: boolean
  closed: boolean
  archived?: boolean
  image?: string
  slug?: string
  conditionId?: string
  groupItemTitle?: string
}

export interface ParsedMarket {
  id: string
  question: string
  description?: string
  yesPrice: number
  noPrice: number
  volumeNum: number
  liquidity?: number
  startDate: string
  endDate: string
  daysToResolution: number
  category?: string
  active: boolean
  closed: boolean
  image?: string
  slug?: string
  conditionId?: string
  // microstructure / momentum (optional — present on many but not all markets)
  volume24hr?: number
  oneDayPriceChange?: number
  oneHourPriceChange?: number
  bestBid?: number
  bestAsk?: number
  spread?: number
  lastTradePrice?: number
}

export interface AISignal {
  marketId: string
  question: string
  yesPrice: number
  trueProbability?: number
  confidenceScore: number
  direction: 'OVERPRICED' | 'UNDERPRICED' | 'FAIRLY_PRICED'
  rationale: string
  edge: number // absolute mispricing in percentage points
  score: number // OpportunityScore 0-100 (from lib/score.ts)
  createdAt: string
}

export type Side = 'YES' | 'NO'
export type Action = 'BUY YES' | 'BUY NO'
export type Tier = 'STRONG' | 'TAKE' | 'WATCH' | 'AVOID'

export interface ScoredTicket {
  market: ParsedMarket
  signal: AISignal
  score: number
  action: Action
  side: Side
  tier: Tier
  edgePp: number // signed: positive = BUY YES, negative = BUY NO
  gatesFailed: string[]
}

export interface WatchlistEntry {
  id: string
  market_id: string
  question: string
  entry_price: number
  entry_date: string
  position: Side
  resolved: boolean
  outcome?: boolean
  exit_price?: number
  pnl?: number
  notes?: string
  created_at: string
}

export type Drift = 'ON_TRACK' | 'REVIEW' | 'RESOLVING_SOON'

export interface LivePosition {
  entry: WatchlistEntry
  currentYes: number | null
  currentSidePrice: number | null
  unrealizedPnl: number | null // percent return, indicative (mark-to-market)
  daysToResolution: number | null
  drift: Drift
  recoChanged: boolean
  slug?: string
  conditionId?: string
}

export interface PerfPoint {
  label: string
  pnl: number
  markets: number
}

export interface PortfolioPayload {
  openPositions: LivePosition[]
  kpis: {
    openCount: number
    unrealizedPnl: number | null
    realizedPnl: number
    winRate: number | null
    resolvedCount: number
    avgEdgeOnWins: number | null
  }
  series: PerfPoint[]
  generatedAt: string
}

export interface RecommendationsPayload {
  tickets: ScoredTicket[]
  filtered: ScoredTicket[]
  analyzed: number
  scanned: number
  generatedAt: string
}

export interface SortConfig {
  key: keyof ParsedMarket
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  minProbability: number
  maxProbability: number
  minVolume: number
  maxDays: number
}
