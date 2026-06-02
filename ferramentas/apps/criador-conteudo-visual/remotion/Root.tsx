import { Composition } from 'remotion'
import { ReelComposition, type ReelProps } from './ReelComposition'
import { buildEditPlan } from '@/lib/video/edit-plan'
import { VideoStyleSchema, VideoEditSchema } from '@/lib/schemas/content.schema'

const FPS = 30

const defaultProps: ReelProps = {
  videoSrc: '',
  sourceDuration: 8,
  transcript: null,
  edit: VideoEditSchema.parse({}),
  style: VideoStyleSchema.parse({}),
}

function stingFrames(enabled: boolean, ms: number) {
  return enabled ? Math.round((ms / 1000) * FPS) : 0
}

export function RemotionRoot() {
  return (
    <Composition
      id="Reel"
      component={ReelComposition}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={300}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const cuts = props.edit.enabled ? props.edit.cuts : []
        const plan = buildEditPlan(props.transcript?.words ?? [], props.sourceDuration, cuts)
        const introF = stingFrames(props.style.intro.enabled, props.style.intro.durationMs)
        const outroF = stingFrames(props.style.outro.enabled, props.style.outro.durationMs)
        const mainF = Math.max(1, Math.round(plan.outDuration * FPS))
        return { durationInFrames: introF + mainF + outroF, fps: FPS }
      }}
    />
  )
}
