'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

type ThreadSummary = { id: string; title: string; slug?: string }

export function RecentCreations() {
  const [items, setItems] = useState<ThreadSummary[]>([])

  useEffect(() => {
    const load = () => {
      fetch('/api/threads')
        .then((r) => (r.ok ? r.json() : []))
        .then((data: ThreadSummary[]) => setItems(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
    load()
    window.addEventListener('creations-changed', load)
    return () => window.removeEventListener('creations-changed', load)
  }, [])

  async function remove(e: React.MouseEvent, t: ThreadSummary) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Excluir "${t.title || 'Sem título'}"? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/threads/${t.id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== t.id))
        window.dispatchEvent(new Event('creations-changed'))
      }
    } catch {
      // silencioso
    }
  }

  if (items.length === 0) return null

  return (
    <div className="mt-5">
      <p className="px-2.5 mb-1 text-xs font-medium text-[#8e8e8e]">Suas criações</p>
      <ul className="flex flex-col gap-0.5">
        {items.map((t) => (
          <li key={t.id} className="group relative">
            <Link
              href={t.slug ? `/editor?slug=${t.slug}` : `/editor?thread=${t.id}`}
              className="block truncate rounded-lg pl-2.5 pr-8 h-9 leading-9 text-sm text-[#3d3d3d] hover:bg-black/5"
            >
              {t.title || 'Sem título'}
            </Link>
            <button
              onClick={(e) => remove(e, t)}
              title="Excluir"
              className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-md text-[#9d9d9d] opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-black/5 transition-opacity"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
