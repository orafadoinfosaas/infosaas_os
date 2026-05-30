import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getOutputPath } from '@/config/company'

const CONTENT_TYPES = ['carroseis', 'posts', 'anuncios', 'estaticos', 'stories'] as const

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

type Params = { params: Promise<{ id: string; path: string[] }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id, path: pathSegments } = await params
  const relativePath = pathSegments.join('/')
  const base = path.join(getOutputPath(), 'instagram')

  for (const type of CONTENT_TYPES) {
    const filePath = path.join(base, type, id, relativePath)
    try {
      const buffer = await fs.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME[ext] ?? 'application/octet-stream'
      return new NextResponse(buffer, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
      })
    } catch {}
  }

  return NextResponse.json({ error: 'Asset não encontrado' }, { status: 404 })
}
