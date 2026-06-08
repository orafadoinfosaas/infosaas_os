import { getTemplate, DEFAULT_LAYOUT, DEFAULT_BRANDING } from '@infosaas/content'
import type { Content, Layout, Branding } from '@infosaas/content'

const PAD = 72
const BRAND_PAD = 48
const LOGO_H = 40 // altura da logo (deve casar com RichLogo.height)
const BADGE_FS = 26 // fontSize de numeração/handle
const SAFE_GAP = 44 // respiro entre a faixa de marca e o texto

// Bases de URL — parametrizáveis. No app (editor) os defaults relativos funcionam;
// no iframe (chat) NÃO existe o domínio do app, então passe URLs ABSOLUTAS aqui
// (ex.: assetBase = R2/MCP, brandBase = MCP servindo /brand).
export type ComposeOpts = {
  assetBase?: string // default: /api/assets
  brandBase?: string // default: /brand
}

// ── Densidade tipográfica por slide (spec Instagram) ──────────────────────────
type SlideTypo = { headlineSize: number; subSize: number; bodySize: number; order: 'headline-first' | 'body-first' }

const COVER_TYPO: SlideTypo = { headlineSize: 80, subSize: 40, bodySize: 40, order: 'headline-first' }

const CONTENT_PATTERNS: SlideTypo[] = [
  { headlineSize: 70, subSize: 40, bodySize: 40, order: 'headline-first' }, // b.1
  { headlineSize: 80, subSize: 40, bodySize: 60, order: 'headline-first' }, // b.2
  { headlineSize: 80, subSize: 40, bodySize: 60, order: 'body-first' }, // b.3
  { headlineSize: 70, subSize: 40, bodySize: 40, order: 'headline-first' }, // b.4
  { headlineSize: 70, subSize: 40, bodySize: 40, order: 'headline-first' }, // b.5
]

function slideTypo(content: Content, index: number): SlideTypo | null {
  if (content.content_type === 'anuncio') return null
  if (content.content_type !== 'carrossel') return COVER_TYPO
  const slide = content.slides[index]
  if (!slide || slide.type === 'cover' || slide.type === 'closing') return COVER_TYPO
  const contentIdx = content.slides.slice(0, index).filter((s) => s.type === 'content').length
  return CONTENT_PATTERNS[contentIdx % CONTENT_PATTERNS.length]
}

export type RichText = {
  id: string
  text: string
  x: number
  y: number
  width: number
  fontSize: number
  fontStyle: 'normal' | 'bold'
  fontFamily: string
  fill: string
  lineHeight: number
  letterSpacing: number
  align: 'left' | 'center' | 'right'
}
export type RichBackground = { type: 'solid'; color: string } | { type: 'gradient'; from: string; to: string; angle: number }
export type RichBox = { x: number; y: number; w: number; h: number }
export type RichMedia = { src: string; box: RichBox | null; fit: 'cover' | 'contain'; radius: number }
export type RichMaskGradient = { top: number; mid: number; bottom: number }
export type RichMask = { color: string; opacity: number; gradient: RichMaskGradient | null }
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center'
export type RichLogo = { src: string; position: Branding['logo']['position']; height: number }
export type RichBadge = { id: string; text: string; corner: Corner; fontSize: number; fill: string }
export type RichSpec = {
  width: number
  height: number
  background: RichBackground
  media: RichMedia | null
  mask: RichMask | null
  texts: RichText[]
  logo: RichLogo | null
  badges: RichBadge[]
  fieldAreas: { fieldId: string; x: number; y: number; width: number; height: number }[]
}

function weightOf(w: number): 'normal' | 'bold' {
  return w >= 600 ? 'bold' : 'normal'
}

let _measureCtx: CanvasRenderingContext2D | null | undefined
function measureCtx(): CanvasRenderingContext2D | null {
  if (_measureCtx !== undefined) return _measureCtx
  _measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
  return _measureCtx
}

function lineWidth(ctx: CanvasRenderingContext2D, text: string, letterSpacing: number): number {
  return ctx.measureText(text).width + letterSpacing * Math.max(0, text.length - 1)
}

function countLines(text: string, fontSize: number, weight: number, family: string, letterSpacing: number, maxWidth: number): number {
  const ctx = measureCtx()
  const style = weight >= 600 ? 'bold' : 'normal'
  if (ctx) ctx.font = `${style} ${fontSize}px "${family}", sans-serif`
  let lines = 0
  for (const para of text.split('\n')) {
    if (para.length === 0) {
      lines += 1
      continue
    }
    if (!ctx) {
      const perLine = Math.max(1, Math.floor(maxWidth / (fontSize * 0.52)))
      lines += Math.ceil(para.length / perLine)
      continue
    }
    const words = para.split(/\s+/).filter(Boolean)
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (line && lineWidth(ctx, test, letterSpacing) > maxWidth) {
        lines += 1
        line = w
      } else {
        line = test
      }
    }
    if (line) lines += 1
  }
  return Math.max(1, lines)
}

function blockHeight(text: string, fontSize: number, weight: number, family: string, letterSpacing: number, lineHeight: number, maxWidth: number): number {
  if (!text) return 0
  return countLines(text, fontSize, weight, family, letterSpacing, maxWidth) * fontSize * lineHeight
}

function assetUrl(slug: string | undefined, ref: string, assetBase: string): string {
  if (/^https?:\/\//.test(ref)) return ref
  return `${assetBase}/${slug ?? 'preview'}/${ref}`
}

type FrameText = { headline: string; subheadline: string; body: string; cta: string | null }

function frameOf(content: Content, index: number): { text: FrameText; design: Layout } {
  if (content.content_type === 'carrossel') {
    const s = content.slides[index]
    return {
      text: { headline: s.headline, subheadline: s.subheadline, body: s.body, cta: s.cta?.text ?? null },
      design: s.design ?? DEFAULT_LAYOUT,
    }
  }
  if (content.content_type === 'anuncio') {
    return {
      text: { headline: content.headlines[0] ?? '', subheadline: '', body: content.body, cta: null },
      design: content.design ?? DEFAULT_LAYOUT,
    }
  }
  if (content.content_type === 'video') {
    return { text: { headline: '', subheadline: '', body: '', cta: null }, design: DEFAULT_LAYOUT }
  }
  return {
    text: { headline: content.headline, subheadline: content.subheadline, body: content.body, cta: null },
    design: content.design ?? DEFAULT_LAYOUT,
  }
}

export function composeFrame(
  content: Content,
  index: number,
  slug: string | undefined,
  activeHeadline = 0,
  opts: ComposeOpts = {},
): RichSpec {
  const assetBase = opts.assetBase ?? '/api/assets'
  const brandBase = opts.brandBase ?? '/brand'
  const template = getTemplate(content.template_id)
  const { width, height } = content.format
  const branding: Branding = content.branding ?? DEFAULT_BRANDING
  const { text, design } = frameOf(content, index)

  if (content.content_type === 'anuncio') {
    text.headline = content.headlines[activeHeadline] ?? content.headlines[0] ?? ''
  }

  const hasImage = design.media.kind === 'image' && !!design.media.ref
  const isCover = hasImage && design.media.mode === 'cover'
  const isElement = hasImage && design.media.mode === 'element'
  const onMedia = isCover
  const fillPrimary = onMedia ? '#FFFFFF' : template.palette.text_primary
  const fillSecondary = onMedia ? 'rgba(255,255,255,0.85)' : template.palette.text_secondary

  const background: RichBackground =
    design.background.type === 'gradient' && design.background.gradient
      ? {
          type: 'gradient',
          from: design.background.gradient.from,
          to: design.background.gradient.to,
          angle: design.background.gradient.angle,
        }
      : { type: 'solid', color: design.background.color }

  const maskGrad = design.mask.gradient ?? null
  const maskVisible = isCover && (maskGrad ? true : design.mask.opacity > 0)
  const mask: RichMask | null = maskVisible
    ? { color: design.mask.color, opacity: design.mask.opacity, gradient: maskGrad }
    : null

  const LOGO_FILE: Record<Branding['logo']['variant'], string> = {
    preto: 'black',
    branco: 'branco',
    laranja: 'laranja',
  }
  const logo: RichLogo | null = branding.logo.show
    ? { src: `${brandBase}/logo-${LOGO_FILE[branding.logo.variant]}.svg`, position: branding.logo.position, height: LOGO_H }
    : null

  const brandFill = onMedia ? '#FFFFFF' : '#000000'
  const badges: RichBadge[] = []
  if (branding.numbering.show && content.content_type === 'carrossel') {
    const totalSlides = content.slides.length
    const txt = branding.numbering.style === 'fraction' ? `${index + 1}/${totalSlides}` : String(index + 1).padStart(2, '0')
    badges.push({ id: 'numbering', text: txt, corner: branding.numbering.position, fontSize: BADGE_FS, fill: brandFill })
  }
  if (branding.handle.show && branding.handle.name) {
    badges.push({ id: 'handle', text: branding.handle.name, corner: 'bottom-left', fontSize: BADGE_FS, fill: onMedia ? '#FFFFFF' : branding.handle.color })
  }

  const logoTop = !!logo && logo.position.startsWith('top')
  const logoBottom = !!logo && logo.position.startsWith('bottom')
  const badgeTop = badges.some((b) => b.corner.startsWith('top'))
  const badgeBottom = badges.some((b) => !b.corner.startsWith('top'))
  const topElemH = Math.max(logoTop ? LOGO_H : 0, badgeTop ? BADGE_FS : 0)
  const botElemH = Math.max(logoBottom ? LOGO_H : 0, badgeBottom ? BADGE_FS : 0)
  const safeTop = topElemH > 0 ? Math.max(PAD, BRAND_PAD + topElemH + SAFE_GAP) : PAD
  const safeBottom = botElemH > 0 ? Math.max(PAD, BRAND_PAD + botElemH + SAFE_GAP) : PAD

  const elementPos = design.media.position ?? 'top'
  const elementInline = isElement && elementPos === 'middle'
  let elementBox: RichBox | null = null
  let areaTop = safeTop
  let areaBottom = height - safeBottom
  if (isElement && !elementInline) {
    const elH = Math.round((areaBottom - areaTop) * 0.52)
    if (elementPos === 'bottom') {
      elementBox = { x: PAD, y: areaBottom - elH, w: width - PAD * 2, h: elH }
      areaBottom = elementBox.y - 40
    } else {
      elementBox = { x: PAD, y: areaTop, w: width - PAD * 2, h: elH }
      areaTop = elementBox.y + elH + 40
    }
  }

  const maxWidth = width - PAD * 2
  const typo = template.typography
  const tx = design.texts ?? {}
  const frameAlign = design.align.horizontal

  type Block = {
    id: string; text: string; size: number; weight: number; fill: string
    lh: number; ls: number; align: 'left' | 'center' | 'right'; font: string
    mt: number; mb: number; px: number
  }
  const blocks: Block[] = []
  function pushBlock(id: string, raw: string, baseSize: number, weight: number, fill: string, baseLh: number) {
    if (!raw) return
    const ov = tx[id] ?? {}
    if (ov.hidden) return
    blocks.push({
      id,
      text: raw.replace(/<br\s*\/?>/gi, '\n'),
      size: ov.fontSize ?? baseSize,
      weight,
      fill,
      lh: ov.lineHeight ?? baseLh,
      ls: ov.letterSpacing ?? 0,
      align: ov.align ?? frameAlign,
      font: ov.fontFamily ?? typo.font_family,
      mt: ov.marginTop ?? 0,
      mb: ov.marginBottom ?? 0,
      px: ov.paddingX ?? 0,
    })
  }
  const st = slideTypo(content, index)
  const hSize = st ? st.headlineSize : typo.headline.size
  const subSize = st ? st.subSize : typo.subheadline.size
  const bSize = st ? st.bodySize : typo.body.size
  const headlineFn = () => pushBlock('headline', text.headline, hSize, typo.headline.weight, fillPrimary, typo.headline.line_height ?? 1.1)
  const subFn = () => pushBlock('subheadline', text.subheadline, subSize, typo.subheadline.weight, fillSecondary, 1.3)
  const bodyFn = () => pushBlock('body', text.body, bSize, typo.body.weight, fillSecondary, typo.body.line_height ?? 1.55)

  if (st?.order === 'body-first') {
    bodyFn()
    headlineFn()
    subFn()
  } else {
    headlineFn()
    subFn()
    bodyFn()
  }
  pushBlock('cta', text.cta ?? '', typo.cta?.size ?? 20, typo.cta?.weight ?? 700, template.palette.accent, 1.3)

  const gap = 18
  const heights = blocks.map((b) => blockHeight(b.text, b.size, b.weight, b.font, b.ls, b.lh, maxWidth - 2 * b.px))

  type Item = { kind: 'text'; bi: number } | { kind: 'image' }
  const items: Item[] = []
  const inlineImgH = elementInline ? Math.round((areaBottom - areaTop) * 0.42) : 0
  if (elementInline) {
    const hIdx = blocks.findIndex((b) => b.id === 'headline')
    if (hIdx === -1) items.push({ kind: 'image' })
    blocks.forEach((_, i) => {
      items.push({ kind: 'text', bi: i })
      if (i === hIdx) items.push({ kind: 'image' })
    })
  } else {
    blocks.forEach((_, i) => items.push({ kind: 'text', bi: i }))
  }

  const itemHeights = items.map((it) => (it.kind === 'image' ? inlineImgH : heights[it.bi]))
  const marginsSum = blocks.reduce((a, b) => a + b.mt + b.mb, 0)
  const total = itemHeights.reduce((a, b) => a + b, 0) + gap * Math.max(0, items.length - 1) + marginsSum

  let cursorY: number
  if (design.align.vertical === 'top') cursorY = areaTop
  else if (design.align.vertical === 'bottom') cursorY = areaBottom - total
  else cursorY = areaTop + (areaBottom - areaTop - total) / 2
  if (cursorY < areaTop) cursorY = areaTop

  const texts: RichText[] = []
  const fieldAreas: RichSpec['fieldAreas'] = []
  items.forEach((it, k) => {
    const h = itemHeights[k]
    if (it.kind === 'image') {
      elementBox = { x: PAD, y: cursorY, w: maxWidth, h }
      cursorY += h + gap
    } else {
      const b = blocks[it.bi]
      cursorY += b.mt
      const x = PAD + b.px
      const w = maxWidth - 2 * b.px
      texts.push({
        id: b.id,
        text: b.text,
        x,
        y: cursorY,
        width: w,
        fontSize: b.size,
        fontStyle: weightOf(b.weight),
        fontFamily: b.font,
        fill: b.fill,
        lineHeight: b.lh,
        letterSpacing: b.ls,
        align: b.align,
      })
      fieldAreas.push({ fieldId: b.id, x, y: cursorY, width: w, height: h })
      cursorY += h + b.mb + gap
    }
  })

  const media: RichMedia | null = isCover
    ? { src: assetUrl(slug, design.media.ref, assetBase), box: null, fit: design.media.fit, radius: 0 }
    : isElement
      ? { src: assetUrl(slug, design.media.ref, assetBase), box: elementBox, fit: design.media.fit, radius: design.media.radius ?? 0 }
      : null

  return { width, height, background, media, mask, texts, logo, badges, fieldAreas }
}

export { BRAND_PAD }
