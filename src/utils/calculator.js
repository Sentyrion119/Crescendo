import { MILESTONE_STEP } from '../data/assets'

export function calculatePortfolioGrowth(assets, params) {
  const { monthlyInvestment, targetAmount, initialCapital } = params
  if (!assets.length) return []

  const totalAlloc = assets.reduce((s, a) => s + (a.allocation || 0), 0)
  if (totalAlloc <= 0) return []

  const slots = assets.map(a => ({
    value: initialCapital * (a.allocation / totalAlloc),
    monthly: monthlyInvestment * (a.allocation / totalAlloc),
    rate: a.annualRate / 100 / 12,
  }))

  const data = []
  const maxMonths = 1200

  for (let month = 0; month <= maxMonths; month++) {
    if (month > 0) {
      slots.forEach(s => { s.value = s.value * (1 + s.rate) + s.monthly })
    }

    const totalPortfolio = slots.reduce((s, p) => s + p.value, 0)
    const totalInvested = initialCapital + month * monthlyInvestment

    data.push({
      month,
      portfolio: Math.round(totalPortfolio),
      totalInvested: Math.round(totalInvested),
      gains: Math.round(totalPortfolio - totalInvested),
      breakdown: slots.map(s => Math.round(s.value)),
    })

    if (totalPortfolio >= targetAmount) break
  }

  return data
}

export function calculateGrowth(monthlyInvestment, annualRate, targetAmount, initialCapital = 0) {
  const monthlyRate = annualRate / 100 / 12
  const data = []
  let portfolio = initialCapital
  let totalInvested = initialCapital
  const maxMonths = 1200

  for (let month = 0; month <= maxMonths; month++) {
    if (month > 0) {
      portfolio = portfolio * (1 + monthlyRate) + monthlyInvestment
      totalInvested += monthlyInvestment
    }

    data.push({
      month,
      year: parseFloat((month / 12).toFixed(2)),
      portfolio: Math.round(portfolio),
      totalInvested: Math.round(totalInvested),
      gains: Math.round(portfolio - totalInvested),
    })

    if (portfolio >= targetAmount) break
  }

  return data
}

export function calculateMilestones(data, targetAmount) {
  const milestones = []
  let currentMilestone = MILESTONE_STEP

  while (currentMilestone <= targetAmount) {
    const point = data.find(d => d.portfolio >= currentMilestone)
    if (!point) break

    const prev = milestones[milestones.length - 1]
    const monthsSincePrev = prev ? point.month - prev.month : point.month

    milestones.push({
      amount: currentMilestone,
      month: point.month,
      years: Math.floor(point.month / 12),
      remainingMonths: point.month % 12,
      monthsSincePrev,
      yearsSincePrev: Math.floor(monthsSincePrev / 12),
      remainingMonthsSincePrev: monthsSincePrev % 12,
      totalInvested: point.totalInvested,
      gains: point.gains,
      gainPercent: point.totalInvested > 0
        ? Math.round((point.gains / point.totalInvested) * 100)
        : 0,
      breakdown: point.breakdown || null,
    })

    currentMilestone += MILESTONE_STEP
  }

  return milestones
}

export function formatCurrency(value) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M€`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K€`
  }
  return `${value.toLocaleString('fr-FR')}€`
}

export function formatDuration(months) {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) return `${remainingMonths} mois`
  if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} ${remainingMonths} mois`
}

export function generateChartTicks(data) {
  if (!data.length) return []
  const maxMonth = data[data.length - 1].month
  const step = maxMonth <= 60 ? 6 : maxMonth <= 120 ? 12 : maxMonth <= 240 ? 24 : 60
  const ticks = []
  for (let m = 0; m <= maxMonth; m += step) {
    ticks.push(m)
  }
  if (ticks[ticks.length - 1] !== maxMonth) ticks.push(maxMonth)
  return ticks
}
