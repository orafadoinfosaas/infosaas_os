import { z } from 'zod'

const HEX = /^#[0-9A-Fa-f]{6}$/

// Configuração de layout de um slide/frame (painel "Layout").

export const AlignSchema = z.object({
  vertical: z.enum(['top', 'center', 'bottom']),
  horizontal: z.enum(['left', 'center', 'right']),
})
export type Align = z.infer<typeof AlignSchema>

// Mídia: imagem ou vídeo, via URL/upload/IA. mode=cover (fundo) ou element (bloco).
export const MediaSchema = z.object({
  kind: z.enum(['image', 'video', 'none']),
  source: z.enum(['url', 'upload', 'ai']).optional(),
  ref: z.string(), // filename (upload) ou URL
  mode: z.enum(['cover', 'element']),
  fit: z.enum(['cover', 'contain']),
  position: z.enum(['top', 'middle', 'bottom']).optional(), // posição do bloco quando mode=element ('middle' = após a headline)
  radius: z.number().min(0).optional(), // raio de borda (px) da imagem no modo element
  box: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
})
export type Media = z.infer<typeof MediaSchema>

export const BackgroundSchema = z.object({
  type: z.enum(['solid', 'gradient']),
  color: z.string().regex(HEX),
  gradient: z
    .object({
      from: z.string().regex(HEX),
      to: z.string().regex(HEX),
      angle: z.number(),
    })
    .optional(),
})
export type Background = z.infer<typeof BackgroundSchema>

// Máscara: scrim de cor sobre a mídia para legibilidade do texto (não é sombra).
// Quando há gradient, a máscara vira um degradê vertical (topo→meio→base) de opacidade.
export const MaskSchema = z.object({
  color: z.string().regex(HEX),
  opacity: z.number().min(0).max(1),
  gradient: z
    .object({
      top: z.number().min(0).max(1),
      mid: z.number().min(0).max(1),
      bottom: z.number().min(0).max(1),
    })
    .optional(),
})
export type Mask = z.infer<typeof MaskSchema>

// Overrides por bloco de texto (headline/subheadline/body/cta).
// Tudo opcional — quando ausente, usa a tipografia da base.
export const TextStyleSchema = z.object({
  hidden: z.boolean().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  letterSpacing: z.number().optional(), // px entre letras
  lineHeight: z.number().optional(), // multiplicador de entrelinha
  marginTop: z.number().optional(), // px acima do bloco
  marginBottom: z.number().optional(), // px abaixo do bloco
  paddingX: z.number().optional(), // px de inset horizontal (lateral)
})
export type TextStyle = z.infer<typeof TextStyleSchema>

export const LayoutSchema = z.object({
  align: AlignSchema,
  media: MediaSchema,
  background: BackgroundSchema,
  mask: MaskSchema,
  texts: z.record(z.string(), TextStyleSchema).optional(),
})
export type Layout = z.infer<typeof LayoutSchema>

export const DEFAULT_LAYOUT: Layout = {
  align: { vertical: 'center', horizontal: 'center' },
  media: { kind: 'none', ref: '', mode: 'cover', fit: 'cover' },
  background: { type: 'solid', color: '#F5F5F5' },
  mask: { color: '#000000', opacity: 0 },
}

export const FONT_OPTIONS = [
  { value: 'Sora', label: 'Sora' },
  { value: 'Georgia', label: 'Serifada' },
  { value: 'Courier New', label: 'Mono' },
]
