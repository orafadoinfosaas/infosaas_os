import fs from 'fs/promises'
import path from 'path'
import { getOutputPath } from '@/config/company'
import { ContentSchema } from '@/lib/schemas/content.schema'
import type { Content } from '@/lib/schemas/content.schema'
import { CONTENT_TYPE_DIRS } from '@infosaas/content'

const CONTENT_TYPES = CONTENT_TYPE_DIRS

export type CreationSummary = {
  slug: string
  content_type: Content['content_type']
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

export type ContentWithCaption = {
  content: Content
  caption: string
  slug: string
  thumbnail_url: string | null
}

async function exists(p: string): Promise<boolean> {
  return fs.access(p).then(() => true).catch(() => false)
}

async function findContentDir(slug: string): Promise<{ dir: string; contentType: string } | null> {
  const base = path.join(getOutputPath(), 'instagram')
  for (const type of CONTENT_TYPES) {
    const dir = path.join(base, type, slug)
    if (await exists(dir)) return { dir, contentType: type }
  }
  return null
}

export async function readContent(slug: string): Promise<ContentWithCaption> {
  const found = await findContentDir(slug)
  if (!found) throw new Error(`Conteúdo não encontrado: ${slug}`)

  const raw = await fs.readFile(path.join(found.dir, 'content.json'), 'utf-8')
  const content = ContentSchema.parse(JSON.parse(raw))
  // caption.md é opcional — em modo IDE a LLM pode gravar o content.json primeiro
  const caption = await fs
    .readFile(path.join(found.dir, 'caption.md'), 'utf-8')
    .catch(() => '')
  const hasThumbnail = await exists(path.join(found.dir, 'thumbnail.png'))

  return {
    content,
    caption,
    slug,
    thumbnail_url: hasThumbnail ? `/api/content/${slug}/thumbnail` : null,
  }
}

export async function listContents(): Promise<CreationSummary[]> {
  const base = path.join(getOutputPath(), 'instagram')
  const summaries: CreationSummary[] = []

  for (const type of CONTENT_TYPES) {
    const typeDir = path.join(base, type)
    if (!(await exists(typeDir))) continue

    const entries = await fs.readdir(typeDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const slug = entry.name
      const contentPath = path.join(typeDir, slug, 'content.json')
      if (!(await exists(contentPath))) continue

      try {
        const raw = await fs.readFile(contentPath, 'utf-8')
        const content = ContentSchema.parse(JSON.parse(raw))
        const hasThumbnail = await exists(path.join(typeDir, slug, 'thumbnail.png'))

        summaries.push({
          slug,
          content_type: content.content_type,
          topic: content.topic,
          funnel_phase: content.funnel_phase,
          template_id: content.template_id,
          created_at: content.created_at,
          publish_status: content.publish_status ?? 'draft',
          scheduled_at: content.scheduled_at,
          platform: content.platform,
          publish_targets: content.publish_targets ?? [],
          thumbnail_url: hasThumbnail ? `/api/content/${slug}/thumbnail` : null,
        })
      } catch {
        // arquivo corrompido — ignora silenciosamente
      }
    }
  }

  return summaries.sort((a, b) => b.created_at.localeCompare(a.created_at))
}
