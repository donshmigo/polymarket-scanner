import { NextRequest, NextResponse } from 'next/server'
import { fetchFilteredMarkets } from '@/lib/polymarket'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const minProb = Number(searchParams.get('minProb') ?? 0.75)
  const maxProb = Number(searchParams.get('maxProb') ?? 0.95)
  const minVol = Number(searchParams.get('minVol') ?? 10000)
  const maxDays = Number(searchParams.get('maxDays') ?? 60)

  try {
    const markets = await fetchFilteredMarkets({
      minProbability: minProb,
      maxProbability: maxProb,
      minVolume: minVol,
      maxDays,
      maxPages: 8,
    })
    return NextResponse.json({ markets, count: markets.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
