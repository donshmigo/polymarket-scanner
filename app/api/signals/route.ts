import { NextRequest, NextResponse } from 'next/server'
import { analyzeMarket } from '@/lib/claude'
import { upsertSignal } from '@/lib/signals-cache'
import { ParsedMarket } from '@/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  let market: ParsedMarket
  try {
    market = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const signal = await analyzeMarket(market)
  if (!signal) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }

  // Persist to Supabase cache (best-effort).
  await upsertSignal(signal)

  return NextResponse.json(signal)
}
