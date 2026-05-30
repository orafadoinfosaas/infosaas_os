import { NextRequest, NextResponse } from 'next/server'
import { getThread, updateThread, deleteThread } from '@/lib/content/threads'
import { deleteContent } from '@/lib/content/writer'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const thread = await getThread(id)
  if (!thread) return NextResponse.json({ error: 'não encontrada' }, { status: 404 })
  return NextResponse.json(thread)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const updated = await updateThread(id, {
    appendMessage: body.message,
    slug: body.slug,
  })
  if (!updated) return NextResponse.json({ error: 'não encontrada' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { removed, slug } = await deleteThread(id)
  if (!removed) return NextResponse.json({ error: 'não encontrada' }, { status: 404 })
  if (slug) await deleteContent(slug) // remove também o conteúdo vinculado
  return NextResponse.json({ ok: true })
}
