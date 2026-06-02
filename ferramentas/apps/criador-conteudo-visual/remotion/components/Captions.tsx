import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { SAFE } from '../brand'
import type { VideoStyle } from '@/lib/schemas/content.schema'

type CaptionWord = { text: string; start: number; end: number }
type Props = { words: CaptionWord[]; style: VideoStyle['caption'] }

// Legenda palavra-timestamped sobre o footage. As palavras já vêm re-cronometradas
// para a timeline de saída (após os cortes). Mostra a janela que contém a palavra ativa.
export function Captions({ words, style }: Props) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const t = frame / fps

  if (!style.enabled || words.length === 0) return null

  // índice da palavra ativa (ou a última que já começou, em pausas)
  let active = words.findIndex((w) => t >= w.start && t < w.end)
  if (active === -1) {
    for (let i = words.length - 1; i >= 0; i--) {
      if (t >= words[i].start) { active = i; break }
    }
  }
  if (active === -1) return null // antes da primeira palavra
  if (t > words[words.length - 1].end + 0.4) return null // some após o fim

  const groupSize = style.maxWordsPerLine
  const gStart = Math.floor(active / groupSize) * groupSize
  const group = words.slice(gStart, gStart + groupSize)

  const justify = style.position === 'top' ? 'flex-start' : style.position === 'middle' ? 'center' : 'flex-end'
  const fontWeight = style.weight === 'extrabold' ? 800 : 700

  // fade: opacidade do grupo ao trocar de janela
  const groupStartFrame = (words[gStart]?.start ?? 0) * fps
  const fade = style.animation === 'fade' ? interpolate(frame - groupStartFrame, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: justify,
        justifyContent: 'center',
        padding: `${SAFE.PAD * 2.2}px ${SAFE.PAD}px`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '88%',
          textAlign: 'center',
          fontFamily: 'Sora, sans-serif',
          fontWeight,
          fontSize: style.fontSize,
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          opacity: fade,
          // ajuste fino: desloca da posição-âncora (X/Y em fração de meio-frame)
          transform: `translate(${style.offsetX * width * 0.5}px, ${style.offsetY * height * 0.5}px)`,
          ...(style.box
            ? { background: 'rgba(0,0,0,0.65)', borderRadius: 24, padding: '18px 28px' }
            : { textShadow: '0 4px 18px rgba(0,0,0,0.55)' }),
        }}
      >
        {group.map((w, i) => {
          const isActive = gStart + i === active
          const color = isActive ? style.activeColor : style.textColor
          let scale = 1
          if (isActive && style.animation === 'pop') {
            scale = spring({ frame: frame - w.start * fps, fps, config: { damping: 12, stiffness: 200 }, durationInFrames: 12 })
            scale = 0.9 + scale * 0.25
          }
          const text = style.uppercase ? w.text.toUpperCase() : w.text
          return (
            <span
              key={`${gStart + i}`}
              style={{
                color,
                display: 'inline-block',
                margin: '0 0.18em',
                transform: `scale(${scale})`,
                transition: 'none',
              }}
            >
              {text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
