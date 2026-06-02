import fs from 'fs/promises'
import { extractAudio, runFfmpegStderr } from './audio'

// Detecta silêncio pelo ÁUDIO real (ffmpeg silencedetect). Reusado pela rota
// /api/video/silences e pela tool autoCutSilence do agente de chat.
export async function detectSilences(
  footagePath: string,
  opts?: { noiseDb?: number; minSilenceS?: number }
): Promise<{ start: number; end: number }[]> {
  const noiseDb = opts?.noiseDb ?? -35
  const minSilenceS = opts?.minSilenceS ?? 0.6
  const audio = await extractAudio(footagePath)
  try {
    const stderr = await runFfmpegStderr(['-i', audio, '-af', `silencedetect=noise=${noiseDb}dB:d=${minSilenceS}`, '-f', 'null', '-'])
    const ranges: { start: number; end: number }[] = []
    let curStart: number | null = null
    for (const line of stderr.split('\n')) {
      const s = /silence_start:\s*(-?[0-9.]+)/.exec(line)
      const e = /silence_end:\s*(-?[0-9.]+)/.exec(line)
      if (s) curStart = parseFloat(s[1])
      if (e && curStart != null) {
        const start = curStart + 0.15 // encolhe p/ preservar ataque/cauda da fala
        const end = parseFloat(e[1]) - 0.15
        if (end - start > 0.08) ranges.push({ start: Math.max(0, start), end })
        curStart = null
      }
    }
    return ranges
  } finally {
    await fs.unlink(audio).catch(() => {})
  }
}
