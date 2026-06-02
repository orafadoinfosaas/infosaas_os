'use client'

import { useEffect, useRef, useState } from 'react'
import type { PlayerRef } from '@remotion/player'
import { Trash2 } from 'lucide-react'
import { RangeField } from '@/components/editor/controls'
import {
  addCut,
  removeCutAt,
  isCut,
  sourceTimeToOutputFrame,
  outputTimeToSourceTime,
  type Range,
  type Zoom,
  type EditPlan,
} from '@/lib/video/edit-plan'

type Props = {
  slug: string
  waveVersion: string
  sourceDuration: number
  cuts: Range[]
  zooms: Zoom[]
  plan: EditPlan
  fps: number
  playerRef: React.RefObject<PlayerRef | null>
  onCutsChange: (cuts: Range[]) => void
  onZoomsChange: (zooms: Zoom[]) => void
}

const DRAG_PX = 5

export function Timeline({ slug, waveVersion, sourceDuration, cuts, zooms, plan, fps, playerRef, onCutsChange, onZoomsChange }: Props) {
  const cutRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const [playT, setPlayT] = useState(0) // tempo de fonte do playhead
  const [sel, setSel] = useState<{ a: number; b: number } | null>(null)
  const [zsel, setZsel] = useState<{ a: number; b: number } | null>(null)
  const [selectedZoom, setSelectedZoom] = useState<number | null>(null)
  const drag = useRef<{ row: 'cut' | 'zoom'; startT: number; startX: number; moved: boolean } | null>(null)
  const scrubbing = useRef(false)

  // Playhead: lê o frame do Player a cada rAF e mapeia output→fonte.
  // Durante o scrub (arrasto da agulha) não sobrescreve — quem manda é o usuário.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = playerRef.current
      if (p && !scrubbing.current) setPlayT(outputTimeToSourceTime(plan, p.getCurrentFrame() / fps))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [plan, fps, playerRef])

  // Scrub: arrastar a agulha navega o vídeo ao vivo.
  function scrubTo(clientX: number, el: HTMLDivElement) {
    const t = xToT(clientX, el)
    setPlayT(t)
    playerRef.current?.seekTo(sourceTimeToOutputFrame(plan, t, fps))
  }
  function onScrubDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    scrubbing.current = true
    playerRef.current?.pause()
    scrubTo(e.clientX, e.currentTarget)
  }
  function onScrubMove(e: React.PointerEvent<HTMLDivElement>) {
    if (scrubbing.current) scrubTo(e.clientX, e.currentTarget)
  }
  function onScrubUp() {
    scrubbing.current = false
  }

  const pct = (t: number) => `${(t / sourceDuration) * 100}%`
  const xToT = (clientX: number, el: HTMLDivElement) => {
    const r = el.getBoundingClientRect()
    const px = Math.max(0, Math.min(r.width, clientX - r.left))
    return (px / r.width) * sourceDuration
  }

  function seek(t: number) {
    playerRef.current?.seekTo(sourceTimeToOutputFrame(plan, t, fps))
  }

  function onDown(row: 'cut' | 'zoom', e: React.PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const t = xToT(e.clientX, el)
    drag.current = { row, startT: t, startX: e.clientX, moved: false }
    if (row === 'cut') setSel({ a: t, b: t })
    else setZsel({ a: t, b: t })
  }
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    if (Math.abs(e.clientX - d.startX) > DRAG_PX) d.moved = true
    const t = xToT(e.clientX, e.currentTarget)
    if (d.row === 'cut') setSel({ a: d.startT, b: t })
    else setZsel({ a: d.startT, b: t })
  }
  function onUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    drag.current = null
    if (!d) return
    const t = xToT(e.clientX, e.currentTarget)
    const a = Math.min(d.startT, t)
    const b = Math.max(d.startT, t)

    if (d.row === 'cut') {
      setSel(null)
      if (d.moved && b - a > 0.1) onCutsChange(addCut(cuts, { start: a, end: b }))
      else if (isCut(cuts, d.startT)) onCutsChange(removeCutAt(cuts, d.startT))
      else seek(d.startT)
    } else {
      setZsel(null)
      if (d.moved && b - a > 0.2) {
        onZoomsChange([...zooms, { start: a, end: b, scale: 1.4, x: 0, y: 0 }])
        setSelectedZoom(zooms.length)
      }
    }
  }

  function updateZoom(i: number, patch: Partial<Zoom>) {
    onZoomsChange(zooms.map((z, idx) => (idx === i ? { ...z, ...patch } : z)))
  }
  function removeZoom(i: number) {
    onZoomsChange(zooms.filter((_, idx) => idx !== i))
    setSelectedZoom(null)
  }

  const ticks = Math.max(1, Math.floor(sourceDuration / 5))

  return (
    <div className="flex-none border-t border-black/8 bg-white px-4 py-3 select-none">
      {/* controle do zoom selecionado */}
      {selectedZoom != null && zooms[selectedZoom] && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-black/[0.03] px-3 py-2">
          <span className="text-xs font-medium text-[#5d5d5d]">Zoom {selectedZoom + 1}</span>
          <div className="flex-1">
            <RangeField value={zooms[selectedZoom].scale} min={1} max={2.5} step={0.05} onChange={(v) => updateZoom(selectedZoom, { scale: v })} format={(v) => `${v.toFixed(2)}x`} />
          </div>
          <button onClick={() => removeZoom(selectedZoom)} className="text-[#9d9d9d] hover:text-red-500" title="Remover zoom">
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* barra de scrub — agulha arrastável */}
      <div
        onPointerDown={onScrubDown}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubUp}
        className="relative h-6 mb-1 cursor-ew-resize"
        title="Arraste a agulha para navegar pelo vídeo"
      >
        {Array.from({ length: ticks + 1 }, (_, i) => (
          <span key={i} className="absolute bottom-0 text-[9px] text-[#bdbdbd] -translate-x-1/2 pointer-events-none" style={{ left: pct(i * 5) }}>
            {i * 5}s
          </span>
        ))}
        <div className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none" style={{ left: pct(playT) }}>
          <div className="absolute -top-0.5 -left-[5px] h-0 w-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-accent" />
        </div>
      </div>

      {/* trilha de cortes (waveform + cortes + playhead) */}
      <div
        ref={cutRef}
        onPointerDown={(e) => onDown('cut', e)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="relative h-20 rounded-lg overflow-hidden bg-black/[0.04] cursor-text"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/assets/${slug}/assets/waveform.png?v=${encodeURIComponent(waveVersion)}`} alt="" className="absolute inset-0 h-full w-full object-fill opacity-70 pointer-events-none" />
        {cuts.map((c, i) => (
          <div key={i} className="absolute top-0 bottom-0 bg-red-500/30 border-x border-red-500/60 pointer-events-none" style={{ left: pct(c.start), width: pct(c.end - c.start) }} />
        ))}
        {sel && (
          <div className="absolute top-0 bottom-0 bg-red-500/20 pointer-events-none" style={{ left: pct(Math.min(sel.a, sel.b)), width: pct(Math.abs(sel.b - sel.a)) }} />
        )}
        <div className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none" style={{ left: pct(playT) }} />
      </div>

      {/* trilha de zoom */}
      <div
        ref={zoomRef}
        onPointerDown={(e) => onDown('zoom', e)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="relative h-8 mt-1 rounded-lg overflow-hidden bg-black/[0.03] cursor-crosshair"
      >
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#bdbdbd] pointer-events-none">zoom — arraste p/ criar</span>
        {zooms.map((z, i) => (
          <div
            key={i}
            onPointerDown={(e) => { e.stopPropagation(); setSelectedZoom(i) }}
            className={`absolute top-1 bottom-1 rounded bg-blue-500/30 border flex items-center justify-end ${selectedZoom === i ? 'border-blue-600' : 'border-blue-500/50'}`}
            style={{ left: pct(z.start), width: pct(z.end - z.start) }}
            title={`Zoom ${z.scale.toFixed(2)}x — clique no × para remover`}
          >
            <button
              onPointerDown={(e) => { e.stopPropagation(); removeZoom(i) }}
              className="grid place-items-center h-4 w-4 mr-0.5 rounded-full bg-blue-700 text-white text-[10px] leading-none hover:bg-red-500"
              title="Remover zoom"
            >
              ×
            </button>
          </div>
        ))}
        {zsel && (
          <div className="absolute top-1 bottom-1 rounded bg-blue-500/20 pointer-events-none" style={{ left: pct(Math.min(zsel.a, zsel.b)), width: pct(Math.abs(zsel.b - zsel.a)) }} />
        )}
        <div className="absolute top-0 bottom-0 w-0.5 bg-accent/40 pointer-events-none" style={{ left: pct(playT) }} />
      </div>

      <p className="mt-1.5 text-[10px] text-[#bdbdbd]">
        Trilha em vermelho = cortes (arraste p/ cortar, clique no bloco p/ desfazer, clique no vazio p/ navegar). Azul = zoom.
      </p>
    </div>
  )
}
