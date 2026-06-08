import { z } from 'zod'
import { LayoutSchema } from './layout.schema.js'

export const OverlaySchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  opacity: z.number().min(0).max(1),
})

export const ImageSchema = z.object({
  filename: z.string(),
  position: z.enum(['background', 'top', 'bottom', 'side', 'small-top-right']),
  overlay: OverlaySchema,
})

export const CTASchema = z.object({
  text: z.string(),
  type: z.enum(['engagement', 'link', 'none']),
  url: z.string().url().optional(),
})

export const SlideSchema = z.object({
  index: z.number().int().min(1).max(10),
  type: z.enum(['cover', 'content', 'closing']),
  layout: z.enum(['image-full-overlay', 'text-centered', 'image-top-right']),
  headline: z.string(),
  subheadline: z.string().default(''),
  body: z.string().default(''),
  image: ImageSchema.nullable(),
  cta: CTASchema.nullable(),
  design: LayoutSchema.optional(), // modelo novo de layout (C3); legado: layout/image
})

export type Overlay = z.infer<typeof OverlaySchema>
export type SlideImage = z.infer<typeof ImageSchema>
export type CTA = z.infer<typeof CTASchema>
export type Slide = z.infer<typeof SlideSchema>
