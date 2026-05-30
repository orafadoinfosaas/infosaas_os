import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/dna/loader'
import type { SystemPromptOptions } from '@/lib/dna/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const funnelPhase = (searchParams.get('phase') ?? 'descoberta') as SystemPromptOptions['funnelPhase']
  const contentType = (searchParams.get('type') ?? 'carrossel') as SystemPromptOptions['contentType']
  const template = (searchParams.get('template') ?? 'editorial') as SystemPromptOptions['template']

  const prompt = await buildSystemPrompt({ funnelPhase, contentType, template })
  return NextResponse.json({ prompt })
}
