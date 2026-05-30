'use client'

import Link from 'next/link'
import { Images, Image as ImageIcon, Megaphone, Clapperboard, Trash2 } from 'lucide-react'

export type CreationSummary = {
  slug: string
  content_type: string
  topic: string
  funnel_phase: string
  template_id: string
  created_at: string
  publish_status: string
  scheduled_at?: string
  platform: string
  publish_targets: string[]
  thumbnail_url: string | null
}

const FORMAT_LABEL: Record<string, string> = {
  estatico: 'Estático',
  carrossel: 'Carrossel',
  stories: 'Stories',
  anuncio: 'Anúncio',
  post: 'Estático',
}
const PHASE_LABEL: Record<string, string> = {
  descoberta: 'Descoberta',
  relacionamento: 'Relacionamento',
  prontidao: 'Prontidão',
}
const TYPE_ICON: Record<string, typeof Images> = {
  carrossel: Images,
  estatico: ImageIcon,
  post: ImageIcon,
  stories: Clapperboard,
  anuncio: Megaphone,
}

function StatusBadge({ status, scheduledAt }: { status: string; scheduledAt?: string }) {
  if (status === 'published')
    return <span className="rounded-full bg-green-500/10 text-green-700 px-2 py-0.5 text-[11px]">Publicado</span>
  if (status === 'scheduled') {
    const when = scheduledAt ? new Date(scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
    return <span className="rounded-full bg-amber-500/10 text-amber-700 px-2 py-0.5 text-[11px]">Agendado {when}</span>
  }
  return <span className="rounded-full bg-black/[0.05] text-[#8e8e8e] px-2 py-0.5 text-[11px]">Rascunho</span>
}

export function CreationCard({ item, onDeleted }: { item: CreationSummary; onDeleted?: (slug: string) => void }) {
  const Icon = TYPE_ICON[item.content_type] ?? ImageIcon
  const date = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Excluir "${item.topic}"? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/content/${item.slug}`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted?.(item.slug)
        window.dispatchEvent(new Event('creations-changed')) // atualiza "Suas criações" na sidebar
      }
    } catch {
      // silencioso
    }
  }

  return (
    <Link
      href={`/editor?slug=${item.slug}`}
      className="group flex flex-col rounded-2xl border border-black/8 bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/5] bg-[#f4f4f4] grid place-items-center overflow-hidden">
        {onDeleted && (
          <button
            onClick={handleDelete}
            title="Excluir"
            className="absolute top-2 right-2 z-10 grid place-items-center w-8 h-8 rounded-full bg-white/90 text-[#5d5d5d] opacity-0 group-hover:opacity-100 hover:text-red-500 shadow-sm transition-opacity"
          >
            <Trash2 size={15} />
          </button>
        )}
        {item.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail_url} alt={item.topic} className="w-full h-full object-cover" />
        ) : (
          <Icon size={28} className="text-[#c4c4c4]" />
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="text-sm text-[#0d0d0d] line-clamp-2 leading-snug">{item.topic}</p>
        <div className="flex items-center gap-2 text-[11px] text-[#8e8e8e]">
          <span>{FORMAT_LABEL[item.content_type] ?? item.content_type}</span>
          <span>·</span>
          <span>{PHASE_LABEL[item.funnel_phase] ?? item.funnel_phase}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <div className="mt-0.5">
          <StatusBadge status={item.publish_status} scheduledAt={item.scheduled_at} />
        </div>
      </div>
    </Link>
  )
}
