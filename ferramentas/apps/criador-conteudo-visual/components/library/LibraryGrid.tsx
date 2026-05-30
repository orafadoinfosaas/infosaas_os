'use client'

import { useState, useEffect } from 'react'
import { LibraryFilters } from './LibraryFilters'
import { CreationCard } from './CreationCard'
import type { CreationSummary } from '@/lib/content/reader'
import type { ContentType, FunnelPhase } from '@/lib/chat/flow-state'

type TypeFilter = ContentType | 'all'
type PhaseFilter = FunnelPhase | 'all'

type Props = {
  onPublish?: (item: CreationSummary) => void
  refreshKey?: number
}

export function LibraryGrid({ onPublish, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<CreationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all')

  useEffect(() => {
    setLoading(true)
    fetch('/api/content/list')
      .then((r) => r.json())
      .then((data: CreationSummary[]) => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [refreshKey])

  const filtered = items.filter((item) => {
    if (typeFilter !== 'all' && item.content_type !== typeFilter) return false
    if (phaseFilter !== 'all' && item.funnel_phase !== phaseFilter) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <LibraryFilters
        typeFilter={typeFilter}
        phaseFilter={phaseFilter}
        onTypeChange={setTypeFilter}
        onPhaseChange={setPhaseFilter}
      />

      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#FF3D00] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center pt-20 text-white/30 text-sm">
          {items.length === 0
            ? 'Nenhum conteúdo criado ainda.'
            : 'Nenhum resultado para os filtros selecionados.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <CreationCard
              key={item.slug}
              item={item}
              onPublish={onPublish ? () => onPublish(item) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
