import { Img, staticFile } from 'remotion'
import { SAFE, LOGO_FILE } from '../brand'
import type { VideoStyle } from '@/lib/schemas/content.schema'

type Props = { style: VideoStyle['logo'] }

export function LogoOverlay({ style }: Props) {
  if (!style.enabled) return null

  const src = staticFile(`brand/logo-${LOGO_FILE[style.variant]}.svg`)
  const pad = SAFE.BRAND_PAD
  const vertical = style.position.startsWith('top') ? { top: pad } : { bottom: pad }
  const horizontal = style.position.endsWith('right') ? { right: pad } : { left: pad }

  return (
    <Img
      src={src}
      style={{
        position: 'absolute',
        ...vertical,
        ...horizontal,
        height: style.size,
        width: 'auto',
        opacity: style.opacity,
      }}
    />
  )
}
