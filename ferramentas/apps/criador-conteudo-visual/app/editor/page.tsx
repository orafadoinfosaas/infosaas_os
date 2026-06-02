'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { VideoEditor, type VideoSeed } from '@/components/video/VideoEditor'
import { useContentWatch } from '@/lib/content/use-content-watch'
import { hydrateContent } from '@/lib/content/hydrate'
import type { EditorCanvasHandle } from '@/components/editor/EditorCanvas'
import type { Content } from '@/lib/schemas/content.schema'
import type { FlowState, ContentType, FunnelPhase, TemplateId } from '@/lib/chat/flow-state'

const FORMAT_TO_TYPE: Record<string, ContentType> = {
  estatico: 'post',
  carrossel: 'carrossel',
  stories: 'post',
  anuncio: 'anuncio',
}

function templateForPhase(phase: FunnelPhase): TemplateId {
  return phase === 'prontidao' ? 'bold' : 'editorial'
}

type Tab = 'chat' | 'marca' | 'texto' | 'legenda'

function EditorInner() {
  const [videoCtx, setVideoCtx] = useState<{ slug?: string; threadId?: string; seed?: VideoSeed } | null>(null)
  const [flowState, setFlowState] = useState<FlowState>({ step: 'INIT' })
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [originalContent, setOriginalContent] = useState<Content | null>(null)
  const [caption, setCaption] = useState('')
  const [originalCaption, setOriginalCaption] = useState('')
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('chat')
  const exportRef = useRef<EditorCanvasHandle | null>(null)
  const lastLocalWriteRef = useRef<{ slug: string; at: number } | null>(null)
  const threadIdRef = useRef<string | null>(null)
  const persistingRef = useRef(false)

  function applyLoaded(data: { content: Content; caption: string; slug: string }) {
    const hydrated = hydrateContent(data.content)
    setEditingContent(hydrated)
    setOriginalContent(hydrated)
    setCaption(data.caption)
    setOriginalCaption(data.caption)
    setFlowState({ step: 'PREVIEW', slug: data.slug, productId: data.content.product_id, author: data.content.author })
    setTab('texto')
  }

  function loadSlug(slug: string): Promise<void> {
    return fetch(`/api/content/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((data: { content: Content; caption: string; slug: string }) => {
        if (data.content.content_type === 'video') {
          setVideoCtx({ slug: data.slug })
          return
        }
        applyLoaded(data)
      })
  }

  function seedBrief(t: { meta?: { format?: string; communication?: string; product?: string; author?: string }; messages?: { content: string }[] }) {
    // Vídeo/Reel não passa pela geração via chat — abre o módulo de vídeo.
    if (t.meta?.format === 'video') {
      setVideoCtx({
        threadId: threadIdRef.current ?? undefined,
        seed: {
          funnelPhase: (t.meta?.communication ?? 'descoberta') as FunnelPhase,
          productId: t.meta?.product,
          author: t.meta?.author,
          brief: t.messages?.[0]?.content ?? '',
        },
      })
      return
    }
    const phase = (t.meta?.communication ?? 'descoberta') as FunnelPhase
    const contentType = FORMAT_TO_TYPE[t.meta?.format ?? 'carrossel'] ?? 'carrossel'
    const brief = t.messages?.[0]?.content ?? ''
    setFlowState({
      step: 'BRIEF_RECEIVED',
      contentType,
      funnelPhase: phase,
      templateId: templateForPhase(phase),
      productId: t.meta?.product,
      author: t.meta?.author,
      brief,
    })
  }

  // Carrega por ?slug= (biblioteca) ou por ?thread= (composer).
  // Thread já vinculada a um conteúdo salvo → carrega; senão, semeia a geração.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('slug')
    const threadId = params.get('thread')

    if (slug) {
      loadSlug(slug).catch(() => {})
      return
    }

    if (threadId) {
      threadIdRef.current = threadId
      fetch(`/api/threads/${threadId}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no thread'))))
        .then((t: { slug?: string; meta?: { format?: string; communication?: string; product?: string; author?: string }; messages?: { content: string }[] }) => {
          if (t.slug) {
            // Já existe conteúdo salvo — carrega em vez de gerar de novo.
            return loadSlug(t.slug).catch(() => seedBrief(t))
          }
          seedBrief(t)
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Modo IDE: watcher detecta content.json novo/alterado em disco
  useContentWatch(({ slug }) => {
    const lw = lastLocalWriteRef.current
    if (lw && lw.slug === slug && Date.now() - lw.at < 4000) return
    const isDirty =
      editingContent !== null && JSON.stringify(editingContent) !== JSON.stringify(originalContent)
    if (isDirty) return

    fetch(`/api/content/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((data: { content: Content; caption: string; slug: string }) => {
        const hydrated = hydrateContent(data.content)
        setEditingContent(hydrated)
        setOriginalContent(hydrated)
        setCaption(data.caption)
        setOriginalCaption(data.caption)
        setFlowState({ step: 'PREVIEW', slug: data.slug })
      })
      .catch(() => {})
  })

  // Persiste em disco: cria (POST) na primeira vez, depois atualiza (PATCH).
  // É a fonte única de verdade da persistência — usada pelo autosave e pelo Salvar.
  async function persist() {
    if (!editingContent || persistingRef.current) return
    persistingRef.current = true
    try {
      const content = editingContent
      const cap = caption
      const slug = flowState.slug
      if (slug) {
        const res = await fetch(`/api/content/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, caption: cap }),
        })
        if (!res.ok) throw new Error('Falha ao salvar')
        lastLocalWriteRef.current = { slug, at: Date.now() }
      } else {
        const thumbnailDataUrl = await exportRef.current?.exportPNG()
        const res = await fetch('/api/content/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, caption: cap, thumbnail: thumbnailDataUrl?.split(',')[1] }),
        })
        if (!res.ok) throw new Error('Falha ao salvar')
        const data = (await res.json()) as { slug: string }
        lastLocalWriteRef.current = { slug: data.slug, at: Date.now() }
        setFlowState((s) => ({ ...s, slug: data.slug }))
        if (threadIdRef.current) {
          fetch(`/api/threads/${threadIdRef.current}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: data.slug }),
          }).catch(() => {})
        }
        // Atualiza a URL p/ que F5 recarregue o conteúdo salvo (e não regenere).
        window.history.replaceState(null, '', `/editor?slug=${data.slug}`)
      }
      setOriginalContent(content)
      setOriginalCaption(cap)
    } finally {
      persistingRef.current = false
    }
  }

  // Autosave debounced: cria/atualiza automaticamente a cada edição.
  useEffect(() => {
    if (!editingContent) return
    const dirty =
      JSON.stringify(editingContent) !== JSON.stringify(originalContent) || caption !== originalCaption
    if (!dirty) return
    const handle = setTimeout(() => {
      persist().catch(() => {})
    }, 800)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingContent, caption, originalContent, originalCaption, flowState.slug])

  async function handleSave() {
    await persist()
  }

  if (videoCtx) {
    return <VideoEditor slug={videoCtx.slug} threadId={videoCtx.threadId} seed={videoCtx.seed} />
  }

  return (
    <EditorLayout
      content={editingContent}
      caption={caption}
      slug={flowState.slug}
      tab={tab}
      onTabChange={setTab}
      flowState={flowState}
      setFlowState={setFlowState}
      selectedField={selectedField}
      onSelectField={setSelectedField}
      onContentChange={setEditingContent}
      onCaptionChange={setCaption}
      onSave={handleSave}
      exportRef={exportRef}
    />
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorInner />
    </Suspense>
  )
}
