export interface PolymarketMarket {
  id: string
  question: string
  description?: string
  outcomePrices: string[]
  outcomes: string[]
  volume: string
  volumeNum: number
  volumeClob?: number
  liquidity?: number
  liquidityNum?: number
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
}

export interface AISignal {
  marketId: string
  question: string
  yesPrice: number
  confidenceScore: number
  direction: 'OVERPRICED' | 'UNDERPRICED' | 'FAIRLY_PRICED'
  rationale: string
  edge: number
  score: number // composite score for ranking
  createdAt: string
}

export interface WatchlistEntry {
  id: string
  market_id: string
  question: string
  entry_price: number
  entry_date: string
  position: 'YES' | 'NO'
  resolved: boolean
  outcome?: boolean
  exit_price?: number
  pnl?: number
  notes?: string
  created_at: string
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
