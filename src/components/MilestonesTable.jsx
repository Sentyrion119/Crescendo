import { formatCurrency, formatDuration } from '../utils/calculator'

function MilestoneRow({ milestone, index, isLast, color, assets }) {
  return (
    <div
      className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all ${
        isLast
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-slate-700/60 bg-slate-800/30'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: isLast ? '#10b981' : `${color}22`,
              color: isLast ? '#fff' : color,
              border: `1.5px solid ${isLast ? '#10b981' : color}55`,
            }}
          >
            {index + 1}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{formatCurrency(milestone.amount)}</p>
            <p className="text-xs text-slate-400">
              Atteint en <span className="text-slate-200 font-medium">{formatDuration(milestone.month)}</span>
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-emerald-400">+{milestone.gainPercent}%</p>
          <p className="text-xs text-slate-500">de gain</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-900/60 rounded-lg p-2.5">
          <p className="text-slate-500 mb-0.5">Total versé</p>
          <p className="font-semibold text-slate-200">{formatCurrency(milestone.totalInvested)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2.5">
          <p className="text-slate-500 mb-0.5">Intérêts</p>
          <p className="font-semibold text-emerald-400">+{formatCurrency(milestone.gains)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2.5">
          <p className="text-slate-500 mb-0.5">Durée palier</p>
          <p className="font-semibold text-slate-200">{formatDuration(milestone.monthsSincePrev)}</p>
        </div>
      </div>

      {assets.length > 1 && milestone.breakdown ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-900">
            {assets.map((asset, i) => {
              const val = milestone.breakdown[i] || 0
              const pct = milestone.amount > 0 ? (val / milestone.amount) * 100 : 0
              return (
                <div
                  key={asset.id}
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: asset.color }}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {assets.map((asset, i) => {
              const val = milestone.breakdown[i] || 0
              const pct = milestone.amount > 0 ? Math.round((val / milestone.amount) * 100) : 0
              return (
                <span key={asset.id} className="text-[10px] flex items-center gap-1" style={{ color: asset.color }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: asset.color }} />
                  {asset.symbol} {formatCurrency(val)} · {pct}%
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-900 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, milestone.gainPercent)}%`,
                background: isLast
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : `linear-gradient(90deg, ${color}88, ${color})`,
              }}
            />
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0">{milestone.gainPercent}%</span>
        </div>
      )}
    </div>
  )
}

export default function MilestonesTable({ milestones, color, assets }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
        <p className="text-slate-500 text-sm text-center py-8">
          Configurez votre portefeuille pour voir les paliers
        </p>
      </div>
    )
  }

  const total = milestones[milestones.length - 1]

  return (
    <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
          Paliers de 100 000€
        </h2>
        <span className="text-xs text-slate-500">{milestones.length} palier{milestones.length > 1 ? 's' : ''}</span>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500">Objectif atteint</p>
          <p className="text-xl font-bold" style={{ color }}>{formatCurrency(total.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Durée totale</p>
          <p className="text-xl font-bold text-white">{formatDuration(total.month)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total versé</p>
          <p className="text-xl font-bold text-slate-200">{formatCurrency(total.totalInvested)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Intérêts totaux</p>
          <p className="text-xl font-bold text-emerald-400">+{formatCurrency(total.gains)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
        {milestones.map((milestone, i) => (
          <MilestoneRow
            key={milestone.amount}
            milestone={milestone}
            index={i}
            isLast={i === milestones.length - 1}
            color={color}
            assets={assets}
          />
        ))}
      </div>
    </div>
  )
}
