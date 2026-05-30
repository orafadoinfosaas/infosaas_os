'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type Konva from 'konva'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { FrameCanvas } from './FrameCanvas'
import { composeFrame } from '@/lib/renderer/compose'
import { useFontReady } from '@/lib/renderer/font-ready'
import type { Content } from '@/lib/schemas/content.schema'

export type EditorCanvasHandle = {
  exportPNG: () => Promise<string | null>
}

type Props = {
  content: Content
  slug?: string
  activeIndex: number
  onActiveIndexChange: (i: number) => void
  selectedField?: string | null
  onFieldClick?: (fieldId: string) => void
  onAddSlide?: () => void
  onRemoveSlide?: (index: number) => void
}

const MAX_W = 680
const MAX_H = 600

function fitScale(width: number, height: number): number {
  return Math.min(MAX_W / width, MAX_H / height)
}

export const EditorCanvas = forwardRef<EditorCanvasHandle, Props>(function EditorCanvas(
  { content, slug, activeIndex, onActiveIndexChange, selectedField, onFieldClick, onAddSlide, onRemoveSlide },
  ref
) {
  const [activeHeadline, setActiveHeadline] = useState<0 | 1 | 2>(0)
  const stageRef = useRef<Konva.Stage | null>(null)
  const contentSlug = slug ?? 'preview'

  const isCarrossel = content.content_type === 'carrossel'
  const total = isCarrossel ? content.slides.length : 1
  const idx = Math.min(activeIndex, total - 1)

  const scale = fitScale(content.format.width, content.format.height)
  useFontReady() // recompõe quando a fonte carrega (medição de texto precisa dela)

  useImperativeHandle(ref, () => ({
    exportPNG: async () => {
      if (!stageRef.current) return null
      return stageRef.current.toDataURL({ pixelRatio: 1 / scale, mimeType: 'image/png' })
    },
  }))

  const spec = composeFrame(content, idx, contentSlug, activeHeadline)

  return (
    <div className="flex flex-col h-full">
      {/* Faixa de slides (carrossel) */}
      {isCarrossel && (
        <div className="flex-none flex items-center gap-2 overflow-x-auto px-6 py-4 border-b border-black/5">
          {content.slides.map((s, i) => (
            <div key={s.index} className="group/slide relative flex-none">
              <button
                onClick={() => onActiveIndexChange(i)}
                className={`grid place-items-center w-11 h-11 rounded-xl text-sm font-medium transition-all ${
                  i === idx
                    ? 'ring-2 ring-accent bg-white text-[#0d0d0d] shadow-sm'
                    : 'bg-black/[0.04] text-[#5d5d5d] hover:text-[#0d0d0d]'
                }`}
              >
                {s.index}
              </button>
              {onRemoveSlide && total > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveSlide(i)
                  }}
                  title="Remover slide"
                  className="absolute -top-1.5 -right-1.5 grid place-items-center w-[18px] h-[18px] rounded-full bg-[#0d0d0d] text-white opacity-0 group-hover/slide:opacity-100 hover:bg-red-500 shadow transition-opacity"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
          {onAddSlide && content.slides.length < 10 && (
            <button
              onClick={onAddSlide}
              className="grid place-items-center w-11 h-11 flex-none rounded-xl border border-dashed border-black/15 text-[#9d9d9d] hover:text-[#0d0d0d] hover:border-black/30"
              title="Adicionar slide"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      )}

      {/* Stage central */}
      <div className="flex-1 min-h-0 flex items-center justify-center gap-4 p-6 overflow-auto">
        {isCarrossel && total > 1 && (
          <button
            onClick={() => onActiveIndexChange(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="grid place-items-center w-9 h-9 flex-none rounded-full bg-white shadow-sm text-[#5d5d5d] hover:text-[#0d0d0d] disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="rounded-lg overflow-hidden shadow-lg">
          <FrameCanvas
            spec={spec}
            scale={scale}
            selectedField={selectedField}
            onFieldClick={onFieldClick}
            stageRef={stageRef}
          />
        </div>

        {isCarrossel && total > 1 && (
          <button
            onClick={() => onActiveIndexChange(Math.min(total - 1, idx + 1))}
            disabled={idx === total - 1}
            className="grid place-items-center w-9 h-9 flex-none rounded-full bg-white shadow-sm text-[#5d5d5d] hover:text-[#0d0d0d] disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Contador / toggle de headline */}
      <div className="flex-none flex items-center justify-center gap-3 pb-5">
        {content.content_type === 'anuncio' ? (
          <div className="flex gap-2">
            {content.headlines.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveHeadline(i as 0 | 1 | 2)}
                className={`h-7 px-3 rounded-full text-xs transition-colors ${
                  activeHeadline === i ? 'bg-accent text-white' : 'bg-black/[0.04] text-[#5d5d5d] hover:text-[#0d0d0d]'
                }`}
              >
                Headline {i + 1}
              </button>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center h-7 rounded-full bg-black/[0.04] px-3 text-xs text-[#5d5d5d] tabular-nums">
            {idx + 1} / {total}
          </span>
        )}
      </div>
    </div>
  )
})
