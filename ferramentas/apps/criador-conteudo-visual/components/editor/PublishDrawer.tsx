'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Content } from '@/lib/schemas/content.schema'

type Profile = { id: string; label: string; entity_id?: string }
export type PublishResult = {
  status: string
  composio?: { configured: boolean; triggered: boolean; note?: string }
} | null

type Props = {
  content: Content
  slug?: string
  mode: 'now' | 'schedule'
  onClose: () => void
  onSubmit: (scheduledAt: string | null, profile: string | null, entityId: string | null) => Promise<PublishResult>
}

export function PublishDrawer({ content, slug, mode: initialMode, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<'now' | 'schedule'>(initialMode)
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [composioConfigured, setComposioConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PublishResult>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/publish/profiles')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { configured: boolean; profiles: Profile[] } | null) => {
        if (!d) return
        setComposioConfigured(d.configured)
        setProfiles(d.profiles)
        if (d.profiles[0]) setSelectedProfile(d.profiles[0])
      })
      .catch(() => {})
  }, [])

  const minDatetime = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)
  const canSubmit = !!slug && (mode === 'now' || !!scheduledAt) && !loading

  async function submit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await onSubmit(
        mode === 'schedule' ? new Date(scheduledAt).toISOString() : null,
        selectedProfile?.id ?? null,
        selectedProfile?.entity_id ?? null,
      )
      setResult(res)
    } catch {
      setError('Falha ao publicar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-black/8 z-50 flex flex-col shadow-2xl">
        <div className="h-14 flex-none flex items-center justify-between px-5 border-b border-black/5">
          <span className="text-sm font-semibold text-[#0d0d0d]">Publicar no Instagram</span>
          <button onClick={onClose} className="text-[#9d9d9d] hover:text-[#0d0d0d]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="rounded-xl bg-black/[0.03] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[#9d9d9d] mb-1">Conteúdo</p>
            <p className="text-sm text-[#0d0d0d] leading-snug">{content.topic}</p>
          </div>

          {/* Modo */}
          <div className="flex gap-2">
            {(['now', 'schedule'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 h-10 rounded-xl text-sm border transition-colors ${
                  mode === m ? 'bg-[#0d0d0d] border-[#0d0d0d] text-white' : 'border-black/10 text-[#5d5d5d] hover:border-black/20'
                }`}
              >
                {m === 'now' ? 'Publicar agora' : 'Agendar'}
              </button>
            ))}
          </div>

          {mode === 'schedule' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[#5d5d5d]">Data e hora</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                min={minDatetime}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-sm text-[#0d0d0d] outline-none focus:border-black/25 [color-scheme:light]"
              />
            </label>
          )}

          {/* Perfil */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#5d5d5d]">Perfil</span>
            {profiles.length > 0 ? (
              <select
                value={selectedProfile?.id ?? ''}
                onChange={(e) => setSelectedProfile(profiles.find((p) => p.id === e.target.value) ?? null)}
                className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-sm text-[#0d0d0d] outline-none focus:border-black/25"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-[#9d9d9d]">
                {composioConfigured === false
                  ? 'Composio não configurada (defina COMPOSIO_API_KEY).'
                  : 'Nenhum perfil conectado.'}
              </p>
            )}
          </label>

          {!slug && <p className="text-xs text-amber-600">Salve o conteúdo antes de publicar.</p>}

          {result && (
            <div className={`rounded-xl px-4 py-3 text-xs ${result.composio?.triggered ? 'bg-green-50 text-green-700' : 'bg-black/[0.03] text-[#5d5d5d]'}`}>
              Status: <strong>{result.status}</strong>
              {result.composio?.triggered && <p className="mt-1">✓ {result.composio.note}</p>}
              {result.composio && !result.composio.triggered && (
                <p className="mt-1 text-amber-600">{result.composio.note}</p>
              )}
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="p-5 border-t border-black/5">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full h-11 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            {loading ? 'Enviando…' : mode === 'schedule' ? 'Agendar' : 'Publicar agora'}
          </button>
        </div>
      </div>
    </>
  )
}
