import { z } from 'zod'
import { ImageSchema, SlideSchema } from './slide.schema'
import { FormatSchema } from './format.schema'
import { BrandingSchema } from './branding.schema'
import { LayoutSchema } from './layout.schema'

const FunnelPhaseSchema = z.enum(['descoberta', 'relacionamento', 'prontidao'])
const TemplateIdSchema = z.enum(['editorial', 'bold', 'narrativa'])
const PublishStatusSchema = z.enum(['draft', 'published', 'scheduled'])

const BaseContentSchema = z.object({
  // Campos controlados pelo app (não-criativos): defaults tornam a geração via
  // LLM resiliente — modelos mais baratos às vezes omitem campos constantes.
  id: z.string().uuid().default(() => crypto.randomUUID()),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  created_by: z.enum(['ide', 'browser']).default('browser'),
  company_id: z.string().default('infosaas'),
  platform: z.literal('instagram').default('instagram'),
  format: FormatSchema,
  funnel_phase: FunnelPhaseSchema,
  template_id: TemplateIdSchema, // legado — equivale ao base_id
  base_id: z.string().optional(), // base de aplicação (nova)
  product_id: z.string().optional(), // produto em destaque (anúncio / prontidão)
  author: z.string().optional(), // voz/identidade do autor ('infosaas' | 'flg')
  topic: z.string(),
  caption_file: z.string().default('caption.md'),
  branding: BrandingSchema.optional(),
  publish_status: PublishStatusSchema.optional(),
  published_at: z.string().datetime().optional(),
  scheduled_at: z.string().datetime().optional(),
  publish_targets: z.array(z.string()).optional(),
})

export const CarrosselSchema = BaseContentSchema.extend({
  content_type: z.literal('carrossel'),
  slides: z.array(SlideSchema).min(2).max(10),
})

// Frame único: estático / stories / post (legado) compartilham a mesma forma.
const SingleFrameSchema = BaseContentSchema.extend({
  headline: z.string(),
  subheadline: z.string().default(''),
  body: z.string().default(''),
  image: ImageSchema.nullable(),
  design: LayoutSchema.optional(),
})

export const EstaticoSchema = SingleFrameSchema.extend({ content_type: z.literal('estatico') })
export const StoriesSchema = SingleFrameSchema.extend({ content_type: z.literal('stories') })
export const PostSchema = SingleFrameSchema.extend({ content_type: z.literal('post') })

export const AnuncioSchema = BaseContentSchema.extend({
  content_type: z.literal('anuncio'),
  headlines: z.array(z.string().max(70)).length(3),
  body: z.string(),
  image: ImageSchema.nullable(),
  design: LayoutSchema.optional(),
})

export const ContentSchema = z.discriminatedUnion('content_type', [
  CarrosselSchema,
  EstaticoSchema,
  StoriesSchema,
  PostSchema,
  AnuncioSchema,
])

export type FunnelPhase = z.infer<typeof FunnelPhaseSchema>
export type TemplateId = z.infer<typeof TemplateIdSchema>
export type PublishStatus = z.infer<typeof PublishStatusSchema>
export type Carrossel = z.infer<typeof CarrosselSchema>
export type Estatico = z.infer<typeof EstaticoSchema>
export type Stories = z.infer<typeof StoriesSchema>
export type Post = z.infer<typeof PostSchema>
export type Anuncio = z.infer<typeof AnuncioSchema>
export type Content = z.infer<typeof ContentSchema>
