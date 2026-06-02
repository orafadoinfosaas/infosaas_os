import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getOutputPath } from '@/config/company'

const CONTENT_TYPES = ['carroseis', 'posts', 'anuncios', 'estaticos', 'stories', 'videos'] as const

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
}

type Params = { params: Promise<{ id: string; path: string[] }> }

async function resolveFile(id: string, relativePath: string): Promise<string | null> {
  const base = path.join(getOutputPath(), 'instagram')
  for (const type of CONTENT_TYPES) {
    const filePath = path.join(base, type, id, relativePath)
    if (await fs.access(filePath).then(() => true).catch(() => false)) return filePath
  }
  return null
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id, path: pathSegments } = await params
  const relativePath = pathSegments.join('/')

  const filePath = await resolveFile(id, relativePath)
  if (!filePath) return NextResponse.json({ error: 'Asset não encontrado' }, { status: 404 })

  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME[ext] ?? 'application/octet-stream'
  const { size } = await fs.stat(filePath)
  const range = req.headers.get('range')

  // Range (206) — necessário para seek de vídeo (Player do Remotion, <video> nativo).
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range)
    if (m) {
      const start = parseInt(m[1], 10)
      const end = m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1
      if (start <= end) {
        const chunkSize = end - start + 1
        const fd = await fs.open(filePath, 'r')
        const buf = Buffer.alloc(chunkSize)
        await fd.read(buf, 0, chunkSize, start)
        await fd.close()
        return new NextResponse(new Uint8Array(buf), {
          status: 206,
          headers: {
            'Content-Type': contentType,
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    }
  }

  const buffer = await fs.readFile(filePath)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
