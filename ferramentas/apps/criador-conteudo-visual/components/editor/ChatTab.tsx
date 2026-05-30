'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { type Content } from '@/lib/schemas/content.schema'
import { hydrateContent } from '@/lib/content/hydrate'
import type { FlowState } from '@/lib/chat/flow-state'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; commandsApplied?: string }

type Props = {
  flowState: FlowState
  setFlowState: (s: FlowState | ((prev: FlowState) => FlowState)) => void
  content: Content | null
  setEditingContent: (c: Content) => void
  onCaptionExtracted: (caption: string) => void
}

type GenerateResponse = { reply: string; content: Content | null; caption: string | null; commandsApplied?: string }

export function ChatTab({ flowState, setFlowState, content, setEditingContent, onCaptionExtracted }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const add = (role: Msg['role'], text: string, extra?: Partial<Msg>) =>
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, content: text, ...extra }])

  async function callGenerate(mode: 'generate' | 'refine', userMessage?: string) {
    setLoading(true)
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          contentType: flowState.contentType,
          funnelPhase: flowState.funnelPhase,
          templateId: flowState.templateId,
          productId: flowState.productId,
          author: flowState.author,
          brief: flowState.brief,
          userMessage,
          history,
          currentContent: content,
          slug: flowState.slug,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      const data = (await res.json()) as GenerateResponse
      add('assistant', data.reply, data.commandsApplied ? { commandsApplied: data.commandsApplied } : undefined)

      if (data.content) {
        setEditingContent(hydrateContent(data.content))
        if (data.caption) onCaptionExtracted(data.caption)
        // Não geramos slug aqui — a persistência (page) cria em disco e define o slug.
        setFlowState((s) => ({ ...s, step: 'PREVIEW' }))
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao gerar conteúdo.'
      add('assistant', `⚠️ ${msg}`)
      setFlowState((s) => (s.step === 'GENERATING' ? { ...s, step: 'INIT' } : s))
    } finally {
      setLoading(false)
    }
  }

  // Auto-inicia a geração quando chega do composer (BRIEF_RECEIVED)
  useEffect(() => {
    if (startedRef.current) return
    if (flowState.step !== 'BRIEF_RECEIVED' || !flowState.brief) return
    if (!flowState.contentType || !flowState.funnelPhase || !flowState.templateId) return
    startedRef.current = true
    setFlowState((s) => ({ ...s, step: 'GENERATING' }))
    callGenerate('generate')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowState.step])

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    add('user', text)
    callGenerate('refine', text)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pr-1">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-[#8e8e8e] mt-2">Converse com o agente para gerar e ajustar o conteúdo.</p>
        )}
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="self-end max-w-[85%] rounded-2xl bg-black/[0.05] px-4 py-2.5 text-sm text-[#0d0d0d]">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="flex flex-col gap-1.5">
              <div className="text-sm text-[#3d3d3d] leading-relaxed whitespace-pre-wrap">{m.content}</div>
              {m.commandsApplied && (
                <div className="self-start inline-flex items-center gap-1.5 rounded-lg bg-black/[0.04] px-2.5 py-1 text-[11px] text-[#5d5d5d]">
                  <span className="text-accent">✓</span>
                  <span className="font-mono">{m.commandsApplied}</span>
                </div>
              )}
            </div>
          )
        )}
        {loading && <span className="text-sm text-[#8e8e8e]">{flowState.step === 'GENERATING' ? 'Gerando…' : 'Pensando…'}</span>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={submit} className="flex-none pt-3">
        <div className="flex items-end gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm focus-within:shadow-md transition-shadow">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit(e as unknown as React.FormEvent)
              }
            }}
            rows={1}
            placeholder="Peça ajustes ao conteúdo…"
            disabled={loading}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-[#0d0d0d] placeholder:text-[#9d9d9d] focus:outline-none max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Enviar"
            className="grid place-items-center w-8 h-8 flex-none rounded-full bg-[#0d0d0d] text-white hover:opacity-90 disabled:bg-black/10 disabled:cursor-not-allowed transition-all"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
