import { formatCurrency, formatDuration } from '../utils/calculator'

export default function SummaryCards({ data, params, assets, blendedRate }) {
  const activeAssets = assets.filter(a => !a.loading && !a.error)

  if (!data || data.length === 0 || activeAssets.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Versement mensuel', value: `${params.monthlyInvestment.toLocaleString('fr-FR')}€ / mois` },
          { label: 'Capital initial', value: `${params.initialCapital.toLocaleString('fr-FR')}€` },
          { label: 'Objectif', value: formatCurrency(params.targetAmount) },
        ].map(c => (
          <div key={c.label} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
            <p className="text-xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>
    )
  }

  const last = data[data.length - 1]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Durée estimée</p>
          <p className="text-xl font-bold text-white">{formatDuration(last.month)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{last.month} mois</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Intérêts générés</p>
          <p className="text-xl font-bold text-emerald-400">+{formatCurrency(last.gains)}</p>
          <p className="text-xs text-slate-500 mt-0.5">sur {formatCurrency(last.totalInvested)} versés</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Versement mensuel</p>
          <p className="text-xl font-bold text-white">{params.monthlyInvestment.toLocaleString('fr-FR')}€</p>
          {params.initialCapital > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">+ {params.initialCapital.toLocaleString('fr-FR')}€ initial</p>
          )}
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Taux moyen pondéré</p>
          <p className="text-xl font-bold text-white">{blendedRate.toFixed(2)}% <span className="text-sm text-slate-400">/ an</span></p>
          <p className="text-xs text-slate-500 mt-0.5">{activeAssets.length} actif{activeAssets.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {activeAssets.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {activeAssets.map((asset, i) => {
            const finalVal = last.breakdown?.[i] ?? 0
            const pct = last.portfolio > 0 ? Math.round((finalVal / last.portfolio) * 100) : 0
            const monthly = params.monthlyInvestment * (asset.allocation / 100)
            return (
              <div
                key={asset.id}
                className="rounded-xl border p-3 flex flex-col gap-1.5"
                style={{ borderColor: `${asset.color}44`, background: `${asset.color}08` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: asset.color }} />
                  <span className="text-xs font-bold text-white">{asset.symbol}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{asset.allocation}%</span>
                </div>
                <p className="text-base font-bold text-white">{formatCurrency(finalVal)}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                  <span>{monthly.toFixed(0)}€/mois</span>
                  <span>{asset.annualRate}%/an</span>
                  <span style={{ color: asset.color }}>{pct}% du total</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
