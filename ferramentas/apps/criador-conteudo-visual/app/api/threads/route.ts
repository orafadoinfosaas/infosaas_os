import { NextRequest, NextResponse } from 'next/server'
import { createThread, listThreads } from '@/lib/content/threads'

export async function GET() {
  return NextResponse.json(await listThreads())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const brief = typeof body.brief === 'string' ? body.brief.trim() : ''
  if (!brief) return NextResponse.json({ error: 'brief obrigatório' }, { status: 400 })

  const thread = await createThread({
    brief,
    meta: {
      platform: body.platform ?? 'instagram',
      format: body.format ?? '',
      communication: body.communication ?? '',
      product: typeof body.product === 'string' && body.product ? body.product : undefined,
      author: typeof body.author === 'string' && body.author ? body.author : undefined,
      attachments: Array.isArray(body.attachments) ? body.attachments : undefined,
    },
  })
  return NextResponse.json({ id: thread.id })
}
