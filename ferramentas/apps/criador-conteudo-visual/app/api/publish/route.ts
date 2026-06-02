import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { readContent } from '@/lib/content/reader'
import { updateContentFile, getContentDir } from '@/lib/content/writer'
import { publishToComposio, type ComposioPublishInput } from '@/lib/publish/composio'
import { uploadToR2 } from '@/lib/publish/r2'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const slug = typeof body.slug === 'string' ? body.slug : null
  const scheduledAt = typeof body.scheduled_at === 'string' ? body.scheduled_at : null
  const profile = typeof body.profile === 'string' ? body.profile : null
  const entityId = typeof body.entity_id === 'string' ? body.entity_id : null
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

  // Vídeo + publicar agora: sobe o MP4 pro R2 e gera a URL pública que o IG busca.
  // Prefere o MP4 renderizado (com marca/legenda); cai no footage cru se não houver.
  let videoUrl: string | undefined
  if (content.content_type === 'video' && !scheduledAt) {
    const ref = content.video.rendered_ref ?? content.video.ref
    if (!ref) return NextResponse.json({ error: 'vídeo não enviado' }, { status: 400 })
    const localPath = path.join(getContentDir('video', slug), ref)
    const filename = ref.split('/').pop() as string
    try {
      videoUrl = await uploadToR2(localPath, `${slug}/${filename}`)
    } catch (e) {
      return NextResponse.json({ error: `Falha no upload R2: ${(e as Error).message}` }, { status: 500 })
    }
  }

  const input: ComposioPublishInput = {
    content_type: content.content_type,
    caption: data.caption,
    scheduled_at: scheduledAt,
    profile,
    entity_id: entityId,
    images,
    video_url: videoUrl,
  }
  const composio = await publishToComposio(input)

  // Estado de publicação. Vídeo só vira "published" se o Composio confirmou;
  // os demais tipos mantêm o comportamento legado (otimista / Activepieces).
  if (scheduledAt) {
    content.publish_status = 'scheduled'
    content.scheduled_at = scheduledAt
    content.published_at = undefined
  } else {
    const ok = content.content_type === 'video' ? composio.triggered : true
    if (ok) {
      content.publish_status = 'published'
      content.published_at = now
      content.scheduled_at = undefined
    }
  }
  content.publish_targets = profile ? [profile] : []

  await updateContentFile(content.content_type, slug, content)

  return NextResponse.json({ status: content.publish_status ?? 'draft', scheduled_at: scheduledAt, composio })
}
