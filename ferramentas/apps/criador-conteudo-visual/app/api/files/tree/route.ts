import { NextRequest, NextResponse } from 'next/server'
import { listTree, type FileScope } from '@/lib/content/files'

const SCOPES: FileScope[] = ['dna', 'skills', 'identidade']

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get('scope') as FileScope | null
  if (!scope || !SCOPES.includes(scope)) {
    return NextResponse.json({ error: 'scope inválido' }, { status: 400 })
  }
  return NextResponse.json(await listTree(scope))
}
