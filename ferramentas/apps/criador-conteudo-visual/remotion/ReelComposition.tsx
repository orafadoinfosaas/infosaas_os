import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion'
import { ensureFonts, BRAND } from './brand'
import { FootageTrack } from './components/FootageTrack'
import { Captions } from './components/Captions'
import { LogoOverlay } from './components/LogoOverlay'
import { Sting } from './components/Sting'
import { buildEditPlan } from '@/lib/video/edit-plan'
import type { VideoStyle, VideoEdit, Transcript } from '@/lib/schemas/content.schema'

export type ReelProps = {
  videoSrc: string
  sourceDuration: number
  transcript: Transcript | null
  edit: VideoEdit
  style: VideoStyle
}

function framesFor(ms: number, fps: number) {
  return Math.max(1, Math.round((ms / 1000) * fps))
}

export function ReelComposition({ videoSrc, sourceDuration, transcript, edit, style }: ReelProps) {
  ensureFonts()
  const { fps } = useVideoConfig()

  const cuts = edit.enabled ? edit.cuts : []
  const plan = buildEditPlan(transcript?.words ?? [], sourceDuration, cuts)
  const captionWords = plan.outWords.map((w) => ({ text: w.text, start: w.outStart, end: w.outEnd }))

  const introF = style.intro.enabled ? framesFor(style.intro.durationMs, fps) : 0
  const outroF = style.outro.enabled ? framesFor(style.outro.durationMs, fps) : 0
  const mainF = Math.max(1, Math.round(plan.outDuration * fps))

  return (
    <AbsoluteFill style={{ background: BRAND.black }}>
      {introF > 0 && (
        <Sequence durationInFrames={introF}>
          <Sting kind="intro" text={style.intro.text} />
        </Sequence>
      )}

      <Sequence from={introF} durationInFrames={mainF}>
        <AbsoluteFill>
          <FootageTrack src={videoSrc} segments={plan.segments} footage={style.footage} zooms={edit.zooms} />
          <Captions words={captionWords} style={style.caption} />
          <LogoOverlay style={style.logo} />
        </AbsoluteFill>
      </Sequence>

      {outroF > 0 && (
        <Sequence from={introF + mainF} durationInFrames={outroF}>
          <Sting kind="outro" text={style.outro.text} />
        </Sequence>
      )}
    </AbsoluteFill>
  )
}
