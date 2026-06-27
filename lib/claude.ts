import Anthropic from '@anthropic-ai/sdk'
import { AISignal, ParsedMarket } from '@/types'
import { deriveEdge, scoreOpportunity } from '@/lib/score'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

function pct(n?: number): string {
  return typeof n === 'number' ? `${(n * 100).toFixed(1)}%` : 'n/a'
}

const SIGNAL_PROMPT = (market: ParsedMarket) => `
You are a prediction market analyst estimating the TRUE probability of a Polymarket event,
so we can detect mispricing versus the current market price.

Market: "${market.question}"
Current market YES price (implied probability): ${(market.yesPrice * 100).toFixed(1)}%
Days until resolution: ${market.daysToResolution}
24h price change: ${pct(market.oneDayPriceChange)}
Bid/ask spread: ${pct(market.spread)}
Liquidity: ${market.liquidity != null ? `$${Math.round(market.liquidity).toLocaleString()}` : 'n/a'}

Estimate the true probability of YES resolving, using general world knowledge, base rates
for similar events, and the time remaining (shorter timeframes mean less room for change).
Do NOT just echo the market price — give your independent estimate.

Respond with a JSON object (no markdown) with exactly these fields:
{
  "trueProbability": <your independent estimate of P(YES), a number between 0 and 1>,
  "confidenceScore": <integer 0-100, how confident you are in your estimate>,
  "rationale": "<2-3 sentence explanation of your reasoning>"
}

Be conservative. If you have no real edge over the market, set trueProbability close to the
market price and confidenceScore low.
`.trim()

export async function analyzeMarket(market: ParsedMarket): Promise<AISignal | null> {
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: SIGNAL_PROMPT(market) }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(text)

    const confidenceScore: number = Math.max(0, Math.min(100, Math.round(parsed.confidenceScore ?? 0)))
    const trueProbability: number = Math.max(0, Math.min(1, Number(parsed.trueProbability ?? market.yesPrice)))

    const edgePp = deriveEdge(trueProbability, market.yesPrice)
    const absEdge = Math.abs(edgePp)
    const direction: AISignal['direction'] =
      absEdge < 3 ? 'FAIRLY_PRICED' : edgePp > 0 ? 'UNDERPRICED' : 'OVERPRICED'

    const signal: AISignal = {
      marketId: market.id,
      question: market.question,
      yesPrice: market.yesPrice,
      trueProbability,
      confidenceScore,
      direction,
      edge: Math.round(absEdge * 10) / 10,
      score: 0,
      rationale: parsed.rationale ?? '',
      createdAt: new Date().toISOString(),
    }

    // OpportunityScore is the single source of truth (lib/score.ts).
    signal.score = scoreOpportunity(market, signal).score

    return signal
  } catch {
    return null
  }
}
