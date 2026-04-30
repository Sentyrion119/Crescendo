import { useState, useMemo, useCallback } from 'react'
import { calculatePortfolioGrowth, calculateMilestones } from './utils/calculator'
import { getAsset5YearCAGR } from './utils/finance'
import { ASSET_PALETTE } from './data/assets'
import InputPanel from './components/InputPanel'
import GrowthChart from './components/GrowthChart'
import MilestonesTable from './components/MilestonesTable'
import SummaryCards from './components/SummaryCards'

const DEFAULT_PARAMS = {
  initialCapital: 0,
  monthlyInvestment: 200,
  targetAmount: 100_000,
}

let idCounter = 0
function nextId() { return `a${++idCounter}` }

function equalAllocations(n) {
  if (n === 0) return []
  const base = Math.floor(100 / n)
  const remainder = 100 - base * n
  return Array.from({ length: n }, (_, i) => i === n - 1 ? base + remainder : base)
}

function rebalance(assets) {
  const allocs = equalAllocations(assets.length)
  return assets.map((a, i) => ({ ...a, allocation: allocs[i] }))
}

function blendedRate(assets) {
  const active = assets.filter(a => !a.loading && !a.error)
  if (!active.length) return 0
  const totalAlloc = active.reduce((s, a) => s + (a.allocation || 0), 0)
  if (totalAlloc <= 0) return 0
  return active.reduce((s, a) => s + a.annualRate * (a.allocation / totalAlloc), 0)
}

function portfolioColor(assets) {
  const active = assets.filter(a => !a.loading && !a.error)
  if (active.length === 1) return active[0].color
  return '#10b981'
}

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0f172a] border border-slate-700 flex items-center justify-center select-none flex-shrink-0">
          <svg viewBox="0 0 32 32" width="24" height="24">
            <path d="M 4 26 C 7 25, 11 23, 15 19 C 19 15, 22 10, 28 5" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 4 26 C 7 25, 11 23, 15 19 C 19 15, 22 10, 28 5 L 28 26 Z" fill="#10b981" fillOpacity="0.12"/>
            <circle cx="28" cy="5" r="2.5" fill="#34d399"/>
          </svg>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">Crescendo</span>
        <span className="text-slate-600 hidden sm:inline">—</span>
        <span className="text-slate-400 text-sm hidden sm:inline">
          Simulateur de portefeuille
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Calcul en temps réel
      </div>
    </header>
  )
}

export default function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [assets, setAssets] = useState([])

  const handleAddAsset = useCallback(async (assetInfo) => {
    const colorIndex = assets.filter(a => !a._removed).length
    const color = ASSET_PALETTE[colorIndex % ASSET_PALETTE.length]
    const id = nextId()

    const pending = {
      id, color,
      symbol: assetInfo.symbol,
      name: assetInfo.name,
      type: assetInfo.type,
      exchange: assetInfo.exchange,
      annualRate: 8,
      rateIsFromFetch: false,
      cagrYears: null,
      allocation: 0,
      loading: true,
      error: null,
    }

    setAssets(prev => rebalance([...prev, pending]))

    try {
      const data = await getAsset5YearCAGR(assetInfo.symbol)
      setAssets(prev => {
        const updated = prev.map(a =>
          a.id === id
            ? { ...a, annualRate: data.cagr, rateIsFromFetch: true, cagrYears: data.years, loading: false }
            : a
        )
        return updated
      })
    } catch (e) {
      setAssets(prev => prev.map(a =>
        a.id === id ? { ...a, loading: false, error: e.message } : a
      ))
    }
  }, [assets])

  const handleUpdateRate = useCallback((id, rate) => {
    setAssets(prev => prev.map(a =>
      a.id === id ? { ...a, annualRate: rate, rateIsFromFetch: false } : a
    ))
  }, [])

  const handleUpdateAllocation = useCallback((id, allocation) => {
    setAssets(prev => {
      const othersTotal = prev.filter(a => a.id !== id).reduce((s, a) => s + (a.allocation || 0), 0)
      const max = Math.max(0, 100 - othersTotal)
      const clamped = Math.max(0, Math.min(max, allocation))
      return prev.map(a => a.id === id ? { ...a, allocation: clamped } : a)
    })
  }, [])

  const handleRemoveAsset = useCallback((id) => {
    setAssets(prev => rebalance(prev.filter(a => a.id !== id)))
  }, [])

  const activeAssets = useMemo(
    () => assets.filter(a => !a.loading && !a.error),
    [assets]
  )

  const portfolioData = useMemo(() => {
    if (!activeAssets.length) return []
    return calculatePortfolioGrowth(activeAssets, params)
  }, [activeAssets, params])

  const milestones = useMemo(
    () => calculateMilestones(portfolioData, params.targetAmount),
    [portfolioData, params.targetAmount]
  )

  const rate = useMemo(() => blendedRate(assets), [assets])
  const color = useMemo(() => portfolioColor(assets), [assets])

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e]">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 p-5 lg:border-r border-slate-800 overflow-y-auto lg:max-h-[calc(100vh-65px)] lg:sticky lg:top-0">
          <InputPanel
            params={params}
            onChange={setParams}
            assets={assets}
            onAddAsset={handleAddAsset}
            onUpdateRate={handleUpdateRate}
            onUpdateAllocation={handleUpdateAllocation}
            onRemoveAsset={handleRemoveAsset}
          />
        </div>

        <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
          <SummaryCards
            data={portfolioData}
            params={params}
            assets={assets}
            blendedRate={rate}
          />

          <GrowthChart
            data={portfolioData}
            assets={activeAssets}
            targetAmount={params.targetAmount}
            blendedColor={color}
          />

          <MilestonesTable
            milestones={milestones}
            color={color}
            assets={activeAssets}
          />
        </div>
      </main>
    </div>
  )
}
