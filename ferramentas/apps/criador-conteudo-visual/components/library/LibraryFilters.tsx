'use client'

import { CONTENT_TYPE_LABELS, PHASE_LABELS } from '@/lib/chat/flow-state'
import type { ContentType, FunnelPhase } from '@/lib/chat/flow-state'

type TypeFilter = ContentType | 'all'
type PhaseFilter = FunnelPhase | 'all'

type Props = {
  typeFilter: TypeFilter
  phaseFilter: PhaseFilter
  onTypeChange: (t: TypeFilter) => void
  onPhaseChange: (p: PhaseFilter) => void
}

const TYPES: TypeFilter[] = ['all', 'carrossel', 'post', 'anuncio']
const PHASES: PhaseFilter[] = ['all', 'descoberta', 'relacionamento', 'prontidao']

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
        active
          ? 'bg-[#FF3D00] border-[#FF3D00] text-white'
          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
      }`}
    >
      {children}
    </button>
  )
}

export function LibraryFilters({ typeFilter, phaseFilter, onTypeChange, onPhaseChange }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        {TYPES.map((t) => (
          <Chip key={t} active={typeFilter === t} onClick={() => onTypeChange(t)}>
            {t === 'all' ? 'Todos' : CONTENT_TYPE_LABELS[t]}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {PHASES.map((p) => (
          <Chip key={p} active={phaseFilter === p} onClick={() => onPhaseChange(p)}>
            {p === 'all' ? 'Todas as fases' : PHASE_LABELS[p]}
          </Chip>
        ))}
      </div>
    </div>
  )
}
