import { ParsedMarket, PolymarketMarket } from '@/types'

const GAMMA_API = 'https://gamma-api.polymarket.com'

function parseMarket(m: PolymarketMarket): ParsedMarket | null {
  try {
    let prices: number[] = []
    if (typeof m.outcomePrices === 'string') {
      prices = JSON.parse(m.outcomePrices).map(Number)
    } else if (Array.isArray(m.outcomePrices)) {
      prices = m.outcomePrices.map(Number)
    }

    if (prices.length < 2) return null

    const yesPrice = prices[0]
    const noPrice = prices[1]

    if (isNaN(yesPrice) || isNaN(noPrice)) return null

    return {
      id: m.id,
      question: m.question,
      description: m.description,
      yesPrice: Math.round(yesPrice * 100) / 100,
      noPrice: Math.round(noPrice * 100) / 100,
      volumeNum: m.volumeNum ?? 0,
      liquidity: m.liquidityNum ?? m.liquidity,
      startDate: m.startDate,
      endDate: m.endDate,
      category: m.category,
      active: m.active,
      closed: m.closed,
      image: m.image,
      slug: m.slug,
      conditionId: m.conditionId,
    }
  } catch {
    return null
  }
}

export async function fetchMarkets(params?: {
  limit?: number
  offset?: number
  active?: boolean
  closed?: boolean
}): Promise<PolymarketMarket[]> {
  const searchParams = new URLSearchParams({
    limit: String(params?.limit ?? 100),
    offset: String(params?.offset ?? 0),
    active: String(params?.active ?? true),
    closed: String(params?.closed ?? false),
  })

  const url = `${GAMMA_API}/markets?${searchParams}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)
  return res.json()
}

export async function fetchFilteredMarkets(opts: {
  minProbability?: number
  maxProbability?: number
  minVolume?: number
  maxPages?: number
}): Promise<ParsedMarket[]> {
  const {
    minProbability = 0.75,
    maxProbability = 0.95,
    minVolume = 10000,
    maxPages = 5,
  } = opts

  const all: ParsedMarket[] = []
  let offset = 0
  const limit = 100

  for (let page = 0; page < maxPages; page++) {
    let raw: PolymarketMarket[]
    try {
      raw = await fetchMarkets({ limit, offset, active: true, closed: false })
    } catch {
      break
    }

    if (!raw.length) break

    for (const m of raw) {
      const parsed = parseMarket(m)
      if (!parsed) continue
      if (parsed.volumeNum < minVolume) continue

      const prob = parsed.yesPrice
      if (prob < minProbability || prob > maxProbability) continue

      all.push(parsed)
    }

    if (raw.length < limit) break
    offset += limit
  }

  return all
}

export function getMarketUrl(market: ParsedMarket): string {
  if (market.slug) return `https://polymarket.com/event/${market.slug}`
  if (market.conditionId) return `https://polymarket.com/market/${market.conditionId}`
  return 'https://polymarket.com'
}
