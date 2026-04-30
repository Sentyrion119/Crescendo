import { useState, useEffect, useRef } from 'react'
import { searchAssets } from '../utils/finance'
import { QUOTE_TYPE_LABELS } from '../data/assets'

function TypeBadge({ type }) {
  const label = QUOTE_TYPE_LABELS[type] || type
  const colors = {
    ETF: '#3b82f6',
    EQUITY: '#8b5cf6',
    MUTUALFUND: '#06b6d4',
    FUND: '#06b6d4',
    INDEX: '#f59e0b',
    CRYPTOCURRENCY: '#f97316',
  }
  const color = colors[type] || '#94a3b8'
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
      style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  )
}

export default function AssetSearch({ onAdd, existingSymbols = [] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)

  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const timer = setTimeout(async () => {
      try {
        const data = await searchAssets(query)
        setResults(data)
        setHighlightIdx(-1)
      } catch (e) {
        setError(e.message)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(asset) {
    onAdd(asset)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); handleSelect(results[highlightIdx]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const showDropdown = open && query.trim().length >= 1

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-colors">
        <span className="pl-3 text-slate-500 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="S&P 500, MSCI World, AAPL…"
          className="flex-1 bg-transparent py-2.5 px-2.5 text-white text-sm focus:outline-none placeholder:text-slate-600"
        />
        {loading && (
          <span className="pr-3 flex-shrink-0">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 border-t-emerald-400 animate-spin block" />
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
          {error && <p className="px-4 py-3 text-red-400 text-sm">{error}</p>}

          {!loading && !error && results.length === 0 && (
            <p className="px-4 py-3 text-slate-500 text-sm">
              Aucun résultat pour «&nbsp;{query}&nbsp;»
            </p>
          )}

          {results.map((asset, i) => {
            const alreadyAdded = existingSymbols.includes(asset.symbol)
            return (
              <button
                key={asset.symbol}
                onClick={() => !alreadyAdded && handleSelect(asset)}
                disabled={alreadyAdded}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 border-b border-slate-800 last:border-0 transition-colors ${
                  alreadyAdded
                    ? 'opacity-40 cursor-not-allowed'
                    : i === highlightIdx
                    ? 'bg-slate-800'
                    : 'hover:bg-slate-800/60'
                }`}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{asset.symbol}</span>
                    <TypeBadge type={asset.type} />
                    {alreadyAdded && <span className="text-[10px] text-slate-500">déjà ajouté</span>}
                  </div>
                  <span className="text-xs text-slate-400 truncate">{asset.name}</span>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">{asset.exchange}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
