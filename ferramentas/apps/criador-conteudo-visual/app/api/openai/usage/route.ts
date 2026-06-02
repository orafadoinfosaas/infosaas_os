import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Gasto do mês corrente na OpenAI (não é saldo — saldo não é acessível via API).
// Exige OPENAI_ADMIN_KEY (Admin key com scope api.usage.read). Sem ela, degrada.
type Usage = { configured: boolean; amount: number | null; currency?: string }

let cache: { at: number; data: Usage } | null = null
const TTL = 5 * 60 * 1000 // 5 min — custos atualizam devagar e a API tem rate limit

export async function GET() {
  const key = process.env.OPENAI_ADMIN_KEY
  if (!key) return NextResponse.json({ configured: false, amount: null } satisfies Usage)

  if (cache && Date.now() - cache.at < TTL) return NextResponse.json(cache.data)

  const now = new Date()
  const start = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000)

  try {
    let total = 0
    let currency = 'usd'
    let page: string | undefined
    for (let i = 0; i < 12; i++) {
      const url = new URL('https://api.openai.com/v1/organization/costs')
      url.searchParams.set('start_time', String(start))
      url.searchParams.set('limit', '31')
      if (page) url.searchParams.set('page', page)

      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
      if (!res.ok) {
        const data: Usage = { configured: true, amount: null }
        return NextResponse.json(data, { status: 200 })
      }
      const json = (await res.json()) as {
        data?: { results?: { amount?: { value?: number | string; currency?: string } }[] }[]
        has_more?: boolean
        next_page?: string
      }
      for (const b of json.data ?? []) {
        for (const r of b.results ?? []) {
          total += Number(r.amount?.value ?? 0) // a API devolve value como string
          if (r.amount?.currency) currency = r.amount.currency
        }
      }
      if (json.has_more && json.next_page) page = json.next_page
      else break
    }

    const data: Usage = { configured: true, amount: total, currency }
    cache = { at: Date.now(), data }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ configured: true, amount: null } satisfies Usage, { status: 200 })
  }
}
