'use client'

import { useState, useEffect, useCallback } from 'react'
import { ParsedMarket, AISignal, FilterConfig } from '@/types'
import MarketTable from '@/components/MarketTable'
import SignalCard from '@/components/SignalCard'
import { RefreshCw, SlidersHorizontal, Zap, AlertCircle } from 'lucide-react'

const DEFAULT_FILTERS: FilterConfig = {
  minProbability: 75,
  maxProbability: 95,
  minVolume: 10000,
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-gray-100">{value}</p>
    </div>
  )
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
  const [draftFilters, setDraftFilters] = useState<FilterConfig>(DEFAULT_FILTERS)

  const fetchMarkets = useCallback(async (f: FilterConfig) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        minProb: String(f.minProbability / 100),
        maxProb: String(f.maxProbability / 100),
        minVol: String(f.minVolume),
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Analysis failed')
      }
      const signal: AISignal = await res.json()
      setSignals(prev => ({ ...prev, [market.id]: signal }))
    } catch (e) {
      console.error('Analyze error:', e)
    } finally {
      setAnalyzing(null)
    }
  }

  function applyFilters() {
    setFilters(draftFilters)
    setFiltersOpen(false)
  }

  const avgProb = markets.length
    ? (markets.reduce((s, m) => s + m.yesPrice, 0) / markets.length * 100).toFixed(1)
    : '—'

  const totalVol = markets.reduce((s, m) => s + m.volumeNum, 0)

  function formatVol(v: number) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
    return `$${v}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Scanner</h1>
          <p className="text-gray-400 text-sm mt-1">
            Active markets with YES probability {filters.minProbability}–{filters.maxProbability}% and volume &gt;{' '}
            {formatVol(filters.minVolume)}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Min Probability: <span className="text-white font-medium">{draftFilters.minProbability}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={99}
                value={draftFilters.minProbability}
                onChange={e => setDraftFilters(prev => ({ ...prev, minProbability: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Max Probability: <span className="text-white font-medium">{draftFilters.maxProbability}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={99}
                value={draftFilters.maxProbability}
                onChange={e => setDraftFilters(prev => ({ ...prev, maxProbability: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Min Volume: <span className="text-white font-medium">{formatVol(draftFilters.minVolume)}</span>
              </label>
              <select
                value={draftFilters.minVolume}
                onChange={e => setDraftFilters(prev => ({ ...prev, minVolume: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value={1000}>$1K</option>
                <option value={5000}>$5K</option>
                <option value={10000}>$10K</option>
                <option value={50000}>$50K</option>
                <option value={100000}>$100K</option>
                <option value={500000}>$500K</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={() => { setDraftFilters(DEFAULT_FILTERS) }}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBadge label="Markets found" value={markets.length} />
          <StatBadge label="Avg. YES prob." value={`${avgProb}%`} />
          <StatBadge label="Total volume" value={formatVol(totalVol)} />
          <StatBadge
            label="Last updated"
            value={lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
          />
        </div>
      )}

      {/* Signal analysis results */}
      {Object.keys(signals).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            AI Signals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(signals).map(([id, signal]) => (
              <div key={id}>
                <p className="text-xs text-gray-500 mb-1.5 truncate">{signal.question}</p>
                <SignalCard signal={signal} onClose={() => setSignals(prev => {
                  const n = { ...prev }
                  delete n[id]
                  return n
                })} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyzing indicator */}
      {analyzing && (
        <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Analyzing market with Claude AI...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Failed to load markets</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <MarketTable markets={markets} onAnalyze={handleAnalyze} />
      )}
    </div>
  )
}
