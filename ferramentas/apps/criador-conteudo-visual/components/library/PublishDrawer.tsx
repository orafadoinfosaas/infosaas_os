'use client'

import { useState } from 'react'

type Mode = 'now' | 'scheduled'

type Props = {
  slug: string
  topic: string
  onClose: () => void
  onSuccess: (status: 'published' | 'scheduled') => void
}

export function PublishDrawer({ slug, topic, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minDatetime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)
  const canSubmit = mode === 'now' || (mode === 'scheduled' && !!scheduledAt)

  async function handlePublish() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          scheduled_at: mode === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
        }),
      })
      const data = await res.json() as { error?: string; ok?: boolean }
      if (!res.ok) throw new Error(data.error ?? 'Erro ao publicar')
      onSuccess(mode === 'scheduled' ? 'scheduled' : 'published')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-[360px] bg-[#111111] border-l border-white/10 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <span className="text-sm font-medium text-white/90">Publicar no Instagram</span>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Info do conteúdo */}
          <div className="rounded-xl bg-white/5 border border-white/8 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Conteúdo</p>
            <p className="text-sm text-white/80 leading-snug">{topic}</p>
          </div>

          {/* Modo */}
          <div className="flex gap-2">
            {(['now', 'scheduled'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${
                  mode === m
                    ? 'bg-[#FF3D00] border-[#FF3D00] text-white font-medium'
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {m === 'now' ? 'Publicar agora' : 'Agendar'}
              </button>
            ))}
          </div>

          {/* Date picker */}
          {mode === 'scheduled' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40">Data e hora da publicação</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={minDatetime}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 transition-colors [color-scheme:dark]"
              />
              <p className="text-[10px] text-white/25">
                O Activepieces vai publicar automaticamente no horário escolhido.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/8">
          <button
            onClick={handlePublish}
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl bg-[#FF3D00] hover:bg-[#e63600] active:bg-[#cc2e00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {loading
              ? 'Enviando...'
              : mode === 'scheduled'
              ? 'Confirmar agendamento'
              : 'Publicar agora'}
          </button>
        </div>
      </div>
    </>
  )
}
