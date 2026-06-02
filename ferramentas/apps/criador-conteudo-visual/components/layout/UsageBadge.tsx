'use client'

import { useEffect, useState } from 'react'

type Usage = { configured: boolean; amount: number | null; currency?: string }

// Chip discreto na header: gasto do mês na OpenAI. Some sozinho se a Admin key
// não estiver configurada (configured:false) ou se a chamada falhar.
export function UsageBadge() {
  const [data, setData] = useState<Usage | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/openai/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Usage | null) => alive && setData(d))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!data || !data.configured || data.amount == null) return null

  const fmt = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: (data.currency || 'usd').toUpperCase(),
  }).format(data.amount)

  return (
    <span
      title="Gasto na OpenAI no mês corrente (não é saldo restante)"
      className="inline-flex items-center h-7 rounded-full bg-black/[0.04] px-3 text-xs text-[#5d5d5d] tabular-nums"
    >
      OpenAI · {fmt}
    </span>
  )
}
