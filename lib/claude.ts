import Anthropic from '@anthropic-ai/sdk'
import { AISignal, ParsedMarket } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SIGNAL_PROMPT = (question: string, yesPrice: number) => `
You are a prediction market analyst assessing whether a Polymarket market appears mispriced.

Market: "${question}"
Current YES probability: ${(yesPrice * 100).toFixed(1)}%

Analyze this market and determine if it seems mispriced based on:
1. General world knowledge and reasoning
2. Base rates for similar events
3. Whether the current probability seems too high, too low, or fair

Respond with a JSON object (no markdown) with these exact fields:
{
  "direction": "OVERPRICED" | "UNDERPRICED" | "FAIRLY_PRICED",
  "confidenceScore": <integer 0-100, how confident you are in your assessment>,
  "edge": <estimated edge in percentage points, positive number, e.g. 8 means ~8pp edge>,
  "rationale": "<2-3 sentence explanation of your reasoning>"
}

Be conservative. Only flag high-confidence mispricings. If uncertain, say FAIRLY_PRICED with low confidence.
`.trim()

export async function analyzeMarket(market: ParsedMarket): Promise<AISignal | null> {
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: SIGNAL_PROMPT(market.question, market.yesPrice) }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(text)

    return {
      marketId: market.id,
      question: market.question,
      yesPrice: market.yesPrice,
      confidenceScore: parsed.confidenceScore ?? 0,
      direction: parsed.direction ?? 'FAIRLY_PRICED',
      edge: parsed.edge ?? 0,
      rationale: parsed.rationale ?? '',
      createdAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}
