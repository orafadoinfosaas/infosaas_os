import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { readContent } from '@/lib/content/reader'
import { getContentDir } from '@/lib/content/writer'
import { detectSilences } from '@/lib/video/silences-core'

export const runtime = 'nodejs'
export const maxDuration = 120

// Detecta silêncio pelo ÁUDIO real — não pelos buracos da transcrição.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const slug = typeof body.slug === 'string' ? body.slug : null
  const noiseDb = typeof body.noiseDb === 'number' ? body.noiseDb : undefined
  const minSilenceS = typeof body.minSilenceS === 'number' ? body.minSilenceS : undefined
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
  try {
    const ranges = await detectSilences(footage, { noiseDb, minSilenceS })
    return NextResponse.json({ ranges })
  } catch (e) {
    return NextResponse.json({ error: `Falha ao detectar silêncio: ${(e as Error).message}` }, { status: 500 })
  }
}
