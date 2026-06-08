import { z } from 'zod'

const PaletteSchema = z.object({
  background: z.string(),
  text_primary: z.string(),
  text_secondary: z.string(),
  accent: z.string(),
  overlay_default: z.string(),
})

const TypographyStyleSchema = z.object({
  size: z.number(),
  weight: z.number(),
  letter_spacing: z.string().optional(),
  line_height: z.number().optional(),
  transform: z.string().optional(),
  opacity: z.number().optional(),
})

const TypographySchema = z.object({
  font_family: z.string(),
  headline: TypographyStyleSchema,
  subheadline: TypographyStyleSchema,
  body: TypographyStyleSchema,
  cta: TypographyStyleSchema.optional(),
  caption: TypographyStyleSchema.optional(),
})

const SlideLayoutConfigSchema = z.object({
  image: z.string(),
  overlay_opacity: z.number().optional(),
  text_position: z.enum(['bottom-left', 'bottom', 'center', 'top-right']),
  padding: z.number(),
  background: z.string().optional(),
  accent_block: z.boolean().optional(),
  cta_button: z.boolean().optional(),
})

const LogoConfigSchema = z.object({
  show_on: z.array(z.enum(['cover', 'content', 'closing'])),
  variant: z.enum(['branco', 'preto', 'colorido']),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  size: z.number(),
})

export const TemplateSchema = z.object({
  template_id: z.enum(['editorial', 'bold', 'narrativa']),
  label: z.string(),
  description: z.string(),
  best_for: z.array(z.enum(['descoberta', 'relacionamento', 'prontidao'])),
  palette: PaletteSchema,
  typography: TypographySchema,
  slide_layouts: z.object({
    cover: SlideLayoutConfigSchema,
    content: SlideLayoutConfigSchema,
    closing: SlideLayoutConfigSchema,
  }),
  logo: LogoConfigSchema,
})

export type TemplateConfig = z.infer<typeof TemplateSchema>
export type Palette = z.infer<typeof PaletteSchema>
export type Typography = z.infer<typeof TypographySchema>
export type SlideLayoutConfig = z.infer<typeof SlideLayoutConfigSchema>
