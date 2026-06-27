'use client'

import { useState, useEffect, useCallback } from 'react'
import { ParsedMarket, AISignal, FilterConfig } from '@/types'
import MarketTable from '@/components/MarketTable'
import SignalCard from '@/components/SignalCard'
import { RefreshCw, SlidersHorizontal, Zap, AlertCircle, Bot, Trophy } from 'lucide-react'

const DEFAULT_FILTERS: FilterConfig = {
  minProbability: 75,
  maxProbability: 95,
  minVolume: 10000,
  maxDays: 60,
}

function StatBadge({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`border rounded-lg px-4 py-3 ${highlight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-800/60 border-gray-700/50'}`}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? 'text-emerald-400' : 'text-gray-100'}`}>{value}</p>
    </div>
  )
}

function formatVol(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

export default function ScannerPage() {
  const [markets, setMarkets] = useState<ParsedMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [signals, setSignals] = useState<Record<string, AISignal>>({})
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [autoScanning, setAutoScanning] = useState(false)
  const [draftFilters, setDraftFilters] = useState<FilterConfig>(DEFAULT_FILTERS)
  const [watchlistAdding, setWatchlistAdding] = useState<string | null>(null)
  const [watchlistAdded, setWatchlistAdded] = useState<Set<string>>(new Set())

  const fetchMarkets = useCallback(async (f: FilterConfig) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        minProb: String(f.minProbability / 100),
        maxProb: String(f.maxProbability / 100),
        minVol: String(f.minVolume),
        maxDays: String(f.maxDays),
      })
      const res = await fetch(`/api/scanner?${params}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      setMarkets(data.markets ?? [])
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load markets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMarkets(filters)
  }, [fetchMarkets, filters])

  async function handleAnalyze(market: ParsedMarket) {
    if (analyzing === market.id) return
    setAnalyzing(market.id)
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(market),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Analysis failed')
      const signal: AISignal = await res.json()
      setSignals(prev => ({ ...prev, [market.id]: signal }))
    } catch (e) {
      console.error('Analyze error:', e)
    } finally {
      setAnalyzing(null)
    }
  }

  async function handleAutoScan() {
    if (autoScanning || markets.length === 0) return
    setAutoScanning(true)
    // Take top 8 markets by volume for auto-scan
    const targets = [...markets]
      .sort((a, b) => b.volumeNum - a.volumeNum)
      .slice(0, 8)
      .filter(m => !signals[m.id])

    for (const market of targets) {
      setAnalyzing(market.id)
      try {
        const res = await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(market),
        })
        if (res.ok) {
          const signal: AISignal = await res.json()
          setSignals(prev => ({ ...prev, [market.id]: signal }))
        }
      } catch {
        // continue scanning
      }
      setAnalyzing(null)
    }
    setAutoScanning(false)
  }

  async function handleAddToWatchlist(market: ParsedMarket) {
    if (watchlistAdding === market.id) return
    setWatchlistAdding(market.id)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: market.id,
          question: market.question,
          entry_price: market.yesPrice,
          position: 'YES',
        }),
      })
      if (res.ok) {
        setWatchlistAdded(prev => new Set([...prev, market.id]))
      }
    } catch (e) {
      console.error('Watchlist error:', e)
    } finally {
      setWatchlistAdding(null)
    }
  }

  function applyFilters() {
    setFilters(draftFilters)
    setFiltersOpen(false)
  }

  // Ranked signals: highest score first, only non-FAIRLY_PRICED
  const rankedSignals = Object.values(signals)
    .filter(s => s.direction !== 'FAIRLY_PRICED' && s.confidenceScore >= 50)
    .sort((a, b) => b.score - a.score)

  const totalVol = markets.reduce((s, m) => s + m.volumeNum, 0)
  const avgDays = markets.length
    ? Math.round(markets.reduce((s, m) => s + m.daysToResolution, 0) / markets.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Scanner</h1>
          <p className="text-gray-400 text-sm mt-1">
            Markets resolving within {filters.maxDays} days · {filters.minProbability}–{filters.maxProbability}% YES · &gt;{formatVol(filters.minVolume)} volume
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setDraftFilters(filters); setFiltersOpen(v => !v) }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              filtersOpen
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleAutoScan}
            disabled={autoScanning || loading || markets.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bot className={`w-4 h-4 ${autoScanning ? 'animate-pulse' : ''}`} />
            {autoScanning ? 'Scanning...' : 'AI Scan'}
          </button>
          <button
            onClick={() => fetchMarkets(filters)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {filtersOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-gray-300">Filter Settings</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Min Prob: <span className="text-white font-medium">{draftFilters.minProbability}%</span>
              </label>
              <input type="range" min={50} max={99} value={draftFilters.minProbability}
                onChange={e => setDraftFilters(prev => ({ ...prev, minProbability: Number(e.target.value) }))}
                className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Max Prob: <span className="text-white font-medium">{draftFilters.maxProbability}%</span>
              </label>
              <input type="range" min={50} max={99} value={draftFilters.maxProbability}
                onChange={e => setDraftFilters(prev => ({ ...prev, maxProbability: Number(e.target.value) }))}
                className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Max Days Out: <span className="text-white font-medium">{draftFilters.maxDays}d</span>
              </label>
              <input type="range" min={7} max={180} step={7} value={draftFilters.maxDays}
                onChange={e => setDraftFilters(prev => ({ ...prev, maxDays: Number(e.target.value) }))}
                className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">Min Volume</label>
              <select value={draftFilters.minVolume}
                onChange={e => setDraftFilters(prev => ({ ...prev, minVolume: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                <option value={1000}>$1K</option>
                <option value={5000}>$5K</option>
                <option value={10000}>$10K</option>
                <option value={50000}>$50K</option>
                <option value={100000}>$100K</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={applyFilters}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors">
              Apply
            </button>
            <button onClick={() => setDraftFilters(DEFAULT_FILTERS)}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors">
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBadge label="Markets found" value={markets.length} />
          <StatBadge label="Avg days to resolve" value={`${avgDays}d`} highlight={avgDays <= 30} />
          <StatBadge label="Total volume" value={formatVol(totalVol)} />
          <StatBadge label="AI signals" value={Object.keys(signals).length} highlight={Object.keys(signals).length > 0} />
        </div>
      )}

      {/* AI Opportunities — ranked signals */}
      {rankedSignals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Top Opportunities
            <span className="text-xs text-gray-500 font-normal">ranked by AI confidence × edge</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rankedSignals.map(signal => (
              <div key={signal.marketId} className="space-y-1.5">
                <p className="text-xs text-gray-400 truncate px-1">{signal.question}</p>
                <SignalCard signal={signal} onClose={() => setSignals(prev => {
                  const n = { ...prev }; delete n[signal.marketId]; return n
                })} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-scan progress */}
      {(autoScanning || analyzing) && (
        <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
          <Zap className="w-4 h-4 animate-pulse" />
          {autoScanning ? 'Auto-scanning top markets with Claude AI...' : 'Analyzing market...'}
          {analyzing && <span className="text-xs text-blue-300/70 truncate ml-1">
            {markets.find(m => m.id === analyzing)?.question}
          </span>}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Failed to load markets</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <MarketTable
          markets={markets}
          signals={signals}
          watchlistAdded={watchlistAdded}
          onAnalyze={handleAnalyze}
          onAddToWatchlist={handleAddToWatchlist}
        />
      )}
    </div>
  )
}
