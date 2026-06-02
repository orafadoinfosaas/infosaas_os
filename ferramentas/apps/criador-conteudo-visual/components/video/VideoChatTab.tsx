'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import type { VideoEdit, VideoStyle } from '@/lib/schemas/content.schema'

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

type Props = {
  slug: string | null
  edit: VideoEdit
  style: VideoStyle
  hasTranscript: boolean
  onApply: (next: { edit: VideoEdit; style: VideoStyle }) => void
}

export function VideoChatTab({ slug, edit, style, hasTranscript, onApply }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const push = (role: Msg['role'], content: string) =>
    setMessages((p) => [...p, { id: crypto.randomUUID(), role, content }])

  async function send(text: string) {
    if (!slug || !text.trim() || loading) return
    push('user', text)
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setLoading(true)
    try {
      const res = await fetch('/api/video/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, userMessage: text, history, edit, style }),
      })
      const d = await res.json()
      if (res.ok) {
        if (d.edit && d.style) onApply({ edit: d.edit, style: d.style })
        push('assistant', d.reply || 'Pronto.')
      } else {
        push('assistant', `⚠️ ${d.error || 'Falha'}`)
      }
    } catch {
      push('assistant', '⚠️ Falha ao falar com o agente.')
    } finally {
      setLoading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = input.trim()
    if (!t) return
    setInput('')
    send(t)
  }

  const suggestions = ['Corta os silêncios e dá zoom dinâmico', 'Legenda no topo, maiúscula', 'Aumenta o volume em 6 dB']

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && !loading && (
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-sm text-[#8e8e8e]">
              Edite por conversa: cortes, zoom, legenda, logo, volume.
              {!hasTranscript && ' (Transcreva o áudio primeiro p/ cortar/zoom por frase.)'}
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="self-start rounded-full border border-black/10 px-3 py-1.5 text-xs text-[#5d5d5d] hover:bg-black/5"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="self-end max-w-[85%] rounded-2xl bg-black/[0.05] px-3.5 py-2 text-sm text-[#0d0d0d]">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="text-sm text-[#3d3d3d] leading-relaxed whitespace-pre-wrap">
              {m.content}
            </div>
          )
        )}
        {loading && <span className="text-sm text-[#8e8e8e]">Pensando…</span>}
        <div ref={endRef} />
      </div>

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
            placeholder="Peça cortes, zoom, legenda…"
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
