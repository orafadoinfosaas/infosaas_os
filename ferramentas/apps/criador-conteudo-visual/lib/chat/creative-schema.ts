import { z } from 'zod'
import { makeFormat } from '@/lib/schemas/format.schema'
import type { Content } from '@/lib/schemas/content.schema'
import type { ContentType, FunnelPhase, TemplateId } from './flow-state'

// ─── Schemas "criativos" ──────────────────────────────────────────────────────
// Só o que a LLM deve produzir (texto + estrutura). Os campos controlados pelo
// app (id, datas, content_type, format, imagens…) são montados no servidor, então
// nunca dependem do modelo — elimina tipo errado e campos faltando.

const SlideCreativeSchema = z.object({
  type: z.enum(['cover', 'content', 'closing']),
  headline: z.string(),
  subheadline: z.string(),
  body: z.string(),
})

export const CarrosselCreativeSchema = z.object({
  topic: z.string(),
  slides: z.array(SlideCreativeSchema).min(3).max(10),
  caption: z.string(),
})

export const SingleCreativeSchema = z.object({
  topic: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  body: z.string(),
  caption: z.string(),
})

export const AnuncioCreativeSchema = z.object({
  topic: z.string(),
  headlines: z.array(z.string().max(70)).length(3),
  body: z.string(),
  caption: z.string(),
})

export function creativeSchemaFor(contentType: ContentType) {
  if (contentType === 'carrossel') return CarrosselCreativeSchema
  if (contentType === 'anuncio') return AnuncioCreativeSchema
  return SingleCreativeSchema
}

export type CarrosselCreative = z.infer<typeof CarrosselCreativeSchema>
export type SingleCreative = z.infer<typeof SingleCreativeSchema>
export type AnuncioCreative = z.infer<typeof AnuncioCreativeSchema>
export type Creative = CarrosselCreative | SingleCreative | AnuncioCreative

// ─── Montagem do Content completo ─────────────────────────────────────────────

function defaultFormat(_contentType: ContentType) {
  return makeFormat('3:4') // padrão do Instagram (1080×1440)
}

type AssembleInput = {
  contentType: ContentType
  funnelPhase: FunnelPhase
  templateId: TemplateId
  productId?: string
  author?: string
  creative: Creative
  // base = conteúdo atual (refino): preserva id/created_at/format/branding
  base?: Content | null
}

export function assembleContent({ contentType, funnelPhase, templateId, productId, author, creative, base }: AssembleInput): Content {
  const common = {
    id: base?.id ?? crypto.randomUUID(),
    created_at: base?.created_at ?? new Date().toISOString(),
    created_by: 'browser' as const,
    company_id: base?.company_id ?? 'infosaas',
    platform: 'instagram' as const,
    funnel_phase: funnelPhase,
    template_id: templateId,
    topic: creative.topic,
    caption_file: 'caption.md',
    format: base?.format ?? defaultFormat(contentType),
    branding: base?.branding,
    base_id: base?.base_id,
    product_id: productId ?? base?.product_id,
    author: author ?? base?.author,
  }

  // Sem imagem real na geração: image = null, então o fundo é a paleta da base
  // (a máscara só entra quando o usuário adiciona uma mídia no painel Layout).
  if (contentType === 'carrossel') {
    const c = creative as CarrosselCreative
    return {
      ...common,
      content_type: 'carrossel',
      slides: c.slides.map((s, i) => ({
        index: i + 1,
        type: s.type,
        layout: s.type === 'content' ? ('text-centered' as const) : ('image-full-overlay' as const),
        headline: s.headline,
        subheadline: s.subheadline,
        body: s.body,
        image: null,
        cta: s.type === 'closing' ? { text: 'Saiba mais', type: 'engagement' as const } : null,
      })),
    } as Content
  }

  if (contentType === 'anuncio') {
    const a = creative as AnuncioCreative
    return {
      ...common,
      content_type: 'anuncio',
      headlines: a.headlines,
      body: a.body,
      image: null,
    } as Content
  }

  const s = creative as SingleCreative
  return {
    ...common,
    content_type: 'post',
    headline: s.headline,
    subheadline: s.subheadline,
    body: s.body,
    image: null,
  } as Content
}
