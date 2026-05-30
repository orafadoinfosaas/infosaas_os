import { z } from 'zod'
import { BrandingSchema } from './branding.schema'
import { MaskSchema } from './layout.schema'
import { ContentTypeSchema } from './format.schema'

// "Base de Aplicação" — generalização editável dos antigos templates.
// Define como a identidade se aplica por formato (paleta, tipografia, layouts,
// defaults de marca e de máscara).

const PaletteSchema = z.object({
  background: z.string(),
  text_primary: z.string(),
  text_secondary: z.string(),
  accent: z.string(),
})
export type BasePalette = z.infer<typeof PaletteSchema>

const TypeStyleSchema = z.object({
  size: z.number(),
  weight: z.number(),
  letter_spacing: z.string().optional(),
  line_height: z.number().optional(),
})

const TypographySchema = z.object({
  font_family: z.string(),
  headline: TypeStyleSchema,
  subheadline: TypeStyleSchema,
  body: TypeStyleSchema,
  cta: TypeStyleSchema.optional(),
})
export type BaseTypography = z.infer<typeof TypographySchema>

export const BaseSchema = z.object({
  base_id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  best_for: z.array(z.enum(['descoberta', 'relacionamento', 'prontidao'])),
  applies_to: z.array(ContentTypeSchema),
  palette: PaletteSchema,
  typography: TypographySchema,
  // forma livre por enquanto; refinado na Onda C junto com o renderer
  slide_layouts: z.record(z.string(), z.unknown()).optional(),
  branding_defaults: BrandingSchema.optional(),
  mask_default: MaskSchema.optional(),
})
export type Base = z.infer<typeof BaseSchema>
