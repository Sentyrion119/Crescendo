export default async function handler(req, res) {
  const slug = req.query.slug || []
  const path = '/' + (Array.isArray(slug) ? slug.join('/') : slug)
  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const url = `https://query1.finance.yahoo.com${path}${queryString}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    res.status(response.status).json(data)
  } catch {
    res.status(500).json({ error: 'Proxy error' })
  }
}
