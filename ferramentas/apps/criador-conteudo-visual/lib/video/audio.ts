import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'

const execFileP = promisify(execFile)

export function ffmpegBin(): string {
  return ffmpegPath as string
}

// Extrai áudio mono 16kHz (pequeno; serve p/ transcrição e silencedetect).
export async function extractAudio(input: string): Promise<string> {
  const out = path.join(os.tmpdir(), `cc-audio-${Date.now()}-${Math.round(Math.random() * 1e6)}.mp3`)
  await execFileP(ffmpegBin(), ['-y', '-i', input, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', out])
  return out
}

// Roda ffmpeg e devolve o stderr (onde silencedetect imprime). Não lança em
// exit!=0 — silencedetect com -f null sai 0, mas blindamos mesmo assim.
export async function runFfmpegStderr(args: string[]): Promise<string> {
  try {
    const { stderr } = await execFileP(ffmpegBin(), args, { maxBuffer: 64 * 1024 * 1024 })
    return stderr ?? ''
  } catch (e) {
    const err = e as { stderr?: string }
    return err.stderr ?? ''
  }
}
