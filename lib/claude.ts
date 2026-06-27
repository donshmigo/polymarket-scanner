import Anthropic from '@anthropic-ai/sdk'
import { AISignal, ParsedMarket } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SIGNAL_PROMPT = (question: string, yesPrice: number, daysLeft: number) => `
You are a prediction market analyst assessing whether a Polymarket market appears mispriced.

Market: "${question}"
Current YES probability: ${(yesPrice * 100).toFixed(1)}%
Days until resolution: ${daysLeft}

Analyze this market and determine if it seems mispriced based on:
1. General world knowledge and base rates for similar events
2. Whether the current probability seems too high, too low, or fair
3. The time remaining — shorter timeframes mean less uncertainty

Respond with a JSON object (no markdown) with exactly these fields:
{
  "direction": "OVERPRICED" | "UNDERPRICED" | "FAIRLY_PRICED",
  "confidenceScore": <integer 0-100>,
  "edge": <estimated edge in percentage points, e.g. 8>,
  "rationale": "<2-3 sentence explanation>"
}

Be conservative. Only flag confident mispricings. If uncertain, return FAIRLY_PRICED with low confidence.
`.trim()

export async function analyzeMarket(market: ParsedMarket): Promise<AISignal | null> {
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: SIGNAL_PROMPT(market.question, market.yesPrice, market.daysToResolution) }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(text)

    const confidenceScore: number = parsed.confidenceScore ?? 0
    const edge: number = parsed.edge ?? 0
    const score = Math.round((confidenceScore * edge) / 100)

    return {
      marketId: market.id,
      question: market.question,
      yesPrice: market.yesPrice,
      confidenceScore,
      direction: parsed.direction ?? 'FAIRLY_PRICED',
      edge,
      score,
      rationale: parsed.rationale ?? '',
      createdAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}
