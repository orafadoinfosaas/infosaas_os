import { useMemo } from 'react'
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion'
import type { VideoStyle } from '@/lib/schemas/content.schema'
import type { Segment, Zoom } from '@/lib/video/edit-plan'

type Props = { src: string; segments: Segment[]; footage: VideoStyle['footage']; zooms: Zoom[] }

const ZOOM_RAMP = 0.4 // segundos de entrada/saída do zoom

function smoothstep(k: number) {
  const c = Math.max(0, Math.min(1, k))
  return c * c * (3 - 2 * c)
}

// Jump cuts sem black frame: UM único OffthreadVideo com `trimBefore` recalculado
// por frame (técnica oficial do Remotion). Vários OffthreadVideo em <Series>
// piscavam preto no seek de cada trecho.
export function FootageTrack({ src, segments, footage, zooms }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const sections = useMemo(
    () => segments.map((s) => ({ before: Math.round(s.start * fps), after: Math.round(s.end * fps) })),
    [segments, fps]
  )

  // Mapeia o frame de saída → offset de trimBefore na fonte.
  const trimBefore = useMemo(() => {
    let summed = 0
    for (const sec of sections) {
      summed += sec.after - sec.before
      if (summed > frame) return Math.max(0, sec.after - summed)
    }
    return sections.length ? sections[sections.length - 1].before : 0
  }, [frame, sections])

  if (!src || sections.length === 0) return null

  // Zoom: tempo de fonte atual = trimBefore + frame local; acha região ativa e
  // interpola a escala com ease-in/out.
  const tSource = (trimBefore + frame) / fps
  let zScale = 1
  let zx = 0
  let zy = 0
  for (const z of zooms) {
    if (tSource >= z.start && tSource < z.end) {
      const env = smoothstep(Math.min((tSource - z.start) / ZOOM_RAMP, (z.end - tSource) / ZOOM_RAMP))
      zScale = 1 + (z.scale - 1) * env
      zx = z.x * env
      zy = z.y * env
      break
    }
  }

  const mainStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: footage.fit,
    objectPosition: `${50 + footage.x * 50}% ${50 + footage.y * 50}%`,
    transform: `scale(${footage.zoom * zScale}) translate(${zx * 12}%, ${zy * 12}%)`,
  }

  return (
    <AbsoluteFill style={{ background: footage.bg }}>
      {footage.fit === 'contain' && footage.blurBg && (
        <OffthreadVideo
          src={src}
          muted
          trimBefore={trimBefore}
          acceptableTimeShiftInSeconds={0.1}
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px)', transform: 'scale(1.15)' }}
        />
      )}
      <OffthreadVideo
        src={src}
        trimBefore={trimBefore}
        acceptableTimeShiftInSeconds={0.1}
        volume={Math.pow(10, footage.volumeDb / 20)}
        style={mainStyle}
      />
    </AbsoluteFill>
  )
}
