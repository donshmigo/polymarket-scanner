'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  RecommendationsPayload,
  PortfolioPayload,
  ScoredTicket,
  LivePosition,
  ParsedMarket,
} from '@/types'
import PnlStrip from '@/components/PnlStrip'
import FeedControls, { SideFilter, TierFilter } from '@/components/FeedControls'
import SignalTicket from '@/components/SignalTicket'
import TrackedPositions from '@/components/TrackedPositions'
import { Radar, ChevronDown, ChevronRight, BarChart3, AlertCircle, Filter } from 'lucide-react'

const REFRESH_SECONDS = 30

function positionToMarket(p: LivePosition): ParsedMarket | null {
  if (p.currentYes == null) return null
  return {
    id: p.entry.market_id,
    question: p.entry.question,
    yesPrice: p.currentYes,
    noPrice: Math.round((1 - p.currentYes) * 100) / 100,
    volumeNum: 0,
    daysToResolution: p.daysToResolution ?? 0,
    startDate: '',
    endDate: '',
    active: true,
    closed: false,
    slug: p.slug,
    conditionId: p.conditionId,
  }
}

export default function CommandDeck() {
  const [recs, setRecs] = useState<RecommendationsPayload | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null)
  const [recLoading, setRecLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [side, setSide] = useState<SideFilter>('ALL')
  const [tier, setTier] = useState<TierFilter>('ALL')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [countdown, setCountdown] = useState(REFRESH_SECONDS)

  const [tracked, setTracked] = useState<Set<string>>(new Set())
  const [showWatch, setShowWatch] = useState(false)
  const [showFiltered, setShowFiltered] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio')
      if (res.ok) setPortfolio(await res.json())
    } catch {
      /* non-fatal */
    }
  }, [])

  const fetchRecs = useCallback(async () => {
    setRecLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/recommendations')
      if (!res.ok) throw new Error(`Feed error ${res.status}`)
      setRecs(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recommendations')
    } finally {
      setRecLoading(false)
    }
  }, [])

  const refreshAll = useCallback(() => {
    fetchPortfolio()
    fetchRecs()
  }, [fetchPortfolio, fetchRecs])

  const refreshRef = useRef(refreshAll)
  refreshRef.current = refreshAll

  useEffect(() => {
    refreshRef.current()
  }, [])

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) {
      setCountdown(REFRESH_SECONDS)
      return
    }
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          refreshRef.current()
          return REFRESH_SECONDS
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [autoRefresh])

  async function handleTrack(ticket: ScoredTicket) {
    const entryPrice = ticket.side === 'YES' ? ticket.market.yesPrice : ticket.market.noPrice
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: ticket.market.id,
          question: ticket.market.question,
          entry_price: entryPrice,
          position: ticket.side,
        }),
      })
      if (res.ok) {
        setTracked(prev => new Set([...prev, ticket.market.id]))
        fetchPortfolio()
      }
    } catch {
      /* ignore */
    }
  }

  async function handleResolve(id: string, outcome: boolean) {
    const pos = portfolio?.openPositions.find(p => p.entry.id === id)
    if (!pos) return
    const entry = pos.entry
    const win = (entry.position === 'YES') === outcome
    const resolveSide = win ? 1 : 0
    const pnl = entry.entry_price ? Math.round(((resolveSide - entry.entry_price) / entry.entry_price) * 1000) / 10 : 0
    await fetch(`/api/watchlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true, outcome, exit_price: outcome ? 1 : 0, pnl }),
    })
    fetchPortfolio()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/watchlist/${id}`, { method: 'DELETE' })
    fetchPortfolio()
  }

  async function handleReanalyze(p: LivePosition) {
    const market = positionToMarket(p)
    if (!market) return
    setBusyId(p.entry.id)
    try {
      await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(market),
      })
      await fetchPortfolio()
    } finally {
      setBusyId(null)
    }
  }

  // Filter + split tickets
  const allTickets = recs?.tickets ?? []
  const visible = allTickets.filter(t => {
    if (side !== 'ALL' && t.side !== side) return false
    if (tier === 'STRONG' && t.tier !== 'STRONG') return false
    if (tier === 'TAKE' && t.tier === 'WATCH') return false
    return true
  })
  const mainTickets = visible.filter(t => t.tier !== 'WATCH')
  const watchTickets = visible.filter(t => t.tier === 'WATCH')
  const filtered = recs?.filtered ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radar className="w-6 h-6 text-emerald-400" />
            Command Deck
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            AI-ranked recommendations + live position tracking. This tool never places trades — every action
            deep-links to Polymarket.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors shrink-0"
        >
          <BarChart3 className="w-4 h-4" />
          Performance
        </Link>
      </div>

      {/* P&L strip */}
      <PnlStrip data={portfolio} />

      {/* Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-300">
            Conviction Calls
            {recs && (
              <span className="text-xs text-gray-500 font-normal ml-2">
                {mainTickets.length} live · {recs.analyzed} analyzed of {recs.scanned} scanned
              </span>
            )}
          </h2>
        </div>

        <FeedControls
          sideFilter={side}
          tierFilter={tier}
          autoRefresh={autoRefresh}
          countdown={countdown}
          loading={recLoading}
          onSide={setSide}
          onTier={setTier}
          onToggleAuto={() => setAutoRefresh(v => !v)}
          onRefresh={refreshAll}
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {recLoading && !recs ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : mainTickets.length === 0 && watchTickets.length === 0 ? (
          <div className="rounded-xl border border-gray-800 px-6 py-12 text-center">
            <p className="text-gray-300 text-sm font-medium">No high-conviction setups right now</p>
            <p className="text-gray-600 text-xs mt-1">
              Nothing clears the bar — sit on your hands, or hit Refresh to re-scan.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mainTickets.map(t => (
              <SignalTicket key={t.market.id} ticket={t} tracked={tracked.has(t.market.id)} onTrack={handleTrack} />
            ))}

            {/* WATCH tier collapsed */}
            {watchTickets.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowWatch(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors pt-1"
                >
                  {showWatch ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  {watchTickets.length} more to watch
                </button>
                {showWatch &&
                  watchTickets.map(t => (
                    <SignalTicket key={t.market.id} ticket={t} tracked={tracked.has(t.market.id)} onTrack={handleTrack} />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Filtered / AVOID drawer */}
        {filtered.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setShowFiltered(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {filtered.length} filtered out
              {showFiltered ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showFiltered && (
              <div className="mt-2 space-y-1">
                {filtered.map(t => (
                  <div
                    key={t.market.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-900/40 border border-gray-800/60"
                  >
                    <span className="text-xs text-gray-400 truncate flex-1">{t.market.question}</span>
                    <span className="text-xs text-gray-600 shrink-0">{t.gatesFailed.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tracked positions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">
          Position Monitor
          {portfolio && (
            <span className="text-xs text-gray-500 font-normal ml-2">{portfolio.openPositions.length} open</span>
          )}
        </h2>
        <TrackedPositions
          positions={portfolio?.openPositions ?? []}
          busyId={busyId}
          onResolve={handleResolve}
          onReanalyze={handleReanalyze}
          onDelete={handleDelete}
        />
      </div>

      <p className="text-xs text-gray-600 text-center pt-2">
        Recommendations only · This app never places trades · Every action deep-links to Polymarket
      </p>
    </div>
  )
}
