import { z } from 'zod'

const HEX = /^#[0-9A-Fa-f]{6}$/

// Aplicação da marca no criativo (aba "Marca").
export const LogoBrandingSchema = z.object({
  show: z.boolean(),
  variant: z.enum(['preto', 'branco', 'laranja']),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
})
export type LogoBranding = z.infer<typeof LogoBrandingSchema>

export const NumberingSchema = z.object({
  show: z.boolean(),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  style: z.enum(['fraction', 'index']), // "1/10" | "01"
})
export type Numbering = z.infer<typeof NumberingSchema>

export const HandleSchema = z.object({
  show: z.boolean(),
  name: z.string(),
  color: z.string().regex(HEX),
  avatar: z.object({
    show: z.boolean(),
    filename: z.string(),
  }),
})
export type Handle = z.infer<typeof HandleSchema>

export const AuthorialSchema = z.object({
  show: z.boolean(),
  text: z.string(),
})
export type Authorial = z.infer<typeof AuthorialSchema>

export const BrandingSchema = z.object({
  logo: LogoBrandingSchema,
  numbering: NumberingSchema,
  handle: HandleSchema,
  authorial: AuthorialSchema,
})
export type Branding = z.infer<typeof BrandingSchema>

export const DEFAULT_BRANDING: Branding = {
  logo: { show: true, variant: 'preto', position: 'top-right' },
  numbering: { show: false, position: 'bottom-right', style: 'fraction' },
  handle: { show: false, name: '', color: '#000000', avatar: { show: false, filename: '' } },
  authorial: { show: false, text: '' },
}
