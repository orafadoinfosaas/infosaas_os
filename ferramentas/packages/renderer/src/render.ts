import Konva from 'konva'
import { BRAND_PAD, type RichSpec } from './compose.js'

// Renderer imperativo (Konva, sem React) do RichSpec — espelha 1:1 o FrameCanvas do
// editor, então o desenho no chat é idêntico ao do app. compose.ts faz o layout
// (a parte difícil); aqui é só desenhar.

function gradientPoints(w: number, h: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  const cx = w / 2
  const cy = h / 2
  const half = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2
  const dx = Math.cos(rad) * half
  const dy = Math.sin(rad) * half
  return { start: { x: cx - dx, y: cy - dy }, end: { x: cx + dx, y: cy + dy } }
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// No iframe não há origem do app: caminhos /brand/logo-X.svg não resolvem. O build
// embute os logos em window.__INFOSAAS_BRAND__ (por nome de arquivo) — mapeamos aqui.
function resolveBrand(src: string): string {
  const map = (globalThis as unknown as { __INFOSAAS_BRAND__?: Record<string, string> }).__INFOSAAS_BRAND__
  const file = src.match(/([^/]+\.svg)$/)?.[1]
  if (file && map && map[file]) return map[file]
  return src
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = () => resolve(null)
    el.src = src
  })
}

function roundedRectPath(ctx: Konva.Context, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Desenha o RichSpec num container DOM (div). Devolve o Stage (destrua antes de redesenhar). */
export async function renderSpec(container: HTMLDivElement, spec: RichSpec, scale: number): Promise<Konva.Stage> {
  const { width, height } = spec
  const sw = Math.round(width * scale)
  const sh = Math.round(height * scale)

  const stage = new Konva.Stage({ container, width: sw, height: sh })
  const layer = new Konva.Layer({ scaleX: scale, scaleY: scale })
  stage.add(layer)

  // Background
  if (spec.background.type === 'solid') {
    layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: spec.background.color, listening: false }))
  } else {
    const g = gradientPoints(width, height, spec.background.angle)
    layer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width,
        height,
        fillLinearGradientStartPoint: g.start,
        fillLinearGradientEndPoint: g.end,
        fillLinearGradientColorStops: [0, spec.background.from, 1, spec.background.to],
        listening: false,
      }),
    )
  }

  // Mídia
  if (spec.media) {
    const img = await loadImage(spec.media.src)
    if (img) {
      const box = spec.media.box ?? { x: 0, y: 0, w: width, h: height }
      const iw = img.naturalWidth || box.w
      const ih = img.naturalHeight || box.h
      const s = spec.media.fit === 'contain' ? Math.min(box.w / iw, box.h / ih) : Math.max(box.w / iw, box.h / ih)
      const dw = iw * s
      const dh = ih * s
      const dx = box.x + (box.w - dw) / 2
      const dy = box.y + (box.h - dh) / 2
      const kimg = new Konva.Image({ image: img, x: dx, y: dy, width: dw, height: dh, listening: false })
      const radius = spec.media.radius
      const group =
        radius > 0
          ? new Konva.Group({ clipFunc: (ctx: Konva.Context) => roundedRectPath(ctx, box.x, box.y, box.w, box.h, radius) })
          : new Konva.Group({ clipX: box.x, clipY: box.y, clipWidth: box.w, clipHeight: box.h })
      group.add(kimg)
      layer.add(group)
    }
  }

  // Máscara
  if (spec.mask) {
    if (spec.mask.gradient) {
      const { top, mid, bottom } = spec.mask.gradient
      layer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width,
          height,
          listening: false,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: height },
          fillLinearGradientColorStops: [
            0,
            hexToRgba(spec.mask.color, top),
            0.5,
            hexToRgba(spec.mask.color, mid),
            1,
            hexToRgba(spec.mask.color, bottom),
          ],
        }),
      )
    } else {
      layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: spec.mask.color, opacity: spec.mask.opacity, listening: false }))
    }
  }

  // Textos
  for (const t of spec.texts) {
    layer.add(
      new Konva.Text({
        text: t.text,
        x: t.x,
        y: t.y,
        width: t.width,
        fontSize: t.fontSize,
        fontStyle: t.fontStyle,
        // fallback sans-serif (espelha a medição do compose) — sem isso o canvas cai num serif default
        fontFamily: `"${t.fontFamily}", sans-serif`,
        fill: t.fill,
        lineHeight: t.lineHeight,
        letterSpacing: t.letterSpacing,
        align: t.align,
        wrap: 'word',
        listening: false,
      }),
    )
  }

  // Logo
  if (spec.logo) {
    const img = await loadImage(resolveBrand(spec.logo.src))
    if (img) {
      const lw = spec.logo.height * (img.naturalWidth / img.naturalHeight || 4)
      const x = spec.logo.position.endsWith('right') ? width - BRAND_PAD - lw : BRAND_PAD
      const y = spec.logo.position.startsWith('top') ? BRAND_PAD : height - BRAND_PAD - spec.logo.height
      layer.add(new Konva.Image({ image: img, x, y, width: lw, height: spec.logo.height, listening: false }))
    }
  }

  // Badges (numeração / handle)
  for (const b of spec.badges) {
    const align = b.corner.endsWith('right') ? 'right' : b.corner.endsWith('center') ? 'center' : 'left'
    const y = b.corner.startsWith('top') ? BRAND_PAD : height - BRAND_PAD - b.fontSize
    layer.add(
      new Konva.Text({
        text: b.text,
        x: BRAND_PAD,
        y,
        width: width - BRAND_PAD * 2,
        align,
        fontSize: b.fontSize,
        fontFamily: '"Sora", sans-serif',
        fontStyle: 'bold',
        fill: b.fill,
        listening: false,
      }),
    )
  }

  layer.draw()
  return stage
}
