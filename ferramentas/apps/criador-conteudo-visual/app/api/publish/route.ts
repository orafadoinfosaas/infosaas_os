import { NextRequest, NextResponse } from 'next/server'
import { readContent } from '@/lib/content/reader'
import { updateContentFile } from '@/lib/content/writer'
import { publishToComposio } from '@/lib/publish/composio'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const slug = typeof body.slug === 'string' ? body.slug : null
  const scheduledAt = typeof body.scheduled_at === 'string' ? body.scheduled_at : null
  const profile = typeof body.profile === 'string' ? body.profile : null
  const images = Array.isArray(body.images) ? body.images : []

  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })

  let data
  try {
    data = await readContent(slug)
  } catch {
    return NextResponse.json({ error: 'conteúdo não encontrado' }, { status: 404 })
  }

  const content = data.content
  const now = new Date().toISOString()
  content.publish_status = scheduledAt ? 'scheduled' : 'published'
  content.scheduled_at = scheduledAt ?? undefined
  content.published_at = scheduledAt ? undefined : now
  content.publish_targets = profile ? [profile] : []

  await updateContentFile(content.content_type, slug, content)

  const composio = await publishToComposio({
    content_type: content.content_type,
    caption: data.caption,
    scheduled_at: scheduledAt,
    profile,
    images,
  })

  return NextResponse.json({ status: content.publish_status, scheduled_at: scheduledAt, composio })
}
