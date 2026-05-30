'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ListFilter, Check, X, ExternalLink } from 'lucide-react'
import type { CreationSummary } from '@/components/biblioteca/CreationCard'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PLATFORM_LABEL: Record<string, string> = { instagram: 'Instagram' }

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function toInputValue(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CalendarioPage() {
  const [items, setItems] = useState<CreationSummary[]>([])
  const [accountLabels, setAccountLabels] = useState<Record<string, string>>({})
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [platform, setPlatform] = useState('all')
  const [account, setAccount] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  const [target, setTarget] = useState<CreationSummary | null>(null)

  useEffect(() => {
    fetch('/api/content/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CreationSummary[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
    fetch('/api/publish/profiles')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { profiles: { id: string; label: string }[] } | null) => {
        if (!d?.profiles) return
        setAccountLabels(Object.fromEntries(d.profiles.map((p) => [p.id, p.label])))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!filterOpen) return
    function onDocClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [filterOpen])

  const scheduled = useMemo(() => items.filter((i) => i.scheduled_at), [items])

  // Opções de filtro derivadas do que existe agendado (+ rótulos da Composio).
  const platformOpts = useMemo(() => {
    const set = new Set(scheduled.map((i) => i.platform))
    return [...set].sort().map((p) => ({ value: p, label: PLATFORM_LABEL[p] ?? p }))
  }, [scheduled])

  const accountOpts = useMemo(() => {
    const ids = new Set<string>()
    scheduled.forEach((i) => i.publish_targets.forEach((t) => ids.add(t)))
    Object.keys(accountLabels).forEach((id) => ids.add(id))
    return [...ids].sort().map((id) => ({ value: id, label: accountLabels[id] ?? id }))
  }, [scheduled, accountLabels])

  const filtered = useMemo(
    () =>
      scheduled.filter((i) => {
        if (platform !== 'all' && i.platform !== platform) return false
        if (account !== 'all' && !i.publish_targets.includes(account)) return false
        return true
      }),
    [scheduled, platform, account]
  )

  const byDay = useMemo(() => {
    const map = new Map<string, CreationSummary[]>()
    for (const i of filtered) {
      const d = new Date(i.scheduled_at!)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const arr = map.get(key) ?? []
      arr.push(i)
      map.set(key, arr)
    }
    return map
  }, [filtered])

  const activeCount = (platform !== 'all' ? 1 : 0) + (account !== 'all' ? 1 : 0)

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const isToday = (d: number) => year === now.getFullYear() && month === now.getMonth() && d === now.getDate()

  function prev() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) } else setMonth((m) => m - 1)
  }
  function next() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) } else setMonth((m) => m + 1)
  }

  function applyReschedule(slug: string, scheduledAt: string | null) {
    setItems((prev) =>
      prev.map((i) =>
        i.slug === slug
          ? { ...i, scheduled_at: scheduledAt ?? undefined, publish_status: scheduledAt ? 'scheduled' : 'draft' }
          : i
      )
    )
  }

  function FilterSection({
    title,
    options,
    value,
    onChange,
    emptyHint,
  }: {
    title: string
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
    emptyHint: string
  }) {
    return (
      <div className="px-1.5 py-1.5">
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#9d9d9d]">{title}</p>
        {options.length === 0 ? (
          <p className="px-2.5 py-1 text-[12px] text-[#9d9d9d]">{emptyHint}</p>
        ) : (
          [{ value: 'all', label: 'Todas' }, ...options].map((o) => (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 h-9 text-sm text-[#0d0d0d] hover:bg-black/5"
            >
              <span className="truncate">{o.label}</span>
              {value === o.value && <Check size={15} className="flex-none text-[#0d0d0d]" />}
            </button>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-semibold text-[#0d0d0d]">Calendário</h1>

          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] transition-colors ${
                activeCount > 0 ? 'bg-black/[0.06] text-[#0d0d0d]' : 'text-[#5d5d5d] hover:bg-black/5'
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

            {filterOpen && (
              <div className="absolute z-20 left-0 top-full mt-2 w-[240px] rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
                <FilterSection title="Plataforma" options={platformOpts} value={platform} onChange={setPlatform} emptyHint="Nada agendado." />
                <div className="h-px bg-black/5" />
                <FilterSection title="Conta" options={accountOpts} value={account} onChange={setAccount} emptyHint="Nenhuma conta." />
                {activeCount > 0 && (
                  <>
                    <div className="h-px bg-black/5" />
                    <button
                      onClick={() => { setPlatform('all'); setAccount('all') }}
                      className="w-full px-4 h-10 text-left text-sm text-[#5d5d5d] hover:bg-black/5"
                    >
                      Limpar filtros
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={prev} className="grid place-items-center w-9 h-9 rounded-lg text-[#5d5d5d] hover:bg-black/5">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-[#0d0d0d] capitalize min-w-[160px] text-center">{monthLabel}</span>
            <button onClick={next} className="grid place-items-center w-9 h-9 rounded-lg text-[#5d5d5d] hover:bg-black/5">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden border border-black/8 bg-black/5">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bg-[#f9f9f9] py-2 text-center text-[11px] font-medium text-[#8e8e8e]">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            const dayItems = day ? byDay.get(`${year}-${month}-${day}`) ?? [] : []
            return (
              <div key={i} className="min-h-[96px] bg-white p-1.5">
                {day && (
                  <>
                    <span
                      className={`inline-grid place-items-center w-6 h-6 rounded-full text-xs ${
                        isToday(day) ? 'bg-[#0d0d0d] text-white' : 'text-[#5d5d5d]'
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 flex flex-col gap-1">
                      {dayItems.map((it) => (
                        <button
                          key={it.slug}
                          onClick={() => setTarget(it)}
                          className="block w-full truncate text-left rounded-md bg-amber-500/10 px-1.5 py-1 text-[11px] text-amber-700 hover:bg-amber-500/20"
                          title={`${it.topic} — ${new Date(it.scheduled_at!).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                        >
                          {it.topic}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-[#9d9d9d]">
          Mostra os conteúdos com publicação agendada. Clique em um item para reagendar.
        </p>
      </div>

      {target && (
        <RescheduleDrawer
          item={target}
          accountLabels={accountLabels}
          onClose={() => setTarget(null)}
          onApplied={(slug, when) => { applyReschedule(slug, when); setTarget(null) }}
        />
      )}
    </div>
  )
}

function RescheduleDrawer({
  item,
  accountLabels,
  onClose,
  onApplied,
}: {
  item: CreationSummary
  accountLabels: Record<string, string>
  onClose: () => void
  onApplied: (slug: string, scheduledAt: string | null) => void
}) {
  const [value, setValue] = useState(toInputValue(item.scheduled_at))
  const [saving, setSaving] = useState<'move' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const minDatetime = toInputValue(new Date(Date.now() + 10 * 60 * 1000).toISOString())
  const accounts = item.publish_targets.map((id) => accountLabels[id] ?? id)

  async function patch(scheduledAt: string | null, kind: 'move' | 'remove') {
    setSaving(kind)
    setError(null)
    try {
      const res = await fetch(`/api/content/${item.slug}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      })
      if (!res.ok) throw new Error()
      onApplied(item.slug, scheduledAt)
    } catch {
      setError('Falha ao atualizar')
      setSaving(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-black/8 z-50 flex flex-col shadow-2xl">
        <div className="h-14 flex-none flex items-center justify-between px-5 border-b border-black/5">
          <span className="text-sm font-semibold text-[#0d0d0d]">Reagendar</span>
          <button onClick={onClose} className="text-[#9d9d9d] hover:text-[#0d0d0d]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="rounded-xl bg-black/[0.03] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[#9d9d9d] mb-1">Conteúdo</p>
            <p className="text-sm text-[#0d0d0d] leading-snug">{item.topic}</p>
            <p className="mt-1.5 text-xs text-[#8e8e8e]">
              {PLATFORM_LABEL[item.platform] ?? item.platform}
              {accounts.length > 0 && ` · ${accounts.join(', ')}`}
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#5d5d5d]">Nova data e hora</span>
            <input
              type="datetime-local"
              value={value}
              min={minDatetime}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-sm text-[#0d0d0d] outline-none focus:border-black/25 [color-scheme:light]"
            />
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Link
            href={`/editor?slug=${item.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#5d5d5d] hover:text-[#0d0d0d]"
          >
            <ExternalLink size={14} />
            Abrir no editor
          </Link>
        </div>

        <div className="p-5 border-t border-black/5 flex flex-col gap-2">
          <button
            onClick={() => value && patch(new Date(value).toISOString(), 'move')}
            disabled={!value || !!saving}
            className="w-full h-11 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            {saving === 'move' ? 'Salvando…' : 'Reagendar'}
          </button>
          <button
            onClick={() => patch(null, 'remove')}
            disabled={!!saving}
            className="w-full h-10 rounded-xl text-sm text-[#5d5d5d] hover:bg-black/5 disabled:opacity-40 transition-colors"
          >
            {saving === 'remove' ? 'Removendo…' : 'Remover agendamento'}
          </button>
        </div>
      </div>
    </>
  )
}
