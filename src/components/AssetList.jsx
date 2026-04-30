import { QUOTE_TYPE_LABELS } from '../data/assets'

function TypeBadge({ type }) {
  const label = QUOTE_TYPE_LABELS[type] || type
  const colors = {
    ETF: '#3b82f6', EQUITY: '#8b5cf6', MUTUALFUND: '#06b6d4',
    FUND: '#06b6d4', INDEX: '#f59e0b', CRYPTOCURRENCY: '#f97316',
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

function AllocBar({ assets }) {
  const total = assets.reduce((s, a) => s + (a.allocation || 0), 0)
  const isOk = Math.abs(total - 100) < 0.5

  return (
    <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-700/50">
      <div className="flex items-center gap-2 h-2 rounded-full overflow-hidden bg-slate-900">
        {assets.map(a => (
          <div
            key={a.id}
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(a.allocation || 0, 100)}%`,
              background: a.color,
              opacity: a.loading ? 0.4 : 1,
            }}
          />
        ))}
        {total < 99.5 && (
          <div className="h-full flex-1 bg-slate-800" />
        )}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500">
          {assets.map(a => `${a.allocation || 0}%`).join(' + ')} = {Math.round(total)}%
        </span>
        {isOk
          ? <span className="text-emerald-400 font-medium">✓ équilibré</span>
          : <span className="text-amber-400 font-medium">
              {total < 100 ? `${(100 - total).toFixed(0)}% non alloué` : `${(total - 100).toFixed(0)}% en excès`}
            </span>
        }
      </div>
    </div>
  )
}

function AssetRow({ asset, showAllocation, monthlyInvestment, onUpdateRate, onUpdateAllocation, onRemove }) {
  const monthlyAmount = monthlyInvestment * (asset.allocation / 100)

  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2"
      style={{ borderColor: `${asset.color}44`, background: `${asset.color}08` }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
          style={{ background: asset.color, opacity: asset.loading ? 0.4 : 1 }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-white">{asset.symbol}</span>
            <TypeBadge type={asset.type} />
            {asset.exchange && <span className="text-xs text-slate-600">{asset.exchange}</span>}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{asset.name}</p>
        </div>
        <button
          onClick={() => onRemove(asset.id)}
          className="flex-shrink-0 text-slate-600 hover:text-red-400 transition-colors p-0.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {asset.loading && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-full border-2 border-slate-600 border-t-emerald-400 animate-spin block flex-shrink-0" />
          Récupération du TCAC…
        </div>
      )}

      {asset.error && !asset.loading && (
        <p className="text-xs text-red-400">{asset.error}</p>
      )}

      {!asset.loading && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wide">
              Taux{asset.cagrYears ? ` (TCAC ${asset.cagrYears}a)` : ''}
            </label>
            <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden focus-within:border-emerald-500 transition-colors">
              <input
                type="number"
                value={asset.annualRate}
                onChange={e => onUpdateRate(asset.id, parseFloat(e.target.value) || 0)}
                step={0.5}
                className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none w-0"
              />
              <span className="px-1.5 text-[10px] text-slate-500 border-l border-slate-700 bg-slate-800/50 flex-shrink-0">
                %/an
              </span>
            </div>
            {asset.rateIsFromFetch && (
              <span className="text-[10px]" style={{ color: asset.color }}>auto ✓</span>
            )}
          </div>

          {showAllocation && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wide">
                Répartition
              </label>
              <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden focus-within:border-emerald-500 transition-colors">
                <input
                  type="number"
                  value={asset.allocation}
                  onChange={e => onUpdateAllocation(asset.id, parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none w-0"
                />
                <span className="px-1.5 text-[10px] text-slate-500 border-l border-slate-700 bg-slate-800/50 flex-shrink-0">
                  %
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {monthlyAmount.toFixed(0)}€ / mois
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AssetList({ assets, monthlyInvestment, onUpdateRate, onUpdateAllocation, onRemove }) {
  const showAllocation = assets.filter(a => !a.loading).length > 1

  if (assets.length === 0) {
    return (
      <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-xs">
          Recherchez un ETF ou une action ci-dessus pour commencer
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {assets.map(asset => (
        <AssetRow
          key={asset.id}
          asset={asset}
          showAllocation={showAllocation}
          monthlyInvestment={monthlyInvestment}
          onUpdateRate={onUpdateRate}
          onUpdateAllocation={onUpdateAllocation}
          onRemove={onRemove}
        />
      ))}

      {showAllocation && <AllocBar assets={assets.filter(a => !a.loading)} />}
    </div>
  )
}
