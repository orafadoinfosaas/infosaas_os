import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { BRAND } from '../brand'

type Props = { text: string; kind: 'intro' | 'outro' }

// Sting de marca (intro/outro): fundo laranja, símbolo branco entrando com mola
// e texto em Sora ExtraBold. Curto e direto, no padrão Infosaas®.
export function Sting({ text }: Props) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 180 }, durationInFrames: 18 })
  const scale = 0.6 + enter * 0.4
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })

  return (
    <AbsoluteFill style={{ background: BRAND.orange, alignItems: 'center', justifyContent: 'center', opacity: out }}>
      <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <Img src={staticFile('brand/simbolo-branco.svg')} style={{ width: 240, height: 'auto' }} />
        {text ? (
          <div
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: 64,
              color: BRAND.white,
              textAlign: 'center',
              letterSpacing: '-0.02em',
              maxWidth: 820,
              lineHeight: 1.05,
            }}
          >
            {text}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  )
}
