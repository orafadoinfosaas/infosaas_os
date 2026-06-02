import { getTemplate } from '@/lib/templates'
import { DEFAULT_BRANDING } from '@/lib/schemas/branding.schema'
import type { Layout, Align } from '@/lib/schemas/layout.schema'
import type { Content } from '@/lib/schemas/content.schema'
import type { Slide, SlideImage } from '@/lib/schemas/slide.schema'
import type { TemplateConfig } from '@/lib/schemas/template.schema'

type LegacyFrame = {
  type?: 'cover' | 'content' | 'closing'
  image?: SlideImage | null
  design?: Layout
}

function deriveAlign(type?: string): Align {
  if (type === 'content') return { vertical: 'center', horizontal: 'center' }
  // cover / closing / frame único → herói no rodapé-esquerda
  return { vertical: 'bottom', horizontal: 'left' }
}

function deriveDesign(frame: LegacyFrame, template: TemplateConfig): Layout {
  if (frame.design) return frame.design

  const img = frame.image ?? null
  const hasImg = !!img?.filename

  return {
    align: deriveAlign(frame.type),
    media: hasImg
      ? { kind: 'image', source: 'upload', ref: img!.filename, mode: 'cover', fit: 'cover' }
      : { kind: 'none', ref: '', mode: 'cover', fit: 'cover' },
    background: { type: 'solid', color: template.palette.background },
    mask: img?.overlay
      ? { color: img.overlay.color, opacity: img.overlay.opacity }
      : { color: '#000000', opacity: hasImg ? 0.5 : 0 },
  }
}

// Preenche branding + design (modelo novo) a partir do legado/base.
// Idempotente: se já tem design/branding, mantém.
export function hydrateContent(content: Content): Content {
  const template = getTemplate(content.template_id)
  const branding = content.branding ?? DEFAULT_BRANDING

  // Vídeo/Reel não tem design Konva — passa intocado (só garante branding).
  if (content.content_type === 'video') {
    return { ...content, branding }
  }

  if (content.content_type === 'carrossel') {
    return {
      ...content,
      branding,
      slides: content.slides.map((s: Slide) => ({ ...s, design: deriveDesign(s, template) })),
    }
  }

  return { ...content, branding, design: deriveDesign(content, template) }
}
