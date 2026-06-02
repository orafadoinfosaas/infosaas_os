import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { readContent } from '@/lib/content/reader'
import { updateContentFile, getContentDir } from '@/lib/content/writer'
import { extractAudio } from '@/lib/video/audio'

export const runtime = 'nodejs'
export const maxDuration = 300

type OpenAIWord = { word: string; start: number; end: number }

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 503 })
  }
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
  let audioPath: string
  try {
    audioPath = await extractAudio(footage)
  } catch (e) {
    return NextResponse.json({ error: `Falha ao extrair áudio: ${(e as Error).message}` }, { status: 500 })
  }

  try {
    const audio = await fs.readFile(audioPath)
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/mpeg' }), 'audio.mp3')
    form.append('model', 'whisper-1')
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'word')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `OpenAI transcription falhou: ${err}` }, { status: 502 })
    }
    const json = (await res.json()) as { text?: string; words?: OpenAIWord[] }
    const words = (json.words ?? []).map((w) => ({ text: w.word, start: w.start, end: w.end, removed: false }))
    const transcript = { text: json.text ?? '', words }

    content.video.transcript = transcript
    await updateContentFile('video', slug, content)

    return NextResponse.json({ transcript })
  } finally {
    await fs.unlink(audioPath).catch(() => {})
  }
}
