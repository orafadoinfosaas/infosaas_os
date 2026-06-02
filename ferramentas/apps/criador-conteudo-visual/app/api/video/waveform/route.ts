import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { readContent } from '@/lib/content/reader'
import { getContentDir } from '@/lib/content/writer'
import { ffmpegBin } from '@/lib/video/audio'

export const runtime = 'nodejs'
export const maxDuration = 120

const execFileP = promisify(execFile)

// Gera o PNG da forma de onda (fundo da trilha de edição) via ffmpeg showwavespic.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const slug = typeof body.slug === 'string' ? body.slug : null
  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })

  let data
  try {
    data = await readContent(slug)
  } catch {
    return NextResponse.json({ error: 'conteúdo não encontrado' }, { status: 404 })
  }
  const content = data.content
  if (content.content_type !== 'video' || !content.video.ref) {
    return NextResponse.json({ error: 'vídeo não enviado' }, { status: 400 })
  }

  const footage = path.join(getContentDir('video', slug), content.video.ref)
  const out = path.join(getContentDir('video', slug), 'assets', 'waveform.png')
  try {
    await execFileP(ffmpegBin(), [
      '-y',
      '-i',
      footage,
      '-filter_complex',
      'showwavespic=s=1600x120:colors=#9d9d9d',
      '-frames:v',
      '1',
      out,
    ])
    return NextResponse.json({ path: 'assets/waveform.png' })
  } catch (e) {
    return NextResponse.json({ error: `Falha ao gerar waveform: ${(e as Error).message}` }, { status: 500 })
  }
}
