'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import type Konva from 'konva'
import { FrameCanvas } from './FrameCanvas'
import { composeFrame } from '@/lib/renderer/compose'
import { waitForFonts, useFontReady } from '@/lib/renderer/font-ready'
import type { Content } from '@/lib/schemas/content.schema'

export type ExportedFrame = { filename: string; dataUrl: string }
export type FrameExporterHandle = { captureAll: () => Promise<ExportedFrame[]> }

function frameCount(content: Content): number {
  return content.content_type === 'carrossel' ? content.slides.length : 1
}

// Renderiza todos os frames em stages ocultos (escala 1 = tamanho real) e
// captura cada um como PNG. Usado por Exportar e Publicar.
export const FrameExporter = forwardRef<FrameExporterHandle, { content: Content; slug?: string }>(
  function FrameExporter({ content, slug }, ref) {
    const n = frameCount(content)
    useFontReady() // garante medição de texto com a fonte carregada antes da captura
    const refs = useRef<React.RefObject<Konva.Stage | null>[]>([])
    if (refs.current.length !== n) {
      refs.current = Array.from({ length: n }, (_, i) => refs.current[i] ?? { current: null })
    }

    useImperativeHandle(ref, () => ({
      captureAll: async () => {
        await waitForFonts()
        // espera as imagens (mídia/logo) carregarem nos stages ocultos
        await new Promise((r) => setTimeout(r, 800))
        const out: ExportedFrame[] = []
        for (let i = 0; i < n; i++) {
          const stage = refs.current[i]?.current
          if (!stage) continue
          out.push({
            filename: `slide-${String(i + 1).padStart(2, '0')}.png`,
            dataUrl: stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' }),
          })
        }
        return out
      },
    }))

    return (
      <div aria-hidden style={{ position: 'absolute', left: -99999, top: 0, width: 0, height: 0, overflow: 'hidden' }}>
        {Array.from({ length: n }, (_, i) => (
          <FrameCanvas key={i} spec={composeFrame(content, i, slug)} scale={1} stageRef={refs.current[i]} />
        ))}
      </div>
    )
  }
)
