import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getOutputPath } from '@/config/company'

const CONTENT_TYPES = ['carroseis', 'posts', 'anuncios'] as const

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const base = path.join(getOutputPath(), 'instagram')

  for (const type of CONTENT_TYPES) {
    const thumbPath = path.join(base, type, id, 'thumbnail.png')
    try {
      const buffer = await fs.readFile(thumbPath)
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
      })
    } catch {}
  }

  return NextResponse.json({ error: 'Thumbnail não encontrado' }, { status: 404 })
}
