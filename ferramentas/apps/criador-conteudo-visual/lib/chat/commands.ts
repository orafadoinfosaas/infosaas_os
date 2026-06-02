import { z } from 'zod'
import { TEMPLATES } from '@/lib/templates'
import { DEFAULT_LAYOUT, type Layout } from '@/lib/schemas/layout.schema'
import { DEFAULT_BRANDING } from '@/lib/schemas/branding.schema'
import type { Content } from '@/lib/schemas/content.schema'

// Comandos cirúrgicos que o copiloto pode emitir no canvas — em vez de regerar
// o conteúdo inteiro, ele aplica edições pontuais (igual o Cursor em código).

const KindEnum = z.enum([
  'setText',
  'hideField',
  'setFieldStyle',
  'duplicateSlide',
  'removeSlide',
  'setBase',
  'setSlideType',
  'moveSlide',
  'setCaption',
  'setLogo',
  'setNumbering',
  'setHandle',
  'setMedia',
  'setMask',
])
const FieldEnum = z.enum(['headline', 'subheadline', 'body', 'cta'])
const BaseEnum = z.enum(['editorial', 'bold', 'narrativa'])
const AlignEnum = z.enum(['left', 'center', 'right'])
const SlideTypeEnum = z.enum(['cover', 'content', 'closing'])
const LogoVariantEnum = z.enum(['preto', 'branco', 'laranja'])
const CornerEnum = z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
const NumberingStyleEnum = z.enum(['fraction', 'index'])
const MediaKindEnum = z.enum(['image', 'none'])
const MediaModeEnum = z.enum(['cover', 'element'])
const MediaPositionEnum = z.enum(['top', 'middle', 'bottom'])

// Schema flat (todos os campos opcionais ficam nullable) — compatível com strict
// structured outputs do OpenAI. O dispatcher em applyCommand lê o "kind".
export const CommandSchema = z.object({
  kind: KindEnum,
  slideIndex: z.number().int().nullable(),
  field: FieldEnum.nullable(),
  text: z.string().nullable(),
  hidden: z.boolean().nullable(),
  fontSize: z.number().nullable(),
  letterSpacing: z.number().nullable(),
  lineHeight: z.number().nullable(),
  align: AlignEnum.nullable(),
  baseId: BaseEnum.nullable(),
  // estrutura de slide
  slideType: SlideTypeEnum.nullable(),
  toIndex: z.number().int().nullable(),
  // marca
  logoShow: z.boolean().nullable(),
  logoVariant: LogoVariantEnum.nullable(),
  logoPosition: CornerEnum.nullable(),
  numberingShow: z.boolean().nullable(),
  numberingStyle: NumberingStyleEnum.nullable(),
  numberingPosition: CornerEnum.nullable(),
  handleShow: z.boolean().nullable(),
  // margin/padding por bloco de texto (usados em setFieldStyle)
  marginTop: z.number().nullable(),
  marginBottom: z.number().nullable(),
  paddingX: z.number().nullable(),
  // mídia (usados em setMedia)
  mediaKind: MediaKindEnum.nullable(),
  mediaMode: MediaModeEnum.nullable(),
  mediaPosition: MediaPositionEnum.nullable(),
  mediaRadius: z.number().nullable(),
  mediaRef: z.string().nullable(), // URL ou filename
  // máscara (usados em setMask)
  maskGradientOn: z.boolean().nullable(), // true liga degradê / false volta a uniforme
  maskTop: z.number().nullable(), // 0..1 (alpha no topo)
  maskMid: z.number().nullable(),
  maskBottom: z.number().nullable(),
  maskOpacity: z.number().nullable(), // 0..1 (modo uniforme)
  maskColor: z.string().nullable(), // hex (#RRGGBB)
})

export type Command = z.infer<typeof CommandSchema>

// Helper para construir um Command a partir de campos parciais — preenche null
// nos que não foram informados. Usado pelos tools no multi-step.
const COMMAND_FIELD_DEFAULTS: Omit<Command, 'kind'> = {
  slideIndex: null,
  field: null,
  text: null,
  hidden: null,
  fontSize: null,
  letterSpacing: null,
  lineHeight: null,
  align: null,
  baseId: null,
  slideType: null,
  toIndex: null,
  logoShow: null,
  logoVariant: null,
  logoPosition: null,
  numberingShow: null,
  numberingStyle: null,
  numberingPosition: null,
  handleShow: null,
  marginTop: null,
  marginBottom: null,
  paddingX: null,
  mediaKind: null,
  mediaMode: null,
  mediaPosition: null,
  mediaRadius: null,
  mediaRef: null,
  maskGradientOn: null,
  maskTop: null,
  maskMid: null,
  maskBottom: null,
  maskOpacity: null,
  maskColor: null,
}

export function makeCommand(partial: Partial<Command> & { kind: Command['kind'] }): Command {
  return { ...COMMAND_FIELD_DEFAULTS, ...partial } as Command
}

// ── Aplicadores ───────────────────────────────────────────────────────────────
// Cada aplicador retorna o conteúdo NOVO (imutável). Em caso de no-op (índice
// fora, campo inválido p/ esse tipo, mínimo de slides), retorna o conteúdo
// inalterado em vez de quebrar.

function withCarouselSlideUpdate(content: Content, slideIndex: number, updater: (slide: import('@/lib/schemas/slide.schema').Slide) => import('@/lib/schemas/slide.schema').Slide): Content {
  if (content.content_type !== 'carrossel') return content
  if (slideIndex < 0 || slideIndex >= content.slides.length) return content
  return {
    ...content,
    slides: content.slides.map((s, i) => (i === slideIndex ? updater(s) : s)),
  }
}

function withFrameDesign(content: Content, slideIndex: number, updater: (d: Layout) => Layout): Content {
  if (content.content_type === 'carrossel') {
    return withCarouselSlideUpdate(content, slideIndex, (s) => ({ ...s, design: updater(s.design ?? DEFAULT_LAYOUT) }))
  }
  if (content.content_type === 'video') return content
  return { ...content, design: updater(content.design ?? DEFAULT_LAYOUT) } as Content
}

function applyCommand(content: Content, cmd: Command): Content {
  const idx = cmd.slideIndex ?? 0
  switch (cmd.kind) {
    case 'setText': {
      if (!cmd.field || cmd.text === null) return content
      if (content.content_type === 'carrossel') {
        return withCarouselSlideUpdate(content, idx, (s) => {
          if (cmd.field === 'cta') {
            const cta = s.cta ? { ...s.cta, text: cmd.text! } : { text: cmd.text!, type: 'engagement' as const }
            return { ...s, cta }
          }
          return { ...s, [cmd.field!]: cmd.text! }
        })
      }
      if (content.content_type === 'anuncio') {
        if (cmd.field === 'body') return { ...content, body: cmd.text }
        if (cmd.field === 'headline') {
          const headlines = [...content.headlines]
          headlines[0] = cmd.text
          return { ...content, headlines }
        }
        return content
      }
      if (cmd.field === 'cta') return content
      return { ...content, [cmd.field]: cmd.text } as Content
    }

    case 'hideField': {
      if (!cmd.field || cmd.hidden === null) return content
      return withFrameDesign(content, idx, (d) => ({
        ...d,
        texts: { ...(d.texts ?? {}), [cmd.field!]: { ...((d.texts ?? {})[cmd.field!] ?? {}), hidden: cmd.hidden! } },
      }))
    }

    case 'setFieldStyle': {
      if (!cmd.field) return content
      return withFrameDesign(content, idx, (d) => {
        const prev = (d.texts ?? {})[cmd.field!] ?? {}
        const next = { ...prev }
        if (cmd.fontSize !== null) next.fontSize = cmd.fontSize
        if (cmd.letterSpacing !== null) next.letterSpacing = cmd.letterSpacing
        if (cmd.lineHeight !== null) next.lineHeight = cmd.lineHeight
        if (cmd.align !== null) next.align = cmd.align
        if (cmd.marginTop !== null) next.marginTop = cmd.marginTop
        if (cmd.marginBottom !== null) next.marginBottom = cmd.marginBottom
        if (cmd.paddingX !== null) next.paddingX = cmd.paddingX
        return { ...d, texts: { ...(d.texts ?? {}), [cmd.field!]: next } }
      })
    }

    case 'duplicateSlide': {
      if (content.content_type !== 'carrossel') return content
      if (idx < 0 || idx >= content.slides.length) return content
      if (content.slides.length >= 10) return content
      const src = content.slides[idx]
      const dup = { ...src, type: 'content' as const }
      const slides = [
        ...content.slides.slice(0, idx + 1),
        dup,
        ...content.slides.slice(idx + 1),
      ].map((s, i) => ({ ...s, index: i + 1 }))
      return { ...content, slides }
    }

    case 'removeSlide': {
      if (content.content_type !== 'carrossel') return content
      if (idx < 0 || idx >= content.slides.length) return content
      if (content.slides.length <= 2) return content
      const slides = content.slides
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, index: i + 1 }))
      return { ...content, slides }
    }

    case 'setBase': {
      if (!cmd.baseId) return content
      const palette = TEMPLATES[cmd.baseId].palette
      const retheme = (d: Layout): Layout =>
        d.background.type === 'solid' ? { ...d, background: { ...d.background, color: palette.background } } : d
      if (content.content_type === 'carrossel') {
        return {
          ...content,
          template_id: cmd.baseId,
          base_id: cmd.baseId,
          slides: content.slides.map((s) => ({ ...s, design: retheme(s.design ?? DEFAULT_LAYOUT) })),
        }
      }
      if (content.content_type === 'video') return content
      return {
        ...content,
        template_id: cmd.baseId,
        base_id: cmd.baseId,
        design: retheme(content.design ?? DEFAULT_LAYOUT),
      } as Content
    }

    case 'setSlideType': {
      if (content.content_type !== 'carrossel') return content
      if (!cmd.slideType) return content
      if (idx < 0 || idx >= content.slides.length) return content
      return {
        ...content,
        slides: content.slides.map((s, i) => (i === idx ? { ...s, type: cmd.slideType! } : s)),
      }
    }

    case 'moveSlide': {
      if (content.content_type !== 'carrossel') return content
      if (cmd.toIndex === null) return content
      const from = idx
      const to = Math.max(0, Math.min(content.slides.length - 1, cmd.toIndex))
      if (from === to || from < 0 || from >= content.slides.length) return content
      const arr = [...content.slides]
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      return { ...content, slides: arr.map((s, i) => ({ ...s, index: i + 1 })) }
    }

    case 'setCaption': {
      // Não muta o Content. A captura do texto é feita em applyCommands.
      return content
    }

    case 'setLogo': {
      const branding = content.branding ?? DEFAULT_BRANDING
      const logo = { ...branding.logo }
      if (cmd.logoShow !== null) logo.show = cmd.logoShow
      if (cmd.logoVariant !== null) logo.variant = cmd.logoVariant
      if (cmd.logoPosition !== null) logo.position = cmd.logoPosition
      return { ...content, branding: { ...branding, logo } } as Content
    }

    case 'setNumbering': {
      const branding = content.branding ?? DEFAULT_BRANDING
      const numbering = { ...branding.numbering }
      if (cmd.numberingShow !== null) numbering.show = cmd.numberingShow
      if (cmd.numberingStyle !== null) numbering.style = cmd.numberingStyle
      if (cmd.numberingPosition !== null) numbering.position = cmd.numberingPosition
      return { ...content, branding: { ...branding, numbering } } as Content
    }

    case 'setHandle': {
      const branding = content.branding ?? DEFAULT_BRANDING
      const handle = { ...branding.handle }
      if (cmd.handleShow !== null) handle.show = cmd.handleShow
      if (cmd.text !== null) handle.name = cmd.text // reusa o campo text pro @handler
      return { ...content, branding: { ...branding, handle } } as Content
    }

    case 'setMedia': {
      return withFrameDesign(content, idx, (d) => {
        const media = { ...d.media }
        if (cmd.mediaKind !== null) media.kind = cmd.mediaKind
        if (cmd.mediaMode !== null) media.mode = cmd.mediaMode
        if (cmd.mediaPosition !== null) media.position = cmd.mediaPosition
        if (cmd.mediaRadius !== null) media.radius = cmd.mediaRadius
        if (cmd.mediaRef !== null) {
          media.ref = cmd.mediaRef
          // Se passou ref e não tinha kind, assume 'image' (atalho do agente).
          if (cmd.mediaKind === null && media.kind === 'none') media.kind = 'image'
        }
        return { ...d, media }
      })
    }

    case 'setMask': {
      return withFrameDesign(content, idx, (d) => {
        const mask = { ...d.mask }
        if (cmd.maskColor !== null) mask.color = cmd.maskColor
        if (cmd.maskOpacity !== null) mask.opacity = cmd.maskOpacity
        if (cmd.maskGradientOn === false) {
          // Tira o degradê — volta a uniforme.
          mask.gradient = undefined
        } else if (
          cmd.maskGradientOn === true ||
          cmd.maskTop !== null ||
          cmd.maskMid !== null ||
          cmd.maskBottom !== null
        ) {
          // Liga/atualiza degradê. Preserva paradas anteriores quando o usuário só mexeu numa.
          mask.gradient = {
            top: cmd.maskTop ?? mask.gradient?.top ?? 0,
            mid: cmd.maskMid ?? mask.gradient?.mid ?? 0.6,
            bottom: cmd.maskBottom ?? mask.gradient?.bottom ?? 1,
          }
        }
        return { ...d, mask }
      })
    }
  }
}

export function applyCommands(content: Content, commands: Command[]): { content: Content; caption: string | null } {
  let next = content
  let caption: string | null = null
  for (const cmd of commands) {
    if (cmd.kind === 'setCaption' && cmd.text !== null) caption = cmd.text
    else next = applyCommand(next, cmd)
  }
  return { content: next, caption }
}

// Resumo human-readable dos comandos aplicados (para log/feedback).
export function summarizeCommands(commands: Command[]): string {
  if (commands.length === 0) return ''
  return commands
    .map((c) => {
      const s = (c.slideIndex ?? 0) + 1
      switch (c.kind) {
        case 'setText':
          return `setText(slide ${s}, ${c.field ?? '?'})`
        case 'hideField':
          return `${c.hidden ? 'hide' : 'show'}(${c.field ?? '?'} @ slide ${s})`
        case 'setFieldStyle':
          return `setFieldStyle(slide ${s}, ${c.field ?? '?'})`
        case 'duplicateSlide':
          return `duplicateSlide(${s})`
        case 'removeSlide':
          return `removeSlide(${s})`
        case 'setBase':
          return `setBase(${c.baseId ?? '?'})`
        case 'setSlideType':
          return `setSlideType(slide ${s}, ${c.slideType ?? '?'})`
        case 'moveSlide':
          return `moveSlide(${s} → ${(c.toIndex ?? 0) + 1})`
        case 'setCaption':
          return `setCaption`
        case 'setLogo':
          return `setLogo(${[c.logoShow !== null ? `show=${c.logoShow}` : null, c.logoVariant, c.logoPosition].filter(Boolean).join(', ') || '?'})`
        case 'setNumbering':
          return `setNumbering(${[c.numberingShow !== null ? `show=${c.numberingShow}` : null, c.numberingStyle, c.numberingPosition].filter(Boolean).join(', ') || '?'})`
        case 'setHandle':
          return `setHandle(${[c.handleShow !== null ? `show=${c.handleShow}` : null, c.text && `name=${c.text}`].filter(Boolean).join(', ') || '?'})`
        case 'setMedia':
          return `setMedia(slide ${s}, ${[c.mediaKind && `kind=${c.mediaKind}`, c.mediaMode && `mode=${c.mediaMode}`, c.mediaPosition && `pos=${c.mediaPosition}`, c.mediaRadius !== null ? `radius=${c.mediaRadius}` : null, c.mediaRef && 'ref'].filter(Boolean).join(', ') || '?'})`
        case 'setMask':
          return `setMask(slide ${s}, ${[c.maskGradientOn === false ? 'uniforme' : c.maskGradientOn === true ? 'degrade' : null, c.maskTop !== null ? `top=${c.maskTop}` : null, c.maskMid !== null ? `mid=${c.maskMid}` : null, c.maskBottom !== null ? `bot=${c.maskBottom}` : null, c.maskOpacity !== null ? `op=${c.maskOpacity}` : null, c.maskColor && `color=${c.maskColor}`].filter(Boolean).join(', ') || '?'})`
      }
    })
    .join(', ')
}
