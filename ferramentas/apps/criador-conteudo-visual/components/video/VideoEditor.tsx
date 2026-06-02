'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { UploadCloud, Loader2, Film, Send, CalendarClock, Scissors, RotateCcw, Clapperboard, Wand2, Eye } from 'lucide-react'
import { ReelComposition } from '@/remotion/ReelComposition'
import { Timeline } from './Timeline'
import { VideoChatTab } from './VideoChatTab'
import { makeFormat } from '@/lib/schemas/format.schema'
import { VideoStyleSchema, VideoEditSchema, type Content, type Video, type VideoStyle, type VideoEdit } from '@/lib/schemas/content.schema'
import { buildEditPlan, toggleCutForWord, coveredFraction, addCut, mergeRanges, autoZoomRegions, type Range, type Zoom } from '@/lib/video/edit-plan'
import type { FunnelPhase } from '@/lib/chat/flow-state'
import { PublishDrawer, type PublishResult } from '@/components/editor/PublishDrawer'
import { UsageBadge } from '@/components/layout/UsageBadge'
import { Group, ToggleRow, PositionPicker, Segmented, ColorField, RangeField, fieldInput } from '@/components/editor/controls'

const FPS = 30

export type VideoSeed = { funnelPhase: FunnelPhase; productId?: string; author?: string; brief: string }
type Props = { slug?: string; threadId?: string; seed?: VideoSeed }
type Tab = 'video' | 'legenda' | 'marca' | 'sting'
const TAB_LABEL: Record<Tab, string> = { video: 'Vídeo', legenda: 'Legenda', marca: 'Marca', sting: 'Intro/Outro' }

function buildDraft(seed: VideoSeed): Video {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    created_by: 'browser',
    company_id: 'infosaas',
    platform: 'instagram',
    format: makeFormat('9:16'),
    funnel_phase: seed.funnelPhase,
    template_id: 'editorial',
    product_id: seed.productId,
    author: seed.author,
    topic: seed.brief.trim().slice(0, 80) || 'Vídeo/Reel',
    caption_file: 'caption.md',
    content_type: 'video',
    video: { ref: '', style: VideoStyleSchema.parse({}), edit: VideoEditSchema.parse({}) },
  }
}

export function VideoEditor({ slug: initialSlug, threadId, seed }: Props) {
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null)
  const [content, setContent] = useState<Video | null>(null)
  const [caption, setCaption] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'uploading'>('loading')
  const [drawer, setDrawer] = useState<'now' | 'schedule' | null>(null)
  const [tab, setTab] = useState<Tab>('video')
  const [leftTab, setLeftTab] = useState<'transcricao' | 'chat' | 'legenda'>('transcricao')
  const [autoEditing, setAutoEditing] = useState(false)
  const [footageSeconds, setFootageSeconds] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [autoSil, setAutoSil] = useState(false)
  const [silenceDb, setSilenceDb] = useState(-35)
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState<number | null>(null)
  const [renderNote, setRenderNote] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [editingWord, setEditingWord] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const playerRef = useRef<PlayerRef | null>(null)
  const initRef = useRef(false)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastClickRef = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  // Init: carrega por slug ou cria rascunho a partir da semente.
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    if (initialSlug) {
      fetch(`/api/content/${initialSlug}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { content: Content; caption: string }) => {
          if (d.content.content_type === 'video') {
            setContent(d.content)
            setCaption(d.caption ?? '')
          }
        })
        .catch(() => {})
        .finally(() => setStatus('ready'))
      return
    }

    if (seed) {
      const draft = buildDraft(seed)
      fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft, caption: '' }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { slug: string }) => {
          setSlug(d.slug)
          setContent(draft)
          if (threadId) {
            fetch(`/api/threads/${threadId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug: d.slug }),
            }).catch(() => {})
          }
          window.history.replaceState(null, '', `/editor?slug=${d.slug}`)
        })
        .catch(() => {})
        .finally(() => setStatus('ready'))
      return
    }
    setStatus('ready')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave debounced do content + caption.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!slug || !content) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`/api/content/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, caption }),
      }).catch(() => {})
    }, 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [content, caption, slug])

  function patchStyle(patch: Partial<VideoStyle>) {
    setContent((c) => (c ? { ...c, video: { ...c.video, style: { ...c.video.style, ...patch } } } : c))
  }
  function setCap<K extends keyof VideoStyle['caption']>(key: K, val: VideoStyle['caption'][K]) {
    setContent((c) => (c ? { ...c, video: { ...c.video, style: { ...c.video.style, caption: { ...c.video.style.caption, [key]: val } } } } : c))
  }
  function setLogo<K extends keyof VideoStyle['logo']>(key: K, val: VideoStyle['logo'][K]) {
    setContent((c) => (c ? { ...c, video: { ...c.video, style: { ...c.video.style, logo: { ...c.video.style.logo, [key]: val } } } } : c))
  }
  function setSting(which: 'intro' | 'outro', patch: Partial<VideoStyle['intro']>) {
    setContent((c) => (c ? { ...c, video: { ...c.video, style: { ...c.video.style, [which]: { ...c.video.style[which], ...patch } } } } : c))
  }
  function setFoot<K extends keyof VideoStyle['footage']>(key: K, val: VideoStyle['footage'][K]) {
    setContent((c) => (c ? { ...c, video: { ...c.video, style: { ...c.video.style, footage: { ...c.video.style.footage, [key]: val } } } } : c))
  }
  function setEdit<K extends keyof VideoEdit>(key: K, val: VideoEdit[K]) {
    setContent((c) => (c ? { ...c, video: { ...c.video, edit: { ...c.video.edit, [key]: val } } } : c))
  }
  function setCuts(cuts: Range[]) {
    setEdit('cuts', cuts)
  }
  function setZooms(zooms: Zoom[]) {
    setEdit('zooms', zooms)
  }
  function setWordText(i: number, text: string) {
    setContent((c) => {
      if (!c || !c.video.transcript) return c
      const words = c.video.transcript.words.map((w, idx) => (idx === i ? { ...w, text } : w))
      return { ...c, video: { ...c.video, transcript: { ...c.video.transcript, words } } }
    })
  }
  // chip: clique = corta/restaura a palavra (shift = intervalo) — vira range em `cuts`.
  function cutWord(i: number, shift: boolean) {
    setContent((c) => {
      if (!c || !c.video.transcript) return c
      const words = c.video.transcript.words
      const w = words[i]
      if (!w) return c
      let cuts = c.video.edit.cuts
      if (shift && lastClickRef.current !== null) {
        const a = Math.min(lastClickRef.current, i)
        const b = Math.max(lastClickRef.current, i)
        cuts = addCut(cuts, { start: words[a].start, end: words[b].end })
      } else {
        cuts = toggleCutForWord(cuts, w)
      }
      return { ...c, video: { ...c.video, edit: { ...c.video.edit, cuts } } }
    })
    lastClickRef.current = i
  }
  function onWordClick(i: number, shift: boolean) {
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => cutWord(i, shift), 170)
  }
  function onWordDouble(i: number) {
    if (clickTimer.current) clearTimeout(clickTimer.current)
    setEditingWord(i)
  }
  function restoreAll() {
    setCuts([])
  }
  async function handleAutoSilence() {
    if (!slug) return
    setAutoSil(true)
    try {
      const res = await fetch('/api/video/silences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, noiseDb: silenceDb }),
      })
      if (res.ok) {
        const d = (await res.json()) as { ranges: Range[] }
        setContent((c) =>
          c ? { ...c, video: { ...c.video, edit: { ...c.video.edit, enabled: true, cuts: mergeRanges([...c.video.edit.cuts, ...d.ranges]) } } } : c
        )
      }
    } finally {
      setAutoSil(false)
    }
  }
  // Auto-editar determinístico: corta silêncios (server) + zoom dinâmico (cliente).
  async function handleAutoEdit() {
    if (!slug) return
    setAutoEditing(true)
    try {
      let ranges: Range[] = []
      try {
        const res = await fetch('/api/video/silences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, noiseDb: silenceDb }),
        })
        if (res.ok) ranges = ((await res.json()) as { ranges: Range[] }).ranges ?? []
      } catch {}
      setContent((c) => {
        if (!c) return c
        const words = c.video.transcript?.words ?? []
        return {
          ...c,
          video: {
            ...c.video,
            edit: { ...c.video.edit, enabled: true, cuts: mergeRanges([...c.video.edit.cuts, ...ranges]), zooms: autoZoomRegions(words) },
          },
        }
      })
    } finally {
      setAutoEditing(false)
    }
  }
  // Aplica o estado que o agente de chat devolveu.
  function applyChat(next: { edit: VideoEdit; style: VideoStyle }) {
    setContent((c) => (c ? { ...c, video: { ...c.video, edit: next.edit, style: next.style } } : c))
  }

  async function handleUpload(file: File) {
    if (!slug || !content) return
    setStatus('uploading')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('slug', slug)
      fd.append('contentType', 'video')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const d = (await res.json()) as { path: string }
        const next: Video = { ...content, video: { ...content.video, ref: d.path, rendered_ref: undefined, transcript: undefined } }
        setContent(next)
        // salva o ref já (a transcrição lê do disco, não pode esperar o autosave)
        await fetch(`/api/content/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: next, caption }),
        }).catch(() => {})
        handleTranscribe() // transcrição automática ao subir
        fetch('/api/video/waveform', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) }).catch(() => {}) // gera a waveform da trilha
      }
    } finally {
      setStatus('ready')
    }
  }

  async function handleTranscribe() {
    if (!slug) return
    setTranscribing(true)
    try {
      const res = await fetch('/api/video/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      if (res.ok) {
        const d = (await res.json()) as { transcript: Video['video']['transcript'] }
        setContent((c) => (c ? { ...c, video: { ...c.video, transcript: d.transcript } } : c))
      }
    } finally {
      setTranscribing(false)
    }
  }

  async function handleRender() {
    if (!slug) return
    setRendering(true)
    setRenderNote(null)
    setRenderProgress(0)
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/video/render?slug=${encodeURIComponent(slug)}`)
        if (r.ok) {
          const d = (await r.json()) as { progress: number | null }
          if (typeof d.progress === 'number') setRenderProgress(d.progress)
        }
      } catch {}
    }, 1000)
    try {
      const res = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const d = await res.json()
      if (res.ok) {
        setContent((c) => (c ? { ...c, video: { ...c.video, rendered_ref: d.rendered_ref } } : c))
        setRenderNote('Renderizado ✓')
      } else {
        setRenderNote(d.error ?? 'Falha no render')
      }
    } catch {
      setRenderNote('Falha no render')
    } finally {
      clearInterval(poll)
      setRendering(false)
      setRenderProgress(null)
    }
  }

  const publish = async (scheduledAt: string | null, profile: string | null, entityId: string | null): Promise<PublishResult> => {
    if (!slug) return null
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, scheduled_at: scheduledAt, profile, entity_id: entityId }),
    })
    if (!res.ok) throw new Error('falha')
    return (await res.json()) as PublishResult
  }

  const videoRef = content?.video.ref
  const videoUrl = videoRef && slug ? `/api/assets/${slug}/${videoRef}` : null
  const style = content?.video.style
  const edit = content?.video.edit
  const transcript = content?.video.transcript ?? null

  // Plano de edição (mesma função do render) — reflete cortes no preview ao vivo.
  const plan = useMemo(() => {
    if (footageSeconds <= 0 || !edit) return null
    return buildEditPlan(transcript?.words ?? [], footageSeconds, edit.enabled ? edit.cuts : [])
  }, [transcript, footageSeconds, edit])

  const durationInFrames = useMemo(() => {
    if (!style || !plan) return 1
    const introF = style.intro.enabled ? Math.round((style.intro.durationMs / 1000) * FPS) : 0
    const outroF = style.outro.enabled ? Math.round((style.outro.durationMs / 1000) * FPS) : 0
    return introF + Math.max(1, Math.round(plan.outDuration * FPS)) + outroF
  }, [style, plan])

  const canPublish = !!slug && !!videoUrl

  return (
    <div className="flex h-screen min-h-0">
      {/* Painel esquerdo: Transcrição (cortes) | Legenda do post */}
      {videoUrl && (
        <aside className="w-[320px] flex-none border-r border-black/8 bg-white flex flex-col">
          <div className="flex-none flex items-center gap-1 p-2 border-b border-black/5">
            {(['transcricao', 'chat', 'legenda'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`flex-1 h-9 rounded-lg text-sm capitalize transition-colors ${
                  leftTab === t ? 'bg-black/[0.06] text-[#0d0d0d] font-medium' : 'text-[#5d5d5d] hover:bg-black/[0.03]'
                }`}
              >
                {t === 'transcricao' ? 'Transcrição' : t === 'chat' ? 'Chat' : 'Legenda'}
              </button>
            ))}
          </div>

          <div className={`flex-1 min-h-0 p-4 flex flex-col gap-4 ${leftTab === 'chat' ? '' : 'overflow-y-auto'}`}>
            {leftTab === 'chat' && (
              <>
                <button
                  onClick={handleAutoEdit}
                  disabled={autoEditing || !transcript}
                  className="inline-flex items-center justify-center gap-2 h-10 flex-none rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
                  title="Corta silêncios e adiciona zoom dinâmico de uma vez"
                >
                  {autoEditing ? <Loader2 size={16} className="animate-spin" /> : <Scissors size={16} />}
                  {autoEditing ? 'Auto-editando…' : '✨ Auto-editar (silêncio + zoom)'}
                </button>
                <div className="flex-1 min-h-0">
                  <VideoChatTab slug={slug} edit={edit!} style={style!} hasTranscript={!!transcript} onApply={applyChat} />
                </div>
              </>
            )}

            {leftTab === 'transcricao' &&
              (transcribing ? (
                <div className="grid place-items-center gap-2 py-10 text-[#9d9d9d]">
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-sm">Transcrevendo o áudio…</span>
                </div>
              ) : !transcript ? (
                <div className="flex flex-col gap-3 py-6">
                  <p className="text-xs text-[#9d9d9d] leading-relaxed">
                    A transcrição roda sozinha ao subir o vídeo. Se precisar, force aqui.
                  </p>
                  <button
                    onClick={handleTranscribe}
                    className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#0d0d0d] text-white text-sm hover:opacity-90"
                  >
                    <Wand2 size={16} /> Transcrever áudio
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAutoSilence}
                      disabled={autoSil}
                      title="Detecta silêncio pelo áudio real e corta"
                      className="inline-flex items-center gap-1.5 h-9 flex-1 justify-center rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-50"
                    >
                      {autoSil ? <Loader2 size={14} className="animate-spin" /> : <Scissors size={14} />}
                      {autoSil ? 'Detectando…' : 'Auto-cortar silêncios'}
                    </button>
                    <button
                      onClick={restoreAll}
                      title="Remove todos os cortes"
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-black/10 text-xs text-[#5d5d5d] hover:bg-black/5"
                    >
                      <RotateCcw size={14} /> Restaurar
                    </button>
                  </div>

                  <ToggleRow label="Cortes ativos" checked={edit?.enabled ?? true} onChange={(v) => setEdit('enabled', v)} />
                  <Group label={`Sensibilidade do auto-silêncio (${silenceDb} dB)`}>
                    <RangeField value={silenceDb} min={-45} max={-25} step={1} onChange={setSilenceDb} format={(v) => `${v}`} />
                    <span className="text-[10px] text-[#bdbdbd]">← menos corte · mais corte →</span>
                  </Group>

                  <p className="text-[11px] text-[#9d9d9d] leading-relaxed">
                    Clique numa palavra para cortar (shift = intervalo). Duplo-clique edita o texto. Ajuste fino na trilha abaixo do preview.
                  </p>

                  <div className="text-[15px] leading-relaxed">
                    {transcript.words.map((w, i) =>
                      editingWord === i ? (
                        <input
                          key={i}
                          autoFocus
                          defaultValue={w.text}
                          onBlur={(e) => {
                            setWordText(i, e.target.value)
                            setEditingWord(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setWordText(i, (e.target as HTMLInputElement).value)
                              setEditingWord(null)
                            }
                          }}
                          className="inline-block w-24 mr-1 mb-1 rounded border border-black/20 px-1 text-[15px] outline-none"
                        />
                      ) : (
                        <span
                          key={i}
                          onClick={(e) => onWordClick(i, e.shiftKey)}
                          onDoubleClick={() => onWordDouble(i)}
                          className={`cursor-pointer rounded px-0.5 mr-px ${
                            coveredFraction(edit?.cuts ?? [], w.start, w.end) > 0.6 ? 'line-through text-red-400 bg-red-50' : 'text-[#0d0d0d] hover:bg-black/5'
                          }`}
                        >
                          {w.text}{' '}
                        </span>
                      )
                    )}
                  </div>

                  {plan && (
                    <p className="text-[11px] text-[#9d9d9d]">
                      Saída: {plan.outDuration.toFixed(1)}s · {plan.segments.length} trecho(s)
                    </p>
                  )}
                </>
              ))}

            {leftTab === 'legenda' && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[#5d5d5d]">Legenda do Reel</span>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={10}
                  placeholder="Legenda que vai no post do Instagram…"
                  className={fieldInput + ' resize-y'}
                />
              </div>
            )}
          </div>

          {renderNote && <div className="flex-none border-t border-black/5 p-3 text-xs text-[#5d5d5d]">{renderNote}</div>}
        </aside>
      )}

      {/* Coluna principal: top bar + preview */}
      <div className="flex flex-1 min-w-0 flex-col">
        <header className="h-14 flex-none flex items-center gap-3 border-b border-black/5 bg-white px-4">
          <span className="inline-flex items-center gap-1.5 h-7 rounded-full bg-black/[0.04] px-3 text-xs text-[#5d5d5d]">
            <Film size={13} /> Vídeo/Reel
          </span>
          <span className="inline-flex items-center h-7 rounded-full bg-black/[0.04] px-3 text-xs text-[#5d5d5d]">9:16</span>
          {content?.video.rendered_ref && (
            <span className="inline-flex items-center h-7 rounded-full bg-green-50 px-3 text-xs text-green-700">renderizado</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <UsageBadge />
            <button
              onClick={handleRender}
              disabled={!canPublish || rendering}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-black/10 px-3.5 text-sm text-[#0d0d0d] hover:bg-black/5 disabled:opacity-30 transition-colors"
            >
              {rendering ? <Loader2 size={16} className="animate-spin" /> : <Clapperboard size={16} />}
              {rendering ? `Renderizando ${Math.round((renderProgress ?? 0) * 100)}%` : 'Renderizar'}
            </button>
            {content?.video.rendered_ref && !rendering && (
              <button
                onClick={() => window.open(`/api/assets/${slug}/${content.video.rendered_ref}`, '_blank')}
                className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-black/10 px-3.5 text-sm text-[#0d0d0d] hover:bg-black/5 transition-colors"
                title="Abre o MP4 renderizado numa nova aba"
              >
                <Eye size={16} /> Ver render
              </button>
            )}
            <button
              onClick={() => setDrawer('schedule')}
              disabled={!canPublish}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-[#0d0d0d] px-3.5 text-sm text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              <CalendarClock size={16} /> Agendar
            </button>
            <button
              onClick={() => setDrawer('now')}
              disabled={!canPublish}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-30 transition-colors"
            >
              <Send size={16} /> Publicar
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 grid place-items-center bg-[#fafafa] p-6">
          {!videoUrl ? (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={status !== 'ready'}
              className="grid place-items-center gap-3 rounded-2xl border-2 border-dashed border-black/15 bg-white px-20 py-16 text-[#5d5d5d] hover:border-black/30 disabled:opacity-50 transition-colors"
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 size={28} className="animate-spin" />
                  <span className="text-sm">Enviando…</span>
                </>
              ) : (
                <>
                  <UploadCloud size={28} />
                  <span className="text-sm">Enviar o MP4 vertical (9:16)</span>
                </>
              )}
            </button>
          ) : (
            <div className="h-full max-h-full" style={{ aspectRatio: '9 / 16' }}>
              {mounted && style && edit && footageSeconds > 0 ? (
                <Player
                  ref={playerRef}
                  component={ReelComposition}
                  inputProps={{ videoSrc: videoUrl, sourceDuration: footageSeconds, transcript, edit, style }}
                  durationInFrames={durationInFrames}
                  fps={FPS}
                  compositionWidth={1080}
                  compositionHeight={1920}
                  style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }}
                  controls
                  loop
                />
              ) : (
                <div className="grid h-full place-items-center text-[#9d9d9d]">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              )}
              {/* lê a duração do footage (p/ dimensionar o preview e persistir em video.duration) */}
              <video
                src={videoUrl}
                muted
                preload="metadata"
                style={{ display: 'none' }}
                onLoadedMetadata={(e) => {
                  const dur = e.currentTarget.duration || 0
                  setFootageSeconds(dur)
                  setContent((c) => (c && !c.video.duration ? { ...c, video: { ...c.video, duration: dur } } : c))
                }}
              />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/quicktime"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
              e.target.value = ''
            }}
          />
        </div>

        {videoUrl && plan && edit && footageSeconds > 0 && (
          <Timeline
            slug={slug ?? ''}
            waveVersion={content?.video.ref ?? ''}
            sourceDuration={footageSeconds}
            cuts={edit.cuts}
            zooms={edit.zooms}
            plan={plan}
            fps={FPS}
            playerRef={playerRef}
            onCutsChange={setCuts}
            onZoomsChange={setZooms}
          />
        )}
      </div>

      {/* Painel direito de estilo */}
      {videoUrl && style && (
        <aside className="w-[340px] flex-none border-l border-black/8 bg-white flex flex-col">
          <div className="flex-none flex items-center gap-1 p-2 border-b border-black/5">
            {(['video', 'legenda', 'marca', 'sting'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 h-9 rounded-lg text-xs transition-colors ${
                  tab === t ? 'bg-black/[0.06] text-[#0d0d0d] font-medium' : 'text-[#5d5d5d] hover:bg-black/[0.03]'
                }`}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
            {tab === 'video' && (
              <>
                <p className="text-xs text-[#9d9d9d] leading-relaxed">
                  Footage horizontal? Use &quot;Preencher&quot; para cortar no 9:16 e ajuste zoom/posição para enquadrar.
                </p>
                <Group label="Ajuste no frame 9:16">
                  <Segmented
                    value={style.footage.fit}
                    onChange={(v) => setFoot('fit', v)}
                    options={[
                      { value: 'cover', label: 'Preencher (cortar)' },
                      { value: 'contain', label: 'Caber' },
                    ]}
                  />
                </Group>
                <Group label={`Zoom (${style.footage.zoom.toFixed(2)}x)`}>
                  <RangeField value={style.footage.zoom} min={0.5} max={3} step={0.05} onChange={(v) => setFoot('zoom', v)} format={(v) => `${v.toFixed(2)}x`} />
                </Group>
                <Group label="Posição horizontal">
                  <RangeField value={style.footage.x} min={-1} max={1} step={0.02} onChange={(v) => setFoot('x', v)} format={(v) => `${Math.round(v * 100)}`} />
                </Group>
                <Group label="Posição vertical">
                  <RangeField value={style.footage.y} min={-1} max={1} step={0.02} onChange={(v) => setFoot('y', v)} format={(v) => `${Math.round(v * 100)}`} />
                </Group>
                {style.footage.fit === 'contain' && (
                  <>
                    <ToggleRow label="Fundo desfocado" checked={style.footage.blurBg} onChange={(v) => setFoot('blurBg', v)} />
                    {!style.footage.blurBg && (
                      <Group label="Cor do fundo">
                        <ColorField value={style.footage.bg} onChange={(v) => setFoot('bg', v)} />
                      </Group>
                    )}
                  </>
                )}
                <div className="h-px bg-black/5" />
                <Group label={`Volume do áudio (${style.footage.volumeDb > 0 ? '+' : ''}${style.footage.volumeDb} dB)`}>
                  <RangeField
                    value={style.footage.volumeDb}
                    min={-30}
                    max={12}
                    step={1}
                    onChange={(v) => setFoot('volumeDb', v)}
                    format={(v) => `${v > 0 ? '+' : ''}${v}`}
                  />
                </Group>
              </>
            )}

            {tab === 'legenda' && (
              <>
                {!transcript && (
                  <p className="text-xs text-[#9d9d9d] leading-relaxed">
                    Transcreva o áudio no painel à esquerda para gerar a legenda do vídeo.
                  </p>
                )}
                <ToggleRow label="Mostrar legenda" checked={style.caption.enabled} onChange={(v) => setCap('enabled', v)} />
                <Group label="Posição (âncora)">
                  <Segmented
                    value={style.caption.position}
                    onChange={(v) => setCap('position', v)}
                    options={[
                      { value: 'top', label: 'Topo' },
                      { value: 'middle', label: 'Centro' },
                      { value: 'bottom', label: 'Base' },
                    ]}
                  />
                </Group>
                <Group label="Ajuste horizontal">
                  <RangeField value={style.caption.offsetX} min={-1} max={1} step={0.02} onChange={(v) => setCap('offsetX', v)} format={(v) => `${Math.round(v * 100)}`} />
                </Group>
                <Group label="Ajuste vertical">
                  <RangeField value={style.caption.offsetY} min={-1} max={1} step={0.02} onChange={(v) => setCap('offsetY', v)} format={(v) => `${Math.round(v * 100)}`} />
                </Group>
                <Group label="Animação">
                  <Segmented
                    value={style.caption.animation}
                    onChange={(v) => setCap('animation', v)}
                    options={[
                      { value: 'karaoke', label: 'Karaokê' },
                      { value: 'pop', label: 'Pop' },
                      { value: 'fade', label: 'Fade' },
                      { value: 'none', label: 'Nenhuma' },
                    ]}
                  />
                </Group>
                <Group label="Peso">
                  <Segmented
                    value={style.caption.weight}
                    onChange={(v) => setCap('weight', v)}
                    options={[
                      { value: 'bold', label: 'Bold' },
                      { value: 'extrabold', label: 'ExtraBold' },
                    ]}
                  />
                </Group>
                <Group label={`Tamanho (${style.caption.fontSize}px)`}>
                  <RangeField value={style.caption.fontSize} min={32} max={120} step={2} onChange={(v) => setCap('fontSize', v)} />
                </Group>
                <Group label={`Palavras por linha (${style.caption.maxWordsPerLine})`}>
                  <RangeField value={style.caption.maxWordsPerLine} min={1} max={8} step={1} onChange={(v) => setCap('maxWordsPerLine', v)} />
                </Group>
                <Group label="Cor do texto">
                  <ColorField value={style.caption.textColor} onChange={(v) => setCap('textColor', v)} />
                </Group>
                <Group label="Cor da palavra ativa">
                  <ColorField value={style.caption.activeColor} onChange={(v) => setCap('activeColor', v)} />
                </Group>
                <ToggleRow label="Fundo atrás do texto" checked={style.caption.box} onChange={(v) => setCap('box', v)} />
                <ToggleRow label="MAIÚSCULAS" checked={style.caption.uppercase} onChange={(v) => setCap('uppercase', v)} />
              </>
            )}

            {tab === 'marca' && (
              <>
                <ToggleRow label="Mostrar logo" checked={style.logo.enabled} onChange={(v) => setLogo('enabled', v)} />
                <Group label="Variante">
                  <Segmented
                    value={style.logo.variant}
                    onChange={(v) => setLogo('variant', v)}
                    options={[
                      { value: 'branco', label: 'Branco' },
                      { value: 'preto', label: 'Preto' },
                      { value: 'laranja', label: 'Laranja' },
                    ]}
                  />
                </Group>
                <Group label="Posição">
                  <PositionPicker
                    value={style.logo.position}
                    onChange={(v) => setLogo('position', v)}
                    positions={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                  />
                </Group>
                <Group label={`Tamanho (${style.logo.size}px)`}>
                  <RangeField value={style.logo.size} min={32} max={160} step={4} onChange={(v) => setLogo('size', v)} />
                </Group>
                <Group label={`Opacidade (${Math.round(style.logo.opacity * 100)}%)`}>
                  <RangeField value={style.logo.opacity} min={0.2} max={1} step={0.05} onChange={(v) => setLogo('opacity', v)} format={(v) => `${Math.round(v * 100)}%`} />
                </Group>
              </>
            )}

            {tab === 'sting' && (
              <>
                <ToggleRow label="Intro de marca" checked={style.intro.enabled} onChange={(v) => setSting('intro', { enabled: v })} />
                {style.intro.enabled && (
                  <>
                    <Group label="Texto da intro">
                      <input value={style.intro.text} onChange={(e) => setSting('intro', { text: e.target.value })} className={fieldInput} placeholder="Opcional" />
                    </Group>
                    <Group label={`Duração (${(style.intro.durationMs / 1000).toFixed(1)}s)`}>
                      <RangeField value={style.intro.durationMs} min={800} max={4000} step={100} onChange={(v) => setSting('intro', { durationMs: v })} format={(v) => `${(v / 1000).toFixed(1)}s`} />
                    </Group>
                  </>
                )}
                <div className="h-px bg-black/5" />
                <ToggleRow label="Outro de marca" checked={style.outro.enabled} onChange={(v) => setSting('outro', { enabled: v })} />
                {style.outro.enabled && (
                  <>
                    <Group label="Texto do outro">
                      <input value={style.outro.text} onChange={(e) => setSting('outro', { text: e.target.value })} className={fieldInput} placeholder="Opcional" />
                    </Group>
                    <Group label={`Duração (${(style.outro.durationMs / 1000).toFixed(1)}s)`}>
                      <RangeField value={style.outro.durationMs} min={800} max={4000} step={100} onChange={(v) => setSting('outro', { durationMs: v })} format={(v) => `${(v / 1000).toFixed(1)}s`} />
                    </Group>
                  </>
                )}
              </>
            )}
          </div>
        </aside>
      )}

      {drawer && content && (
        <PublishDrawer content={content} slug={slug ?? undefined} mode={drawer} onClose={() => setDrawer(null)} onSubmit={publish} />
      )}
    </div>
  )
}
