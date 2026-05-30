'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ListFilter, Check } from 'lucide-react'
import { CreationCard, type CreationSummary } from '@/components/biblioteca/CreationCard'

const TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'estatico', label: 'Estático' },
  { value: 'stories', label: 'Stories' },
  { value: 'anuncio', label: 'Anúncio' },
]
const PHASES = [
  { value: 'all', label: 'Todas' },
  { value: 'descoberta', label: 'Descoberta' },
  { value: 'relacionamento', label: 'Relacionamento' },
  { value: 'prontidao', label: 'Prontidão' },
]

export default function BuscarPage() {
  const [items, setItems] = useState<CreationSummary[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [phase, setPhase] = useState('all')
  const [open, setOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/content/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CreationSummary[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const activeCount = (type !== 'all' ? 1 : 0) + (phase !== 'all' ? 1 : 0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (q && !i.topic.toLowerCase().includes(q)) return false
      const itype = i.content_type === 'post' ? 'estatico' : i.content_type
      if (type !== 'all' && itype !== type) return false
      if (phase !== 'all' && i.funnel_phase !== phase) return false
      return true
    })
  }, [items, query, type, phase])

  function FilterSection({
    title,
    options,
    value,
    onChange,
  }: { title: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="px-1.5 py-1.5">
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#9d9d9d]">{title}</p>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 h-9 text-sm text-[#0d0d0d] hover:bg-black/5"
          >
            <span>{o.label}</span>
            {value === o.value && <Check size={15} className="text-[#0d0d0d]" />}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <h1 className="text-2xl font-semibold text-[#0d0d0d] mb-5">Buscar conteúdo</h1>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 h-12 shadow-sm">
            <Search size={18} className="text-[#9d9d9d]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por tema…"
              className="flex-1 bg-transparent text-sm text-[#0d0d0d] placeholder:text-[#9d9d9d] outline-none"
            />
          </div>

          <div ref={filterRef} className="relative flex-none">
            <button
              onClick={() => setOpen((o) => !o)}
              className={`flex items-center gap-2 h-12 px-4 rounded-2xl border text-[13px] transition-colors ${
                activeCount > 0
                  ? 'bg-black/[0.04] border-black/10 text-[#0d0d0d]'
                  : 'bg-white border-black/10 text-[#5d5d5d] hover:text-[#0d0d0d] hover:border-black/20'
              }`}
            >
              <ListFilter size={16} className="opacity-70" />
              <span>Filtros</span>
              {activeCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0d0d0d] text-white text-[11px] font-medium">
                  {activeCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute z-20 right-0 top-full mt-2 w-[230px] rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
              <FilterSection title="Tipo" options={TYPES} value={type} onChange={setType} />
              <div className="h-px bg-black/5" />
              <FilterSection title="Fase do funil" options={PHASES} value={phase} onChange={setPhase} />
              {activeCount > 0 && (
                <>
                  <div className="h-px bg-black/5" />
                  <button
                    onClick={() => {
                      setType('all')
                      setPhase('all')
                    }}
                    className="w-full px-4 h-10 text-left text-sm text-[#5d5d5d] hover:bg-black/5"
                  >
                    Limpar filtros
                  </button>
                </>
              )}
              </div>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-[#8e8e8e]">Nenhum resultado.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <CreationCard
                key={item.slug}
                item={item}
                onDeleted={(slug) => setItems((prev) => prev.filter((i) => i.slug !== slug))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
