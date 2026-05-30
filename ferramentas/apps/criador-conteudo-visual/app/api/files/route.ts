import { NextRequest, NextResponse } from 'next/server'
import { readScopedFile, writeScopedFile, type FileScope } from '@/lib/content/files'

const SCOPES: FileScope[] = ['dna', 'skills', 'identidade']

function parseScope(s: string | null): FileScope | null {
  return s && SCOPES.includes(s as FileScope) ? (s as FileScope) : null
}

export async function GET(req: NextRequest) {
  const scope = parseScope(req.nextUrl.searchParams.get('scope'))
  const filePath = req.nextUrl.searchParams.get('path')
  if (!scope || !filePath) return NextResponse.json({ error: 'scope/path obrigatórios' }, { status: 400 })

  const content = await readScopedFile(scope, filePath)
  if (content === null) return NextResponse.json({ error: 'não encontrado ou não permitido' }, { status: 404 })
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const scope = parseScope(body.scope)
  const filePath = typeof body.path === 'string' ? body.path : null
  const content = typeof body.content === 'string' ? body.content : null
  if (!scope || !filePath || content === null) {
    return NextResponse.json({ error: 'scope/path/content obrigatórios' }, { status: 400 })
  }

  const ok = await writeScopedFile(scope, filePath, content)
  if (!ok) return NextResponse.json({ error: 'caminho não permitido' }, { status: 403 })
  return NextResponse.json({ ok: true })
}
