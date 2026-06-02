'use client'

import { useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Type } from 'lucide-react'
import { EditorTopBar, type ExportKind } from './EditorTopBar'
import { EditorCanvas, type EditorCanvasHandle } from './EditorCanvas'
import { FrameExporter, type FrameExporterHandle, type ExportedFrame } from './FrameExporter'
import { ChatTab } from './ChatTab'
import { MarcaTab } from './MarcaTab'
import { LayoutPanel } from './LayoutPanel'
import { PublishDrawer, type PublishResult } from './PublishDrawer'
import { Toggle, AlignSegmented, Segmented, RangeField } from './controls'
import { getTemplate } from '@/lib/templates'
import { DEFAULT_LAYOUT, FONT_OPTIONS, type Layout, type TextStyle } from '@/lib/schemas/layout.schema'
import { makeFormat, type AspectRatio } from '@/lib/schemas/format.schema'
import type { Content, Carrossel } from '@/lib/schemas/content.schema'
import type { FlowState } from '@/lib/chat/flow-state'

type Tab = 'chat' | 'marca' | 'texto' | 'legenda'

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'marca', label: 'Marca' },
  { id: 'texto', label: 'Texto' },
  { id: 'legenda', label: 'Legenda' },
]

type Props = {
  content: Content | null
  caption: string
  slug?: string
  tab: Tab
  onTabChange: (t: Tab) => void
  flowState: FlowState
  setFlowState: (s: FlowState | ((prev: FlowState) => FlowState)) => void
  selectedField: string | null
  onSelectField: (f: string | null) => void
  onContentChange: (c: Content) => void
  onCaptionChange: (s: string) => void
  onSave: () => Promise<void>
  exportRef: React.RefObject<EditorCanvasHandle | null>
}

// ─── Inputs claros ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#5d5d5d]">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-sm text-[#0d0d0d] placeholder:text-[#9d9d9d] outline-none focus:border-black/25 transition-colors'

// ─── Aba Texto ──────────────────────────────────────────────────────────────

function frameDesign(content: Content, idx: number): Layout {
  if (content.content_type === 'carrossel') return content.slides[idx]?.design ?? DEFAULT_LAYOUT
  if (content.content_type === 'video') return DEFAULT_LAYOUT
  return content.design ?? DEFAULT_LAYOUT
}
function withFrameDesign(content: Content, idx: number, design: Layout): Content {
  if (content.content_type === 'carrossel') {
    return { ...content, slides: content.slides.map((s, i) => (i === idx ? { ...s, design } : s)) }
  }
  return { ...content, design } as Content
}

// Um campo de texto: edição do valor + visível/oculto + tamanho/fonte/alinhamento.
function TextFieldEditor({
  label,
  multiline,
  value,
  baseSize,
  baseLineHeight,
  frameAlign,
  style,
  onValue,
  onStyle,
}: {
  label: string
  multiline?: boolean
  value: string
  baseSize: number
  baseLineHeight: number
  frameAlign: 'left' | 'center' | 'right'
  style: TextStyle
  onValue: (v: string) => void
  onStyle: (patch: Partial<TextStyle>) => void
}) {
  const [open, setOpen] = useState(false)
  const hasContent = value.trim().length > 0
  // Campo vazio → não há o que mostrar: toggle desligado e desabilitado.
  const visible = hasContent && !style.hidden
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#5d5d5d]">{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title="Tamanho, fonte e alinhamento"
            className={`grid place-items-center w-7 h-7 rounded-md transition-colors ${
              open ? 'bg-black/[0.06] text-[#0d0d0d]' : 'text-[#9d9d9d] hover:bg-black/5'
            }`}
          >
            <Type size={14} />
          </button>
          <Toggle checked={visible} disabled={!hasContent} onChange={(v) => onStyle({ hidden: !v })} />
        </div>
      </div>
      {multiline ? (
        <textarea
          rows={3}
          className={`${inputCls} ${visible ? '' : 'opacity-40'}`}
          value={value}
          onChange={(e) => onValue(e.target.value)}
        />
      ) : (
        <input className={`${inputCls} ${visible ? '' : 'opacity-40'}`} value={value} onChange={(e) => onValue(e.target.value)} />
      )}
      {open && (
        <div className="flex flex-col gap-2.5 rounded-[10px] border border-black/5 bg-black/[0.02] p-2.5">
          <AlignSegmented value={style.align ?? frameAlign} onChange={(a) => onStyle({ align: a })} />
          <div className="flex items-center gap-2">
            <span className="w-12 text-[11px] text-[#9d9d9d]">Tam.</span>
            <RangeField value={style.fontSize ?? baseSize} min={12} max={140} step={1} onChange={(s) => onStyle({ fontSize: s })} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-[11px] text-[#9d9d9d]">Letras</span>
            <RangeField value={style.letterSpacing ?? 0} min={-4} max={30} step={0.5} onChange={(v) => onStyle({ letterSpacing: v })} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-[11px] text-[#9d9d9d]">Linhas</span>
            <RangeField value={style.lineHeight ?? baseLineHeight} min={0.8} max={2.4} step={0.05} onChange={(v) => onStyle({ lineHeight: v })} format={(v) => v.toFixed(2)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-[11px] text-[#9d9d9d]">Margem ↑</span>
            <RangeField value={style.marginTop ?? 0} min={0} max={120} step={2} onChange={(v) => onStyle({ marginTop: v })} format={(v) => `${v}px`} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-[11px] text-[#9d9d9d]">Margem ↓</span>
            <RangeField value={style.marginBottom ?? 0} min={0} max={120} step={2} onChange={(v) => onStyle({ marginBottom: v })} format={(v) => `${v}px`} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-[11px] text-[#9d9d9d]">Padding ↔</span>
            <RangeField value={style.paddingX ?? 0} min={0} max={240} step={4} onChange={(v) => onStyle({ paddingX: v })} format={(v) => `${v}px`} />
          </div>
          <Segmented value={style.fontFamily ?? 'Sora'} onChange={(f) => onStyle({ fontFamily: f })} options={FONT_OPTIONS} />
        </div>
      )}
    </div>
  )
}

function TextoTab({
  content,
  activeSlideIndex,
  onChange,
}: {
  content: Content
  activeSlideIndex: number
  onChange: (c: Content) => void
}) {
  const idx = content.content_type === 'carrossel' ? activeSlideIndex : 0
  const design = frameDesign(content, idx)
  const typo = getTemplate(content.template_id).typography
  const frameAlign = design.align.horizontal

  const styleOf = (field: string): TextStyle => design.texts?.[field] ?? {}
  const patchStyle = (field: string, patch: Partial<TextStyle>) => {
    const texts = { ...(design.texts ?? {}) }
    texts[field] = { ...(texts[field] ?? {}), ...patch }
    onChange(withFrameDesign(content, idx, { ...design, texts }))
  }

  const hint = <p className="text-[11px] text-[#b0b0b0]">Dica: use &lt;br&gt; para forçar uma quebra de linha.</p>

  if (content.content_type === 'carrossel') {
    const carr = content as Carrossel
    const slide = carr.slides[activeSlideIndex]
    if (!slide) return <p className="text-sm text-[#8e8e8e]">Selecione um slide.</p>
    const up = (patch: Partial<typeof slide>) =>
      onChange({ ...carr, slides: carr.slides.map((s, i) => (i === activeSlideIndex ? { ...s, ...patch } : s)) })
    return (
      <div className="flex flex-col gap-4">
        <TextFieldEditor label="Headline" multiline value={slide.headline} baseSize={typo.headline.size} baseLineHeight={typo.headline.line_height ?? 1.1} frameAlign={frameAlign} style={styleOf('headline')} onValue={(v) => up({ headline: v })} onStyle={(p) => patchStyle('headline', p)} />
        <TextFieldEditor label="Subheadline" value={slide.subheadline} baseSize={typo.subheadline.size} baseLineHeight={1.3} frameAlign={frameAlign} style={styleOf('subheadline')} onValue={(v) => up({ subheadline: v })} onStyle={(p) => patchStyle('subheadline', p)} />
        {slide.type === 'content' && (
          <TextFieldEditor label="Corpo" multiline value={slide.body} baseSize={typo.body.size} baseLineHeight={typo.body.line_height ?? 1.55} frameAlign={frameAlign} style={styleOf('body')} onValue={(v) => up({ body: v })} onStyle={(p) => patchStyle('body', p)} />
        )}
        {slide.cta && (
          <TextFieldEditor
            label="CTA"
            value={slide.cta.text}
            baseSize={typo.cta?.size ?? 20}
            baseLineHeight={1.3}
            frameAlign={frameAlign}
            style={styleOf('cta')}
            onValue={(v) => up({ cta: { ...slide.cta!, text: v } })}
            onStyle={(p) => patchStyle('cta', p)}
          />
        )}
        {hint}
      </div>
    )
  }

  if (content.content_type === 'anuncio') {
    const up = (patch: Partial<typeof content>) => onChange({ ...content, ...patch })
    return (
      <div className="flex flex-col gap-4">
        {content.headlines.map((h, i) => (
          <Field key={i} label={`Headline ${i + 1}`}>
            <input
              className={inputCls}
              value={h}
              maxLength={70}
              onChange={(e) => {
                const headlines = [...content.headlines]
                headlines[i] = e.target.value
                up({ headlines })
              }}
            />
          </Field>
        ))}
        <TextFieldEditor label="Corpo" multiline value={content.body} baseSize={typo.body.size} baseLineHeight={typo.body.line_height ?? 1.55} frameAlign={frameAlign} style={styleOf('body')} onValue={(v) => up({ body: v })} onStyle={(p) => patchStyle('body', p)} />
        {hint}
      </div>
    )
  }

  if (content.content_type === 'video') return null // vídeo tem editor próprio
  const up = (patch: Partial<typeof content>) => onChange({ ...content, ...patch } as Content)
  return (
    <div className="flex flex-col gap-4">
      <TextFieldEditor label="Headline" multiline value={content.headline} baseSize={typo.headline.size} baseLineHeight={typo.headline.line_height ?? 1.1} frameAlign={frameAlign} style={styleOf('headline')} onValue={(v) => up({ headline: v })} onStyle={(p) => patchStyle('headline', p)} />
      <TextFieldEditor label="Subheadline" value={content.subheadline} baseSize={typo.subheadline.size} baseLineHeight={1.3} frameAlign={frameAlign} style={styleOf('subheadline')} onValue={(v) => up({ subheadline: v })} onStyle={(p) => patchStyle('subheadline', p)} />
      <TextFieldEditor label="Corpo" multiline value={content.body} baseSize={typo.body.size} baseLineHeight={typo.body.line_height ?? 1.55} frameAlign={frameAlign} style={styleOf('body')} onValue={(v) => up({ body: v })} onStyle={(p) => patchStyle('body', p)} />
      {hint}
    </div>
  )
}

function EmptyHint({ note }: { note: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <p className="text-sm text-[#8e8e8e]">{note}</p>
    </div>
  )
}

// ─── EditorLayout ───────────────────────────────────────────────────────────

export function EditorLayout({
  content,
  caption,
  slug,
  tab,
  onTabChange,
  flowState,
  setFlowState,
  selectedField,
  onSelectField,
  onContentChange,
  onCaptionChange,
  onSave,
  exportRef,
}: Props) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const frameExporterRef = useRef<FrameExporterHandle | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now')

  function handleFormatChange(ratio: AspectRatio) {
    if (content) onContentChange({ ...content, format: makeFormat(ratio) })
  }

  function download(dataUrl: string, name: string) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = name
    a.click()
  }

  // Monta o FrameExporter sob demanda, captura todos os frames e desmonta.
  async function captureFrames(): Promise<ExportedFrame[]> {
    setCapturing(true)
    await new Promise((r) => setTimeout(r, 60)) // deixa montar
    const frames = (await frameExporterRef.current?.captureAll()) ?? []
    setCapturing(false)
    return frames
  }

  async function handleExport(kind: ExportKind) {
    if (!content) return
    const base = slug ?? 'criativo'
    if (kind === 'png-current') {
      const url = await exportRef.current?.exportPNG()
      if (url) download(url, `${base}.png`)
      return
    }
    const frames = await captureFrames()
    if (!frames.length) return
    if (kind === 'png-all') {
      frames.forEach((f) => download(f.dataUrl, `${base}-${f.filename}`))
      return
    }
    const { width, height } = content.format
    const orientation = width > height ? 'landscape' : 'portrait'
    const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height] })
    frames.forEach((f, i) => {
      if (i > 0) pdf.addPage([width, height], orientation)
      pdf.addImage(f.dataUrl, 'PNG', 0, 0, width, height)
    })
    pdf.save(`${base}.pdf`)
  }

  async function handlePublish(scheduledAt: string | null, profile: string | null, entityId: string | null): Promise<PublishResult> {
    if (!content || !slug) return null
    const frames = await captureFrames()
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, scheduled_at: scheduledAt, profile, entity_id: entityId, images: frames }),
    })
    if (!res.ok) throw new Error('falha')
    return (await res.json()) as PublishResult
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave()
      setSaveMsg('Salvo!')
    } catch {
      setSaveMsg('Erro ao salvar')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 2000)
    }
  }

  function handleAddSlide() {
    if (!content || content.content_type !== 'carrossel') return
    const carr = content as Carrossel
    if (carr.slides.length >= 10) return
    const insertAt = carr.slides.length - 1
    const newSlide = {
      index: insertAt + 1,
      type: 'content' as const,
      layout: 'text-centered' as const,
      headline: '',
      subheadline: '',
      body: '',
      image: null,
      cta: null,
    }
    const slides = [...carr.slides.slice(0, insertAt), newSlide, carr.slides[carr.slides.length - 1]].map(
      (s, i) => ({ ...s, index: i + 1 })
    )
    onContentChange({ ...carr, slides })
    setActiveSlideIndex(insertAt)
  }

  function handleRemoveSlide(index: number) {
    if (!content || content.content_type !== 'carrossel') return
    const carr = content as Carrossel
    if (carr.slides.length <= 2) return // carrossel exige no mínimo 2 slides
    const slides = carr.slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i + 1 }))
    onContentChange({ ...carr, slides })
    setActiveSlideIndex((cur) => Math.min(cur, slides.length - 1))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {content ? (
        <EditorTopBar
          content={content}
          onFormatChange={handleFormatChange}
          onExport={handleExport}
          onSchedule={() => {
            setPublishMode('schedule')
            setPublishOpen(true)
          }}
          onPublish={() => {
            setPublishMode('now')
            setPublishOpen(true)
          }}
        />
      ) : (
        <header className="h-14 flex-none flex items-center border-b border-black/5 bg-white px-4">
          <span className="text-sm text-[#8e8e8e]">Novo conteúdo</span>
        </header>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Painel esquerdo */}
        <div className="w-[360px] flex-none border-r border-black/5 bg-white flex flex-col">
          <div className="flex-none flex px-2 pt-2 gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`flex-1 h-9 rounded-lg text-sm transition-colors ${
                  tab === t.id ? 'bg-black/[0.06] text-[#0d0d0d] font-medium' : 'text-[#5d5d5d] hover:bg-black/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
            {/* Chat fica sempre montado pra não perder a conversa ao trocar de aba — só escondemos visualmente */}
            <div className={tab === 'chat' ? 'flex h-full flex-col' : 'hidden'}>
              <ChatTab
                flowState={flowState}
                setFlowState={setFlowState}
                content={content}
                setEditingContent={onContentChange}
                onCaptionExtracted={onCaptionChange}
              />
            </div>
            {tab === 'texto' &&
              (content ? (
                <TextoTab content={content} activeSlideIndex={activeSlideIndex} onChange={onContentChange} />
              ) : (
                <EmptyHint note="Gere um conteúdo no chat para editar o texto." />
              ))}
            {tab === 'legenda' &&
              (content ? (
                <textarea
                  className={`${inputCls} min-h-[240px]`}
                  value={caption}
                  onChange={(e) => onCaptionChange(e.target.value)}
                  placeholder="Legenda do post…"
                />
              ) : (
                <EmptyHint note="A legenda aparece após gerar o conteúdo." />
              ))}
            {tab === 'marca' &&
              (content ? (
                <MarcaTab content={content} onChange={onContentChange} />
              ) : (
                <EmptyHint note="A marca aparece após gerar o conteúdo." />
              ))}
          </div>

          {content && tab !== 'chat' && (
            <div className="flex-none flex items-center gap-3 border-t border-black/5 p-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 rounded-lg bg-[#0d0d0d] px-4 text-sm text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              {saveMsg && (
                <span className={`text-xs ${saveMsg.startsWith('Erro') ? 'text-red-500' : 'text-green-600'}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Canvas central */}
        <div className="flex-1 min-w-0 bg-[#f9f9f9]">
          {content ? (
            <EditorCanvas
              ref={exportRef}
              content={content}
              slug={slug}
              activeIndex={activeSlideIndex}
              onActiveIndexChange={setActiveSlideIndex}
              selectedField={selectedField}
              onFieldClick={onSelectField}
              onAddSlide={handleAddSlide}
              onRemoveSlide={handleRemoveSlide}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <p className="text-sm text-[#8e8e8e]">
                {flowState.step === 'GENERATING' ? 'Gerando conteúdo…' : 'O preview aparece aqui.'}
              </p>
            </div>
          )}
        </div>

        {/* Painel direito — Layout */}
        <div className="w-[280px] flex-none border-l border-black/5 bg-white flex flex-col">
          <div className="h-12 flex-none flex items-center px-4 border-b border-black/5">
            <span className="text-sm font-medium text-[#0d0d0d]">Layout</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {content ? (
              <LayoutPanel
                content={content}
                activeSlideIndex={activeSlideIndex}
                slug={slug}
                onChange={onContentChange}
              />
            ) : (
              <EmptyHint note="O layout aparece após gerar o conteúdo." />
            )}
          </div>
        </div>
      </div>

      {/* Renderizador offscreen para captura multi-frame (export/publish) */}
      {capturing && content && <FrameExporter ref={frameExporterRef} content={content} slug={slug} />}

      {/* Publicação */}
      {publishOpen && content && (
        <PublishDrawer
          content={content}
          slug={slug}
          mode={publishMode}
          onClose={() => setPublishOpen(false)}
          onSubmit={handlePublish}
        />
      )}
    </div>
  )
}
