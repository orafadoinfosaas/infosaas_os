import type { Content } from './schemas/content.schema.js'

// Convenção de armazenamento do conteúdo — COMPARTILHADA entre o editor (app) e o
// chat (MCP). É o que faz "abrir no editor" funcionar: os dois gravam/leem no MESMO
// caminho relativo à raiz de output do tenant.

export const TYPE_DIR: Record<Content['content_type'], string> = {
  carrossel: 'carroseis',
  estatico: 'estaticos',
  stories: 'stories',
  anuncio: 'anuncios',
  post: 'posts', // legado
  video: 'videos',
}

/** Nomes de pasta por tipo (para varrer todas as criações). */
export const CONTENT_TYPE_DIRS = Object.values(TYPE_DIR)

/** Caminho RELATIVO à raiz de output: `instagram/<tipo>/<slug>`. */
export function contentRelDir(contentType: Content['content_type'], slug: string): string {
  return `instagram/${TYPE_DIR[contentType]}/${slug}`
}

/** Slug determinístico a partir do tópico: `YYYY-MM-DD_topico-em-kebab`. */
export function generateSlug(topic: string): string {
  const date = new Date().toISOString().split('T')[0]
  const slug = topic
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (após NFD)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
  return `${date}_${slug}`
}
