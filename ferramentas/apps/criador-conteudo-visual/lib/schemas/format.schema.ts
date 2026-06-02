import { z } from 'zod'

export const AspectRatioSchema = z.enum(['1:1', '4:5', '3:4', '9:16'])
export type AspectRatio = z.infer<typeof AspectRatioSchema>

export const ContentTypeSchema = z.enum(['estatico', 'carrossel', 'stories', 'anuncio', 'post', 'video'])
export type ContentTypeId = z.infer<typeof ContentTypeSchema>

// Formato do criativo: proporção + dimensões em px.
// aspect_ratio é opcional por compatibilidade com conteúdos antigos; novos
// conteúdos sempre o definem.
export const FormatSchema = z.object({
  aspect_ratio: AspectRatioSchema.optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
export type Format = z.infer<typeof FormatSchema>

// Dimensões base por proporção (largura fixa 1080).
export const RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '3:4': { width: 1080, height: 1440 },
  '9:16': { width: 1080, height: 1920 },
}

// Proporções permitidas por formato (Instagram). 3:4 é o padrão (primeiro).
export const RATIOS_BY_TYPE: Record<ContentTypeId, AspectRatio[]> = {
  estatico: ['3:4', '4:5', '1:1'],
  carrossel: ['3:4', '4:5', '1:1'],
  stories: ['9:16'],
  anuncio: ['3:4', '4:5', '1:1'],
  post: ['3:4', '4:5', '1:1'], // legado (= estatico)
  video: ['9:16'], // Reel vertical
}

export function makeFormat(aspect_ratio: AspectRatio): Format {
  return { aspect_ratio, ...RATIO_DIMENSIONS[aspect_ratio] }
}
