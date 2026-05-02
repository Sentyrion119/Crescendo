const BASE = '/api/yahoo'

const cache = new Map()

function cached(key, fn, ttlMs = 5 * 60 * 1000) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.value)
  return fn().then(value => {
    cache.set(key, { value, ts: Date.now() })
    return value
  })
}

const ALLOWED_TYPES = ['ETF', 'EQUITY', 'MUTUALFUND', 'CRYPTOCURRENCY', 'FUND', 'INDEX']

function buildVariations(raw) {
  const q = raw.trim()
  const variations = new Set()
  variations.add(q)

  const noSpaces = q.replace(/\s+/g, '')
  if (noSpaces !== q) variations.add(noSpaces)

  const noSpecial = q.replace(/[^a-zA-Z0-9\s]/g, '').trim()
  if (noSpecial && noSpecial !== q) variations.add(noSpecial)

  const noSpecialNoSpaces = noSpecial.replace(/\s+/g, '')
  if (noSpecialNoSpaces && noSpecialNoSpaces !== noSpaces) variations.add(noSpecialNoSpaces)

  return [...variations]
}

async function fetchSearch(q) {
  const url = `${BASE}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=20&newsCount=0&enableFuzzyQuery=true&lang=en-US`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erreur Yahoo Finance (${res.status})`)
  const data = await res.json()
  return (data.quotes || [])
    .filter(r => ALLOWED_TYPES.includes(r.quoteType))
    .map(r => ({
      symbol: r.symbol,
      name: r.longname || r.shortname || r.symbol,
      type: r.quoteType,
      exchange: r.exchDisp || r.exchange || '',
    }))
}

export async function searchAssets(query) {
  if (!query || query.trim().length < 1) return []

  return cached(`search:${query.trim().toLowerCase()}`, async () => {
    const variations = buildVariations(query)
    const all = await Promise.all(variations.map(fetchSearch))

    const seen = new Set()
    return all.flat().filter(r => {
      if (seen.has(r.symbol)) return false
      seen.add(r.symbol)
      return true
    })
  })
}

export async function getAsset5YearCAGR(symbol) {
  return cached(`cagrMax:${symbol}`, async () => {
    const url = `${BASE}/v8/finance/chart/${symbol}?range=max&interval=1mo`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Impossible de récupérer les données (${res.status})`)
    const data = await res.json()

    const result = data.chart?.result?.[0]
    if (!result) throw new Error('Aucune donnée historique disponible')

    const timestamps = result.timestamp || []
    const adjCloses = result.indicators?.adjclose?.[0]?.adjclose || []
    const rawCloses = result.indicators?.quote?.[0]?.close || []
    const prices = adjCloses.length > 0 ? adjCloses : rawCloses

    const valid = timestamps
      .map((t, i) => ({ t, p: prices[i] }))
      .filter(d => d.p !== null && d.p !== undefined && !isNaN(d.p) && isFinite(d.p))

    if (valid.length < 6) throw new Error('Données insuffisantes pour calculer un TCAC')

    const start = valid[0]
    const end = valid[valid.length - 1]
    const years = (end.t - start.t) / (365.25 * 86400)

    if (years < 0.5) throw new Error('Période trop courte')

    const cagr = (Math.pow(end.p / start.p, 1 / years) - 1) * 100

    return {
      cagr: parseFloat(cagr.toFixed(2)),
      startPrice: parseFloat(start.p.toFixed(2)),
      endPrice: parseFloat(end.p.toFixed(2)),
      years: parseFloat(years.toFixed(1)),
      currency: result.meta?.currency || '',
      fullName: result.meta?.longName || result.meta?.shortName || symbol,
      dataMonths: valid.length,
    }
  })
}
