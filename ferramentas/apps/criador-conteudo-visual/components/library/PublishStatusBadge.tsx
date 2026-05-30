import type { PublishStatus } from '@/lib/schemas/content.schema'

const STYLES: Record<string, string> = {
  draft: 'bg-white/8 text-white/40',
  scheduled: 'bg-amber-500/15 text-amber-400',
  published: 'bg-green-500/15 text-green-400',
}

const LABELS: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
}

type Props = { status: PublishStatus | 'draft' | string }

export function PublishStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${STYLES[status] ?? STYLES.draft}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
