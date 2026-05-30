import { NextRequest, NextResponse } from 'next/server'
import { generateAndSaveImage } from '@/lib/images/generate'

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug : ''
  const aspectRatio = typeof body.aspectRatio === 'string' ? body.aspectRatio : undefined

  if (!prompt) return NextResponse.json({ error: 'prompt obrigatório' }, { status: 400 })
  if (!slug) return NextResponse.json({ error: 'Salve o conteúdo antes de gerar imagens.' }, { status: 400 })

  try {
    const { filename } = await generateAndSaveImage({ prompt, slug, aspectRatio })
    return NextResponse.json({ filename })
  } catch (e) {
    console.error('[api/images/generate] error:', e)
    return NextResponse.json({ error: 'Falha ao gerar imagem.' }, { status: 502 })
  }
}
