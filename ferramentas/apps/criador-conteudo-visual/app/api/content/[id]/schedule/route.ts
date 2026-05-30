import { NextRequest, NextResponse } from 'next/server'
import { readContent } from '@/lib/content/reader'
import { updateContentFile } from '@/lib/content/writer'

type Params = { params: Promise<{ id: string }> }

// Reagenda (nova data) ou remove o agendamento (scheduled_at null → volta a rascunho).
// Preserva publish_targets — diferente de /api/publish, não mexe nos perfis.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const scheduledAt = typeof body.scheduled_at === 'string' ? body.scheduled_at : null

  let data
  try {
    data = await readContent(id)
  } catch {
    return NextResponse.json({ error: 'conteúdo não encontrado' }, { status: 404 })
  }

  const content = data.content
  if (scheduledAt) {
    content.publish_status = 'scheduled'
    content.scheduled_at = scheduledAt
  } else {
    content.publish_status = 'draft'
    content.scheduled_at = undefined
  }

  await updateContentFile(content.content_type, id, content)

  return NextResponse.json({
    ok: true,
    publish_status: content.publish_status,
    scheduled_at: content.scheduled_at ?? null,
  })
}
