import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getOutputPath } from '@/config/company'
import type { Content } from '@/lib/schemas/content.schema'

const TYPE_DIR: Record<Content['content_type'], string> = {
  carrossel: 'carroseis',
  estatico: 'estaticos',
  stories: 'stories',
  anuncio: 'anuncios',
  post: 'posts', // legado
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const file = formData.get('file') as File | null
  const slug = formData.get('slug') as string | null
  const contentType = formData.get('contentType') as Content['content_type'] | null

  if (!file || !slug || !contentType) {
    return NextResponse.json({ error: 'file, slug e contentType são obrigatórios' }, { status: 400 })
  }

  if (!TYPE_DIR[contentType]) {
    return NextResponse.json({ error: 'contentType inválido' }, { status: 400 })
  }

  const assetsDir = path.join(getOutputPath(), 'instagram', TYPE_DIR[contentType], slug, 'assets')
  await fs.mkdir(assetsDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  await fs.writeFile(path.join(assetsDir, filename), buffer)

  return NextResponse.json({ filename, path: `assets/${filename}` })
}
