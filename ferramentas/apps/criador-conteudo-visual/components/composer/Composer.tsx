'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowUp, X } from 'lucide-react'
import { PillSelect } from './PillSelect'

const PLATFORMS = [{ value: 'instagram', label: 'Instagram' }]
const FORMATS = [
  { value: 'estatico', label: 'Estático' },
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'stories', label: 'Stories' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'video', label: 'Vídeo/Reel' },
]
const COMMUNICATIONS = [
  { value: 'descoberta', label: 'Descoberta' },
  { value: 'relacionamento', label: 'Relacionamento' },
  { value: 'prontidao', label: 'Prontidão' },
]
const AUTHORS = [
  { value: 'infosaas', label: 'Infosaas®' },
  { value: 'flg', label: 'FLG (Rafael)' },
]

export function Composer() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [platform, setPlatform] = useState<string | null>('instagram')
  const [format, setFormat] = useState<string | null>(null)
  const [communication, setCommunication] = useState<string | null>(null)
  const [author, setAuthor] = useState<string | null>('infosaas')
  const [product, setProduct] = useState<string | null>(null)
  const [products, setProducts] = useState<{ value: string; label: string }[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: { id: string; label: string }[]) =>
        setProducts(Array.isArray(d) ? d.map((p) => ({ value: p.id, label: p.label })) : [])
      )
      .catch(() => {})
  }, [])

  // Vídeo não é geracional (footage entra no editor) — o texto é só um título
  // opcional e nada além do formato é obrigatório.
  const isVideo = format === 'video'

  // Produto aparece em Anúncio (CTA direto) e em Prontidão (fundo de funil). Obrigatório no Anúncio.
  const showProduct = format === 'anuncio' || communication === 'prontidao'
  const productRequired = format === 'anuncio'

  const canSend = isVideo
    ? !!format && !sending
    : text.trim().length > 0 && !!format && !!communication && (!productRequired || !!product) && !sending

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: text.trim(),
          platform,
          format,
          communication: communication ?? 'descoberta',
          author,
          product: showProduct ? product : null,
          attachments: files.map((f) => f.name),
        }),
      })
      if (!res.ok) throw new Error('Falha ao criar')
      const data = (await res.json()) as { id: string }
      router.push(`/editor?thread=${data.id}`)
    } catch {
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="rounded-[28px] border border-black/10 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow focus-within:shadow-[0_2px_18px_rgba(0,0,0,0.10)]">
        {/* Anexos */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 pt-4">
            {files.map((f, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 h-7 text-xs text-[#5d5d5d]"
              >
                {f.name}
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-[#9d9d9d] hover:text-[#0d0d0d]">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Texto */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={isVideo ? 'Dê um nome ao vídeo (opcional) — o footage você sobe no editor…' : 'Descreva o que você quer criar…'}
          className="w-full resize-none bg-transparent px-5 pt-5 pb-2 text-[16px] leading-relaxed text-[#0d0d0d] placeholder:text-[#9d9d9d] focus:outline-none max-h-48"
        />

        {/* Barra inferior */}
        <div className="flex items-center gap-2 px-3 pb-3">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Anexar"
            className="grid place-items-center w-9 h-9 flex-none rounded-full text-[#5d5d5d] hover:bg-black/5 transition-colors"
          >
            <Plus size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              const list = e.target.files ? Array.from(e.target.files) : []
              if (list.length) setFiles((prev) => [...prev, ...list])
              e.target.value = ''
            }}
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            <PillSelect label="Plataforma" options={PLATFORMS} value={platform} onChange={setPlatform} />
            <PillSelect label="Formato" options={FORMATS} value={format} onChange={setFormat} />
            <PillSelect label="Tipo de Comunicação" options={COMMUNICATIONS} value={communication} onChange={setCommunication} />
            <PillSelect label="Voz" options={AUTHORS} value={author} onChange={setAuthor} />
            {showProduct && (
              <PillSelect label={productRequired ? 'Produto *' : 'Produto'} options={products} value={product} onChange={setProduct} />
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Enviar"
            className="ml-auto grid place-items-center w-9 h-9 flex-none rounded-full bg-[#0d0d0d] text-white hover:opacity-90 disabled:bg-black/10 disabled:text-white/70 disabled:cursor-not-allowed transition-all"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
