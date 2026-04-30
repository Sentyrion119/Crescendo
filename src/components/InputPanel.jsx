import AssetSearch from './AssetSearch'
import AssetList from './AssetList'

function NumberInput({ label, value, onChange, min, step, suffix, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-colors">
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
          className="flex-1 bg-transparent px-3 py-2.5 text-white text-sm focus:outline-none"
        />
        {suffix && (
          <span className="px-3 py-2.5 text-slate-400 text-sm border-l border-slate-700 bg-slate-800/50 flex-shrink-0">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export default function InputPanel({ params, onChange, assets, onAddAsset, onUpdateRate, onUpdateAllocation, onRemoveAsset }) {
  const existingSymbols = assets.map(a => a.symbol)

  return (
    <aside className="flex flex-col gap-5 w-full">
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
          Portefeuille
        </h2>

        <AssetSearch onAdd={onAddAsset} existingSymbols={existingSymbols} />
        <AssetList
          assets={assets}
          monthlyInvestment={params.monthlyInvestment}
          onUpdateRate={onUpdateRate}
          onUpdateAllocation={onUpdateAllocation}
          onRemove={onRemoveAsset}
        />
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
          Paramètres
        </h2>

        <NumberInput
          label="Capital initial"
          value={params.initialCapital}
          onChange={v => onChange({ ...params, initialCapital: v })}
          min={0}
          step={500}
          suffix="€"
          hint="Montant déjà investi"
        />

        <NumberInput
          label="Versement mensuel"
          value={params.monthlyInvestment}
          onChange={v => onChange({ ...params, monthlyInvestment: v })}
          min={1}
          step={50}
          suffix="€ / mois"
        />

        <NumberInput
          label="Objectif"
          value={params.targetAmount}
          onChange={v => onChange({ ...params, targetAmount: Math.max(1000, v) })}
          min={1000}
          step={10000}
          suffix="€"
          hint="Paliers de 100 000 € affichés"
        />
      </div>
    </aside>
  )
}
