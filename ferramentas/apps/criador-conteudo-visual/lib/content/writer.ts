import fs from 'fs/promises'
import path from 'path'
import { getOutputPath } from '@/config/company'
import type { Content } from '@/lib/schemas/content.schema'
import { generateSlug } from './slug'

const TYPE_DIR: Record<Content['content_type'], string> = {
  carrossel: 'carroseis',
  estatico: 'estaticos',
  stories: 'stories',
  anuncio: 'anuncios',
  post: 'posts', // legado
}

export function getContentDir(contentType: Content['content_type'], slug: string): string {
  return path.join(getOutputPath(), 'instagram', TYPE_DIR[contentType], slug)
}

export async function writeContent(
  content: Content,
  caption: string,
  thumbnailBase64?: string
): Promise<{ slug: string; dir: string }> {
  const slug = generateSlug(content.topic)
  const dir = getContentDir(content.content_type, slug)

  await fs.mkdir(path.join(dir, 'assets'), { recursive: true })

  await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify(content, null, 2), 'utf-8')
  await fs.writeFile(path.join(dir, 'caption.md'), caption, 'utf-8')

  if (thumbnailBase64) {
    const buffer = Buffer.from(thumbnailBase64, 'base64')
    await fs.writeFile(path.join(dir, 'thumbnail.png'), buffer)
  }

  return { slug, dir }
}

export async function updateContentFile(
  contentType: Content['content_type'],
  slug: string,
  content: Content
): Promise<void> {
  const dir = getContentDir(contentType, slug)
  await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify(content, null, 2), 'utf-8')
}

// Remove o diretório do conteúdo (procura em todos os tipos, já que o slug não codifica o tipo).
export async function deleteContent(slug: string): Promise<boolean> {
  const base = path.join(getOutputPath(), 'instagram')
  let removed = false
  for (const dir of Object.values(TYPE_DIR)) {
    const p = path.join(base, dir, slug)
    const exists = await fs.access(p).then(() => true).catch(() => false)
    if (!exists) continue
    await fs.rm(p, { recursive: true, force: true })
    removed = true
  }
  return removed
}
