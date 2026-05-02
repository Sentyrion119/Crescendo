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

function Footer() {
  return (
    <footer className="border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <span className="text-slate-600 text-xs">
        Données via Yahoo Finance — à titre indicatif uniquement
      </span>
      <a
        href="https://github.com/Sentyrion119/Crescendo"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
        Sentyrion119 — Open Source
      </a>
    </footer>
  )
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

      <Footer />
    </div>
  )
}
