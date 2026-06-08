'use client'

import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'

type Me = { name: string; email: string; tenantId: string } | null

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const [me, setMe] = useState<Me>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (alive) setMe(d.user ?? null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!me) return null

  const label = me.email || me.name || me.tenantId
  const initial = (label || '?').charAt(0).toUpperCase()

  const avatar = (
    <div className="flex-none grid place-items-center w-8 h-8 rounded-full bg-[#0d0d0d] text-white text-sm font-medium">
      {initial}
    </div>
  )

  if (collapsed) {
    return (
      <div className="flex-none p-2 flex justify-center">
        <a href="/sign-out" title={`Sair (${label})`} aria-label="Sair">
          {avatar}
        </a>
      </div>
    )
  }

  return (
    <div className="flex-none border-t border-black/5 p-2">
      <div className="flex items-center gap-2 rounded-lg px-2 h-12 hover:bg-black/5 transition-colors">
        {avatar}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#0d0d0d] truncate">{label}</p>
          <p className="text-[11px] text-[#9d9d9d] truncate">{me.tenantId}</p>
        </div>
        <a
          href="/sign-out"
          title="Sair"
          aria-label="Sair"
          className="flex-none grid place-items-center w-8 h-8 rounded-lg text-[#5d5d5d] hover:bg-black/10 transition-colors"
        >
          <LogOut size={16} />
        </a>
      </div>
    </div>
  )
}
