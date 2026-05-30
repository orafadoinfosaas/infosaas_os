import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { readContent } from '@/lib/content/reader'
import { ContentSchema } from '@/lib/schemas/content.schema'
import { getContentDir, deleteContent } from '@/lib/content/writer'
import { deleteThreadsBySlug } from '@/lib/content/threads'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const data = await readContent(id)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'conteúdo não encontrado' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { content, caption } = body

  const parsed = ContentSchema.safeParse(content)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const dir = getContentDir(parsed.data.content_type, id)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify(parsed.data, null, 2), 'utf-8')

  if (caption !== undefined) {
    await fs.writeFile(path.join(dir, 'caption.md'), caption, 'utf-8')
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const removed = await deleteContent(id)
  // Remove também a(s) thread(s) vinculada(s) para sumir de "Suas criações".
  await deleteThreadsBySlug(id)
  if (!removed) return NextResponse.json({ error: 'conteúdo não encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
