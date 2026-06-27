export interface PolymarketMarket {
  id: string
  question: string
  description?: string
  outcomePrices: string[] // JSON stringified array like ["0.82", "0.18"]
  outcomes: string[] // JSON stringified array like ["Yes", "No"]
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
  confidenceScore: number // 0-100
  direction: 'OVERPRICED' | 'UNDERPRICED' | 'FAIRLY_PRICED'
  rationale: string
  edge: number // estimated edge in percentage points
  createdAt: string
}

export interface WatchlistEntry {
  id: string
  marketId: string
  question: string
  entryPrice: number
  entryDate: string
  position: 'YES' | 'NO'
  resolved: boolean
  outcome?: boolean
  exitPrice?: number
  pnl?: number
  notes?: string
}

export interface SortConfig {
  key: keyof ParsedMarket
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  minProbability: number
  maxProbability: number
  minVolume: number
  category?: string
}
