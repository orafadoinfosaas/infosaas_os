import { NextResponse } from 'next/server'
import { listContents } from '@/lib/content/reader'

export async function GET() {
  const contents = await listContents()
  return NextResponse.json(contents)
}
