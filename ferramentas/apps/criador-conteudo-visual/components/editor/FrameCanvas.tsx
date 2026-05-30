'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { waitForFonts } from '@/lib/renderer/font-ready'
import { BRAND_PAD, type RichSpec, type RichBadge, type RichLogo, type RichMedia, type RichMask } from '@/lib/renderer/compose'

function useImage(src: string | null): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement>()
  useEffect(() => {
    if (!src) {
      setImg(undefined)
      return
    }
    const el = new window.Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => setImg(el)
    el.src = src
  }, [src])
  return img
}

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

function MaskRect({ mask, w, h }: { mask: RichMask; w: number; h: number }) {
  if (mask.gradient) {
    const { top, mid, bottom } = mask.gradient
    return (
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        listening={false}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: h }}
        fillLinearGradientColorStops={[
          0, hexToRgba(mask.color, top),
          0.5, hexToRgba(mask.color, mid),
          1, hexToRgba(mask.color, bottom),
        ]}
      />
    )
  }
  return <Rect x={0} y={0} width={w} height={h} fill={mask.color} opacity={mask.opacity} listening={false} />
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

function MediaImage({ media, w, h }: { media: RichMedia; w: number; h: number }) {
  const img = useImage(media.src)
  if (!img) return null
  const box = media.box ?? { x: 0, y: 0, w, h }
  const iw = img.naturalWidth || box.w
  const ih = img.naturalHeight || box.h
  // 'cover' preenche o box recortando o excedente; 'contain' cabe inteiro. Sem esticar.
  const s = media.fit === 'contain' ? Math.min(box.w / iw, box.h / ih) : Math.max(box.w / iw, box.h / ih)
  const dw = iw * s
  const dh = ih * s
  const dx = box.x + (box.w - dw) / 2
  const dy = box.y + (box.h - dh) / 2
  const image = <KonvaImage image={img} x={dx} y={dy} width={dw} height={dh} listening={false} />
  // raio > 0 → recorte arredondado; senão recorte retangular do box
  if (media.radius > 0) {
    return <Group clipFunc={(ctx) => roundedRectPath(ctx, box.x, box.y, box.w, box.h, media.radius)}>{image}</Group>
  }
  return (
    <Group clipX={box.x} clipY={box.y} clipWidth={box.w} clipHeight={box.h}>
      {image}
    </Group>
  )
}

function BrandLogo({ logo, w, h }: { logo: RichLogo; w: number; h: number }) {
  const img = useImage(logo.src)
  if (!img) return null
  const lw = logo.height * (img.naturalWidth / img.naturalHeight || 4)
  const x = logo.position.endsWith('right') ? w - BRAND_PAD - lw : BRAND_PAD
  const y = logo.position.startsWith('top') ? BRAND_PAD : h - BRAND_PAD - logo.height
  return <KonvaImage image={img} x={x} y={y} width={lw} height={logo.height} listening={false} />
}

function Badge({ badge, w, h }: { badge: RichBadge; w: number; h: number }) {
  const corner = badge.corner
  const align = corner.endsWith('right') ? 'right' : corner.endsWith('center') ? 'center' : 'left'
  const y = corner.startsWith('top') ? BRAND_PAD : h - BRAND_PAD - badge.fontSize
  return (
    <Text
      text={badge.text}
      x={BRAND_PAD}
      y={y}
      width={w - BRAND_PAD * 2}
      align={align}
      fontSize={badge.fontSize}
      fontFamily="Sora"
      fontStyle="bold"
      fill={badge.fill}
      listening={false}
    />
  )
}

type Props = {
  spec: RichSpec
  scale?: number
  selectedField?: string | null
  onFieldClick?: (id: string) => void
  stageRef?: React.RefObject<Konva.Stage | null>
}

export function FrameCanvas({ spec, scale = 1, selectedField, onFieldClick, stageRef }: Props) {
  const [, force] = useState(0)
  useEffect(() => {
    waitForFonts().then(() => force((n) => n + 1))
  }, [])

  const { width, height } = spec
  const sw = Math.round(width * scale)
  const sh = Math.round(height * scale)

  const grad = spec.background.type === 'gradient' ? gradientPoints(width, height, spec.background.angle) : null

  return (
    <Stage width={sw} height={sh} ref={stageRef} style={{ display: 'block' }}>
      <Layer scaleX={scale} scaleY={scale}>
        {/* Background */}
        {spec.background.type === 'solid' ? (
          <Rect x={0} y={0} width={width} height={height} fill={spec.background.color} />
        ) : (
          grad && (
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fillLinearGradientStartPoint={grad.start}
              fillLinearGradientEndPoint={grad.end}
              fillLinearGradientColorStops={[0, spec.background.from, 1, spec.background.to]}
            />
          )
        )}

        {/* Mídia */}
        {spec.media && <MediaImage media={spec.media} w={width} h={height} />}

        {/* Máscara */}
        {spec.mask && <MaskRect mask={spec.mask} w={width} h={height} />}

        {/* Textos */}
        {spec.texts.map((t) => (
          <Text
            key={t.id}
            text={t.text}
            x={t.x}
            y={t.y}
            width={t.width}
            fontSize={t.fontSize}
            fontStyle={t.fontStyle}
            fontFamily={t.fontFamily}
            fill={t.fill}
            lineHeight={t.lineHeight}
            letterSpacing={t.letterSpacing}
            align={t.align}
            wrap="word"
            onClick={onFieldClick ? () => onFieldClick(t.id) : undefined}
            onTap={onFieldClick ? () => onFieldClick(t.id) : undefined}
            listening={!!onFieldClick}
          />
        ))}

        {/* Marca */}
        {spec.logo && <BrandLogo logo={spec.logo} w={width} h={height} />}
        {spec.badges.map((b) => (
          <Badge key={b.id} badge={b} w={width} h={height} />
        ))}

        {/* Seleção */}
        {selectedField &&
          spec.fieldAreas
            .filter((a) => a.fieldId === selectedField)
            .map((a) => (
              <Rect
                key={`sel-${a.fieldId}`}
                x={a.x - 6}
                y={a.y - 6}
                width={a.width + 12}
                height={a.height + 12}
                stroke="#FF3D00"
                strokeWidth={2 / scale}
                dash={[8 / scale, 4 / scale]}
                listening={false}
              />
            ))}
      </Layer>
    </Stage>
  )
}
