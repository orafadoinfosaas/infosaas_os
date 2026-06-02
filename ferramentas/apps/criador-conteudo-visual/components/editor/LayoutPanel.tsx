'use client'

import { useRef, useState } from 'react'
import { Group, Segmented, AlignSegmented, VAlignSegmented, ColorField, RangeField, ToggleRow, fieldInput } from './controls'
import { DEFAULT_LAYOUT, type Layout, type Media, type Background, type Mask, type Align } from '@/lib/schemas/layout.schema'
import { TEMPLATES } from '@/lib/templates'
import type { Content, TemplateId } from '@/lib/schemas/content.schema'

const BASE_OPTIONS = Object.values(TEMPLATES).map((t) => ({ value: t.template_id, label: t.label }))

function getDesign(content: Content, idx: number): Layout {
  if (content.content_type === 'carrossel') return content.slides[idx]?.design ?? DEFAULT_LAYOUT
  if (content.content_type === 'video') return DEFAULT_LAYOUT
  return content.design ?? DEFAULT_LAYOUT
}

// Troca a base: muda template_id (cores/tipografia no render) e re-tematiza o
// fundo sólido de todos os frames com a paleta da nova base.
function applyBase(content: Content, baseId: TemplateId): Content {
  const palette = TEMPLATES[baseId].palette
  const retheme = (d: Layout): Layout =>
    d.background.type === 'solid' ? { ...d, background: { ...d.background, color: palette.background } } : d
  if (content.content_type === 'carrossel') {
    return {
      ...content,
      template_id: baseId,
      base_id: baseId,
      slides: content.slides.map((s) => ({ ...s, design: retheme(s.design ?? DEFAULT_LAYOUT) })),
    }
  }
  if (content.content_type === 'video') return content
  return { ...content, template_id: baseId, base_id: baseId, design: retheme(content.design ?? DEFAULT_LAYOUT) } as Content
}

function withDesign(content: Content, idx: number, design: Layout): Content {
  if (content.content_type === 'carrossel') {
    return { ...content, slides: content.slides.map((s, i) => (i === idx ? { ...s, design } : s)) }
  }
  return { ...content, design } as Content
}

type Props = {
  content: Content
  activeSlideIndex: number
  slug?: string
  onChange: (c: Content) => void
}

export function LayoutPanel({ content, activeSlideIndex, slug, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const idx = content.content_type === 'carrossel' ? activeSlideIndex : 0
  const design = getDesign(content, idx)

  async function handleAIGenerate() {
    if (!slug || !aiPrompt.trim() || aiLoading) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          slug,
          aspectRatio: content.format.aspect_ratio,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error || 'Falha ao gerar.')
        return
      }
      setMedia({ kind: 'image', source: 'ai', ref: data.filename })
      setAiPrompt('')
    } catch {
      setAiError('Falha ao gerar.')
    } finally {
      setAiLoading(false)
    }
  }

  const set = (d: Layout) => onChange(withDesign(content, idx, d))
  const setAlign = (p: Partial<Align>) => set({ ...design, align: { ...design.align, ...p } })
  const setMedia = (p: Partial<Media>) => set({ ...design, media: { ...design.media, ...p } })
  const setBackground = (p: Partial<Background>) => set({ ...design, background: { ...design.background, ...p } })
  const setMask = (p: Partial<Mask>) => set({ ...design, mask: { ...design.mask, ...p } })

  async function handleUpload(file: File) {
    if (!slug) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('slug', slug)
    fd.append('contentType', content.content_type)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) return
      const data = (await res.json()) as { path: string }
      setMedia({ kind: 'image', source: 'upload', ref: data.path })
    } catch {
      // silencioso
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Base de aplicação */}
      <Group label="Base">
        <Segmented
          value={content.base_id ?? content.template_id}
          onChange={(v) => onChange(applyBase(content, v as TemplateId))}
          options={BASE_OPTIONS}
        />
      </Group>

      {/* Alinhamento: horizontal + vertical, com ícones */}
      <Group label="Alinhamento">
        <div className="flex gap-2">
          <div className="flex-1">
            <AlignSegmented value={design.align.horizontal} onChange={(horizontal) => setAlign({ horizontal })} />
          </div>
          <div className="flex-1">
            <VAlignSegmented value={design.align.vertical} onChange={(vertical) => setAlign({ vertical })} />
          </div>
        </div>
      </Group>

      {/* Mídia */}
      <Group label="Mídia">
        <Segmented
          value={design.media.kind === 'none' ? 'none' : 'image'}
          onChange={(v) => setMedia({ kind: v === 'none' ? 'none' : 'image' })}
          options={[
            { value: 'none', label: 'Nenhuma' },
            { value: 'image', label: 'Imagem' },
          ]}
        />
        {design.media.kind !== 'none' && (
          <>
            <input
              className={fieldInput}
              placeholder="URL da imagem"
              value={design.media.ref}
              onChange={(e) => setMedia({ ref: e.target.value, source: 'url' })}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!slug}
              className="h-9 rounded-[10px] border border-black/10 text-sm text-[#3d3d3d] hover:bg-black/5 disabled:opacity-40 transition-colors"
              title={slug ? 'Enviar arquivo' : 'Salve o conteúdo para habilitar upload'}
            >
              Enviar arquivo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUpload(f)
                e.target.value = ''
              }}
            />
            {/* Gerar com IA */}
            <div className="flex flex-col gap-2 rounded-[10px] border border-black/5 bg-black/[0.02] p-2.5">
              <span className="text-[11px] font-medium text-[#5d5d5d]">Gerar com IA</span>
              <textarea
                rows={2}
                placeholder="Descreva a imagem que você quer…"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiLoading}
                className="w-full resize-none rounded-md border border-black/10 bg-white px-2 py-1.5 text-[12px] text-[#0d0d0d] placeholder:text-[#9d9d9d] outline-none focus:border-black/25"
              />
              <button
                onClick={handleAIGenerate}
                disabled={!slug || !aiPrompt.trim() || aiLoading}
                title={slug ? 'Gerar imagem com IA' : 'Salve o conteúdo antes de gerar'}
                className="h-8 rounded-md bg-[#0d0d0d] text-xs text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {aiLoading ? 'Gerando…' : 'Gerar imagem'}
              </button>
              {aiError && <p className="text-[10px] text-red-500">{aiError}</p>}
              {!slug && <p className="text-[10px] text-amber-600">Salve o conteúdo antes de gerar imagens.</p>}
            </div>
            <Segmented
              value={design.media.mode}
              onChange={(v) => setMedia({ mode: v })}
              options={[
                { value: 'cover', label: 'Cover' },
                { value: 'element', label: 'Elemento' },
              ]}
            />
            {design.media.mode === 'element' && (
              <>
                <Segmented
                  value={design.media.position ?? 'top'}
                  onChange={(v) => setMedia({ position: v })}
                  options={[
                    { value: 'top', label: 'Topo' },
                    { value: 'middle', label: 'Meio' },
                    { value: 'bottom', label: 'Base' },
                  ]}
                />
                <div className="flex items-center gap-2">
                  <span className="w-16 text-[11px] text-[#9d9d9d]">Raio</span>
                  <RangeField
                    value={design.media.radius ?? 0}
                    min={0}
                    max={120}
                    step={2}
                    onChange={(r) => setMedia({ radius: r })}
                    format={(v) => `${v}px`}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Group>

      {/* Fundo */}
      <Group label="Fundo">
        <Segmented
          value={design.background.type}
          onChange={(v) => setBackground({ type: v })}
          options={[
            { value: 'solid', label: 'Sólido' },
            { value: 'gradient', label: 'Gradiente' },
          ]}
        />
        {design.background.type === 'solid' ? (
          <ColorField value={design.background.color} onChange={(c) => setBackground({ color: c })} />
        ) : (
          <>
            <ColorField
              value={design.background.gradient?.from ?? '#FF3D00'}
              onChange={(c) =>
                setBackground({
                  gradient: { from: c, to: design.background.gradient?.to ?? '#B82C00', angle: design.background.gradient?.angle ?? 135 },
                })
              }
            />
            <ColorField
              value={design.background.gradient?.to ?? '#B82C00'}
              onChange={(c) =>
                setBackground({
                  gradient: { from: design.background.gradient?.from ?? '#FF3D00', to: c, angle: design.background.gradient?.angle ?? 135 },
                })
              }
            />
            <RangeField
              value={design.background.gradient?.angle ?? 135}
              min={0}
              max={360}
              step={5}
              onChange={(a) =>
                setBackground({
                  gradient: { from: design.background.gradient?.from ?? '#FF3D00', to: design.background.gradient?.to ?? '#B82C00', angle: a },
                })
              }
              format={(v) => `${v}°`}
            />
          </>
        )}
      </Group>

      {/* Máscara */}
      <Group label="Máscara (sobre a mídia)">
        <ColorField value={design.mask.color} onChange={(c) => setMask({ color: c })} />
        <ToggleRow
          label="Degradê"
          checked={!!design.mask.gradient}
          onChange={(v) => setMask({ gradient: v ? design.mask.gradient ?? { top: 0, mid: 0.6, bottom: 1 } : undefined })}
        />
        {design.mask.gradient ? (
          (['top', 'mid', 'bottom'] as const).map((stop) => (
            <div key={stop} className="flex items-center gap-2">
              <span className="w-10 text-[11px] text-[#9d9d9d]">{stop === 'top' ? 'Topo' : stop === 'mid' ? 'Meio' : 'Base'}</span>
              <RangeField
                value={design.mask.gradient![stop]}
                min={0}
                max={1}
                step={0.05}
                onChange={(val) => setMask({ gradient: { ...design.mask.gradient!, [stop]: val } })}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
          ))
        ) : (
          <RangeField
            value={design.mask.opacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(o) => setMask({ opacity: o })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        )}
      </Group>
    </div>
  )
}
