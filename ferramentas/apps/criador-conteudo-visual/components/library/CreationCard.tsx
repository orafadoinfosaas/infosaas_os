'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PublishStatusBadge } from './PublishStatusBadge'
import { CONTENT_TYPE_LABELS, PHASE_LABELS } from '@/lib/chat/flow-state'
import type { ContentType, FunnelPhase } from '@/lib/chat/flow-state'
import type { CreationSummary } from '@/lib/content/reader'

type Props = {
  item: CreationSummary
  onPublish?: () => void
}

export function CreationCard({ item, onPublish }: Props) {
  const typeLabel = CONTENT_TYPE_LABELS[item.content_type as ContentType] ?? item.content_type
  const phaseLabel = PHASE_LABELS[item.funnel_phase as FunnelPhase] ?? item.funnel_phase
  const date = new Date(item.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col group hover:border-white/20 transition-colors">
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-white/5 flex-none overflow-hidden">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.topic}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/10 text-5xl select-none">
            ◻
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[#FF3D00] font-bold">{typeLabel}</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-[10px] text-white/40">{phaseLabel}</span>
        </div>
        <p className="text-sm text-white/80 leading-snug line-clamp-2">{item.topic}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <PublishStatusBadge status={item.publish_status} />
          <span className="text-[10px] text-white/25">{date}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-2">
        <Link
          href={`/?slug=${item.slug}`}
          className="flex-1 text-center py-1.5 rounded-lg bg-white/5 hover:bg-white/12 border border-white/10 text-xs text-white/60 hover:text-white transition-all"
        >
          Editar
        </Link>
        {item.publish_status !== 'published' && onPublish && (
          <button
            onClick={onPublish}
            className="flex-1 py-1.5 rounded-lg bg-[#FF3D00]/10 hover:bg-[#FF3D00]/20 border border-[#FF3D00]/30 text-xs text-[#FF3D00] transition-all"
          >
            Publicar
          </button>
        )}
      </div>
    </div>
  )
}
