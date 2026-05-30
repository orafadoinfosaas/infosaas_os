import { NextResponse } from 'next/server'
import { getComposioProfiles } from '@/lib/publish/composio'

export async function GET() {
  return NextResponse.json(await getComposioProfiles())
}
