import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency, generateChartTicks } from '../utils/calculator'
import { MILESTONE_STEP } from '../data/assets'

function formatYAxis(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K€`
  return `${value}€`
}

function formatXAxis(month) {
  const years = Math.floor(month / 12)
  const months = month % 12
  if (years === 0) return `${months}m`
  if (months === 0) return `${years}a`
  return `${years}a${months}m`
}

function CustomTooltip({ active, payload, label, assets }) {
  if (!active || !payload || !payload.length) return null

  const years = Math.floor(label / 12)
  const months = label % 12
  const timeLabel = years > 0
    ? `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`
    : `${months} mois`

  const portfolioEntry = payload.find(p => p.dataKey === 'portfolio')
  const investedEntry = payload.find(p => p.dataKey === 'totalInvested')

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 shadow-2xl text-sm min-w-[200px]">
      <p className="text-slate-400 mb-2.5 font-medium text-xs">⏱ {timeLabel}</p>

      {portfolioEntry && (
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <span className="text-xs text-emerald-400 font-semibold">Portefeuille total</span>
          <span className="font-bold text-white">{portfolioEntry.value?.toLocaleString('fr-FR')}€</span>
        </div>
      )}
      {investedEntry && (
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-xs text-slate-400">Versements</span>
          <span className="font-medium text-slate-300">{investedEntry.value?.toLocaleString('fr-FR')}€</span>
        </div>
      )}
      {portfolioEntry && investedEntry && (
        <div className="border-t border-slate-800 pt-2 flex justify-between">
          <span className="text-xs text-slate-500">Plus-value</span>
          <span className="text-xs font-bold text-emerald-400">
            +{(portfolioEntry.value - investedEntry.value).toLocaleString('fr-FR')}€
          </span>
        </div>
      )}

      {assets.length > 1 && payload[0]?.payload?.breakdown && (
        <div className="border-t border-slate-800 mt-2 pt-2 flex flex-col gap-1">
          <p className="text-[10px] text-slate-600 mb-0.5">Détail par actif</p>
          {assets.map((asset, i) => {
            const val = payload[0].payload.breakdown[i]
            if (val == null) return null
            return (
              <div key={asset.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: asset.color }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: asset.color }} />
                  {asset.symbol} ({asset.allocation}%)
                </span>
                <span className="text-[10px] text-slate-300">{val.toLocaleString('fr-FR')}€</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function GrowthChart({ data, assets, targetAmount, blendedColor }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex items-center justify-center h-52">
        <p className="text-slate-500 text-sm">Ajoutez un actif pour voir la courbe</p>
      </div>
    )
  }

  const ticks = generateChartTicks(data)
  const color = blendedColor || '#10b981'

  const milestoneLines = []
  for (let m = MILESTONE_STEP; m <= targetAmount; m += MILESTONE_STEP) {
    milestoneLines.push(m)
  }

  const sampleInterval = Math.max(1, Math.floor(data.length / 300))
  const chartData = data.filter((_, i) => i % sampleInterval === 0 || i === data.length - 1)

  return (
    <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
          Évolution du portefeuille
        </h2>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded inline-block" style={{ background: color }} />
            Portefeuille total
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 border-t border-dashed border-slate-600 inline-block" />
            Versements
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#475569" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#475569" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

          {milestoneLines.map(amount => (
            <ReferenceLine
              key={amount}
              y={amount}
              stroke="#1e293b"
              strokeDasharray="4 4"
              label={{
                value: formatCurrency(amount),
                position: 'right',
                fill: '#334155',
                fontSize: 10,
              }}
            />
          ))}

          <XAxis
            dataKey="month"
            ticks={ticks}
            tickFormatter={formatXAxis}
            stroke="#1e293b"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke="#1e293b"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />

          <Tooltip content={<CustomTooltip assets={assets} />} />

          <Area
            type="monotone"
            dataKey="totalInvested"
            stroke="#334155"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            fill="url(#investedGrad)"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="portfolio"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#portfolioGrad)"
            dot={false}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
