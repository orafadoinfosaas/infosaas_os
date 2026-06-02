'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, CalendarClock, Send, ChevronDown } from 'lucide-react'
import { RATIOS_BY_TYPE, RATIO_DIMENSIONS, type AspectRatio } from '@/lib/schemas/format.schema'
import type { Content } from '@/lib/schemas/content.schema'
import { UsageBadge } from '@/components/layout/UsageBadge'

export type ExportKind = 'png-current' | 'png-all' | 'pdf'

const FORMAT_LABEL: Record<string, string> = {
  estatico: 'Estático',
  carrossel: 'Carrossel',
  stories: 'Stories',
  anuncio: 'Anúncio',
  post: 'Estático',
}
const PHASE_LABEL: Record<string, string> = {
  descoberta: 'Descoberta',
  relacionamento: 'Relacionamento',
  prontidao: 'Prontidão',
}

type Props = {
  content: Content
  onFormatChange: (ratio: AspectRatio) => void
  onExport: (kind: ExportKind) => void
  onSchedule: () => void
  onPublish: () => void
}

function ExportMenu({ onExport }: { onExport: (kind: ExportKind) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const items: { kind: ExportKind; label: string }[] = [
    { kind: 'png-current', label: 'PNG (slide atual)' },
    { kind: 'png-all', label: 'PNG (todos)' },
    { kind: 'pdf', label: 'PDF (todos)' },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-9 rounded-lg px-3 text-sm text-[#3d3d3d] hover:bg-black/5 transition-colors"
      >
        <Download size={16} />
        Exportar
        <ChevronDown size={14} className="opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[190px] rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-1.5 z-30">
          {items.map((it) => (
            <button
              key={it.kind}
              onClick={() => {
                onExport(it.kind)
                setOpen(false)
              }}
              className="block w-full rounded-xl px-3 h-9 text-left text-sm text-[#0d0d0d] hover:bg-black/5"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Indicator({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center h-7 rounded-full bg-black/[0.04] px-3 text-xs text-[#5d5d5d]">
      {children}
    </span>
  )
}

export function EditorTopBar({ content, onFormatChange, onExport, onSchedule, onPublish }: Props) {
  const ratios = RATIOS_BY_TYPE[content.content_type] ?? ['1:1', '4:5']
  const current = content.format.aspect_ratio

  return (
    <header className="h-14 flex-none flex items-center gap-3 border-b border-black/5 bg-white px-4">
      {/* Indicadores de contexto */}
      <div className="flex items-center gap-2">
        <Indicator>Instagram</Indicator>
        <Indicator>{FORMAT_LABEL[content.content_type] ?? content.content_type}</Indicator>
        <Indicator>{PHASE_LABEL[content.funnel_phase] ?? content.funnel_phase}</Indicator>
      </div>

      {/* Seletor de proporção — segmented control suave */}
      <div className="ml-3 flex items-center rounded-full bg-black/[0.04] p-1">
        {ratios.map((r) => {
          const active = current === r
          return (
            <button
              key={r}
              onClick={() => onFormatChange(r)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                active ? 'bg-white text-[#0d0d0d] shadow-sm' : 'text-[#5d5d5d] hover:text-[#0d0d0d]'
              }`}
              title={`${RATIO_DIMENSIONS[r].width}×${RATIO_DIMENSIONS[r].height}`}
            >
              {r}
            </button>
          )
        })}
      </div>

      {/* Ações */}
      <div className="ml-auto flex items-center gap-2">
        <UsageBadge />
        <ExportMenu onExport={onExport} />
        <button
          onClick={onSchedule}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-[#0d0d0d] px-3.5 text-sm text-white hover:opacity-90 transition-opacity"
        >
          <CalendarClock size={16} />
          Agendar
        </button>
        <button
          onClick={onPublish}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Send size={16} />
          Publicar agora
        </button>
      </div>
    </header>
  )
}
