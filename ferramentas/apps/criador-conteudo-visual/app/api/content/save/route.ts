import { NextRequest, NextResponse } from 'next/server'
import { ContentSchema } from '@/lib/schemas/content.schema'
import { writeContent } from '@/lib/content/writer'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { content, caption, thumbnail } = body

  const parsed = ContentSchema.safeParse(content)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { slug } = await writeContent(parsed.data, caption ?? '', thumbnail)
  return NextResponse.json({ slug })
}
