import { z } from 'zod'
import { ImageSchema, SlideSchema } from './slide.schema.js'
import { FormatSchema } from './format.schema.js'
import { BrandingSchema } from './branding.schema.js'
import { LayoutSchema } from './layout.schema.js'

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

// ── Transcrição (palavra-timestamped, em segundos) ──
const TranscriptWordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  removed: z.boolean().default(false), // cortada da edição (não-destrutivo)
})
export const TranscriptSchema = z.object({
  text: z.string().default(''),
  words: z.array(TranscriptWordSchema).default([]),
})

// ── Enquadramento do footage no frame 9:16 (crop / zoom / pan) ──
const FootageStyleSchema = z.object({
  fit: z.enum(['cover', 'contain']).default('cover'), // cover = preenche e corta; contain = cabe inteiro
  zoom: z.number().min(0.5).max(3).default(1),
  x: z.number().min(-1).max(1).default(0), // pan horizontal (-1 esquerda … 1 direita)
  y: z.number().min(-1).max(1).default(0), // pan vertical (-1 topo … 1 base)
  bg: z.string().default('#000000'), // fundo no modo "caber"
  blurBg: z.boolean().default(false), // preenche o fundo com o próprio vídeo desfocado
  volumeDb: z.number().min(-30).max(12).default(0), // ganho do áudio em dB
})

// ── Estilização do Reel (legenda / logo / intro / outro) ──
const CaptionStyleSchema = z.object({
  enabled: z.boolean().default(true),
  position: z.enum(['top', 'middle', 'bottom']).default('bottom'), // anchor base
  offsetX: z.number().min(-1).max(1).default(0), // ajuste fino horizontal
  offsetY: z.number().min(-1).max(1).default(0), // ajuste fino vertical
  fontSize: z.number().default(64),
  weight: z.enum(['bold', 'extrabold']).default('extrabold'),
  textColor: z.string().default('#FFFFFF'),
  activeColor: z.string().default('#FF3D00'), // palavra ativa (laranja Infosaas®)
  box: z.boolean().default(false),
  animation: z.enum(['karaoke', 'pop', 'fade', 'none']).default('karaoke'),
  maxWordsPerLine: z.number().int().min(1).max(8).default(4),
  uppercase: z.boolean().default(false),
})
const LogoStyleSchema = z.object({
  enabled: z.boolean().default(true),
  variant: z.enum(['preto', 'branco', 'laranja']).default('branco'),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).default('bottom-left'),
  size: z.number().default(64), // altura em px
  opacity: z.number().min(0).max(1).default(1),
})
const StingStyleSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().default(''),
  durationMs: z.number().default(1500),
})
// ── Edição: cortes (intervalos removidos) + zoom (regiões), em tempo de FONTE ──
const RangeSchema = z.object({ start: z.number(), end: z.number() })
const ZoomRegionSchema = z.object({
  start: z.number(),
  end: z.number(),
  scale: z.number().default(1.4),
  x: z.number().default(0), // foco horizontal -1..1
  y: z.number().default(0), // foco vertical -1..1
})
export const VideoEditSchema = z.object({
  enabled: z.boolean().default(true),
  cuts: z.array(RangeSchema).default([]),
  zooms: z.array(ZoomRegionSchema).default([]),
})

export const VideoStyleSchema = z.object({
  footage: FootageStyleSchema.prefault({}),
  caption: CaptionStyleSchema.prefault({}),
  logo: LogoStyleSchema.prefault({}),
  intro: StingStyleSchema.prefault({}),
  outro: StingStyleSchema.prefault({}),
})

// Vídeo/Reel: footage gravado (MP4 em assets/), sem canvas Konva.
// `video.ref` = footage original; `rendered_ref` = MP4 final com marca/legenda.
export const VideoSchema = BaseContentSchema.extend({
  content_type: z.literal('video'),
  video: z
    .object({
      ref: z.string().default(''),
      rendered_ref: z.string().optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      duration: z.number().positive().optional(),
      transcript: TranscriptSchema.optional(),
      style: VideoStyleSchema.prefault({}),
      edit: VideoEditSchema.prefault({}),
    })
    .prefault({ ref: '' }),
})

export const ContentSchema = z.discriminatedUnion('content_type', [
  CarrosselSchema,
  EstaticoSchema,
  StoriesSchema,
  PostSchema,
  AnuncioSchema,
  VideoSchema,
])

export type FunnelPhase = z.infer<typeof FunnelPhaseSchema>
export type TemplateId = z.infer<typeof TemplateIdSchema>
export type PublishStatus = z.infer<typeof PublishStatusSchema>
export type Carrossel = z.infer<typeof CarrosselSchema>
export type Estatico = z.infer<typeof EstaticoSchema>
export type Stories = z.infer<typeof StoriesSchema>
export type Post = z.infer<typeof PostSchema>
export type Anuncio = z.infer<typeof AnuncioSchema>
export type Video = z.infer<typeof VideoSchema>
export type VideoStyle = z.infer<typeof VideoStyleSchema>
export type VideoEdit = z.infer<typeof VideoEditSchema>
export type Transcript = z.infer<typeof TranscriptSchema>
export type Content = z.infer<typeof ContentSchema>
