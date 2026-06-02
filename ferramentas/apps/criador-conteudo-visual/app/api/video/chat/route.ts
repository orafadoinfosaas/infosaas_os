import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { generateText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { readContent } from '@/lib/content/reader'
import { getContentDir } from '@/lib/content/writer'
import { detectSilences } from '@/lib/video/silences-core'
import { addCut, mergeRanges, findPhraseRange, autoZoomRegions, buildEditPlan } from '@/lib/video/edit-plan'
import type { VideoEdit, VideoStyle, Transcript } from '@/lib/schemas/content.schema'

export const runtime = 'nodejs'
export const maxDuration = 120

type Body = {
  slug: string
  userMessage: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  edit?: VideoEdit
  style?: VideoStyle
}

// Remove chaves undefined (tools com campos opcionais não devem sobrescrever).
function clean<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'IA não configurada. Defina OPENAI_API_KEY.' }, { status: 503 })
  }
  const body = (await req.json()) as Body
  if (!body.slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })

  let data
  try {
    data = await readContent(body.slug)
  } catch {
    return NextResponse.json({ error: 'conteúdo não encontrado' }, { status: 404 })
  }
  const content = data.content
  if (content.content_type !== 'video') {
    return NextResponse.json({ error: 'não é vídeo' }, { status: 400 })
  }

  const transcript: Transcript | null = content.video.transcript ?? null
  const words = transcript?.words ?? []
  const sourceDuration = content.video.duration ?? 0
  const footage = path.join(getContentDir('video', body.slug), content.video.ref)

  // Estado mutável (parte do que o cliente enviou; cai no salvo se faltar).
  let edit: VideoEdit = body.edit ?? content.video.edit
  let style: VideoStyle = body.style ?? content.video.style

  const CaptionPosZ = z.enum(['top', 'middle', 'bottom'])
  const AnimZ = z.enum(['karaoke', 'pop', 'fade', 'none'])
  const WeightZ = z.enum(['bold', 'extrabold'])
  const FitZ = z.enum(['cover', 'contain'])
  const LogoVarZ = z.enum(['preto', 'branco', 'laranja'])
  const CornerZ = z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])

  const tools = {
    autoCutSilence: tool({
      description: 'Detecta silêncio pelo áudio real e corta. sensitivityDb opcional (-45 conservador … -25 agressivo; padrão -35).',
      inputSchema: z.object({ sensitivityDb: z.number().optional() }),
      execute: async ({ sensitivityDb }) => {
        const ranges = await detectSilences(footage, { noiseDb: sensitivityDb })
        edit = { ...edit, enabled: true, cuts: mergeRanges([...edit.cuts, ...ranges]) }
        return { ok: true, cortesAdicionados: ranges.length }
      },
    }),
    cutPhrase: tool({
      description: 'Corta (remove) o trecho onde uma frase/palavra é dita. Use o texto exato falado.',
      inputSchema: z.object({ phrase: z.string() }),
      execute: async ({ phrase }) => {
        const r = findPhraseRange(words, phrase)
        if (!r) return { error: `não encontrei "${phrase}" na transcrição` }
        edit = { ...edit, enabled: true, cuts: addCut(edit.cuts, r) }
        return { ok: true, range: r }
      },
    }),
    removeAllCuts: tool({
      description: 'Remove todos os cortes (restaura o vídeo inteiro).',
      inputSchema: z.object({}),
      execute: async () => {
        edit = { ...edit, cuts: [] }
        return { ok: true }
      },
    }),
    zoomOnPhrase: tool({
      description: 'Adiciona um zoom (ênfase) no trecho onde uma frase/palavra é dita. scale 1.1–2.5 (padrão 1.4).',
      inputSchema: z.object({ phrase: z.string(), scale: z.number().optional() }),
      execute: async ({ phrase, scale }) => {
        const r = findPhraseRange(words, phrase)
        if (!r) return { error: `não encontrei "${phrase}" na transcrição` }
        edit = { ...edit, zooms: [...edit.zooms, { start: r.start, end: Math.min(r.end + 0.3, r.start + 3), scale: scale ?? 1.4, x: 0, y: 0 }] }
        return { ok: true }
      },
    }),
    addZoom: tool({
      description: 'Adiciona zoom entre dois instantes (segundos do vídeo original). scale 1.1–2.5.',
      inputSchema: z.object({ startSec: z.number(), endSec: z.number(), scale: z.number().optional() }),
      execute: async ({ startSec, endSec, scale }) => {
        edit = { ...edit, zooms: [...edit.zooms, { start: startSec, end: endSec, scale: scale ?? 1.4, x: 0, y: 0 }] }
        return { ok: true }
      },
    }),
    autoZoom: tool({
      description: 'Adiciona VÁRIOS zooms dinâmicos (estilo Reel) nos pontos de ênfase, de uma vez. Use quando o usuário pedir "zoom nas partes importantes / vários zooms / dá dinamismo / edita pra mim". SOMA aos zooms existentes (não apaga).',
      inputSchema: z.object({}),
      execute: async () => {
        const regions = autoZoomRegions(words)
        const overlap = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start < b.end && b.start < a.end
        const toAdd = regions.filter((r) => !edit.zooms.some((z) => overlap(z, r)))
        edit = { ...edit, zooms: [...edit.zooms, ...toAdd] }
        return { ok: true, zoomsAdicionados: toAdd.length, totalZooms: edit.zooms.length }
      },
    }),
    removeZoom: tool({
      description: 'Remove UM zoom específico pelo índice (0-based, na ordem do getState). Use para "remove o zoom que inseri / remove o 2º zoom".',
      inputSchema: z.object({ index: z.number().int() }),
      execute: async ({ index }) => {
        if (index < 0 || index >= edit.zooms.length) return { error: `índice ${index} inválido (há ${edit.zooms.length} zooms)` }
        const removed = edit.zooms[index]
        edit = { ...edit, zooms: edit.zooms.filter((_, i) => i !== index) }
        return { ok: true, removido: removed }
      },
    }),
    removeZoomOnPhrase: tool({
      description: 'Remove o zoom que cai sobre o trecho onde uma frase/palavra é dita.',
      inputSchema: z.object({ phrase: z.string() }),
      execute: async ({ phrase }) => {
        const r = findPhraseRange(words, phrase)
        if (!r) return { error: `não encontrei "${phrase}"` }
        const mid = (r.start + r.end) / 2
        const before = edit.zooms.length
        edit = { ...edit, zooms: edit.zooms.filter((z) => !(mid >= z.start && mid < z.end)) }
        return { ok: true, removidos: before - edit.zooms.length }
      },
    }),
    clearZooms: tool({
      description: 'Remove TODOS os zooms. Só use se o usuário pedir explicitamente "remove todos / limpa os zooms". Para um único, use removeZoom/removeZoomOnPhrase.',
      inputSchema: z.object({}),
      execute: async () => {
        edit = { ...edit, zooms: [] }
        return { ok: true }
      },
    }),
    setCaption: tool({
      description: 'Ajusta o estilo da legenda. Combine livremente os campos.',
      inputSchema: z.object({
        enabled: z.boolean().optional(),
        position: CaptionPosZ.optional(),
        animation: AnimZ.optional(),
        weight: WeightZ.optional(),
        fontSize: z.number().optional(),
        textColor: z.string().optional(),
        activeColor: z.string().optional(),
        box: z.boolean().optional(),
        uppercase: z.boolean().optional(),
        maxWordsPerLine: z.number().int().optional(),
        offsetX: z.number().optional(),
        offsetY: z.number().optional(),
      }),
      execute: async (input) => {
        style = { ...style, caption: { ...style.caption, ...clean(input) } }
        return { ok: true }
      },
    }),
    setFootage: tool({
      description: 'Ajusta o enquadramento/áudio do vídeo: fit (cover/contain), zoom base, x/y (pan -1..1), volumeDb (-30..12).',
      inputSchema: z.object({
        fit: FitZ.optional(),
        zoom: z.number().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        volumeDb: z.number().optional(),
      }),
      execute: async (input) => {
        style = { ...style, footage: { ...style.footage, ...clean(input) } }
        return { ok: true }
      },
    }),
    setLogo: tool({
      description: 'Ajusta a logo: enabled, variant (preto/branco/laranja), position (4 cantos), size, opacity (0..1).',
      inputSchema: z.object({
        enabled: z.boolean().optional(),
        variant: LogoVarZ.optional(),
        position: CornerZ.optional(),
        size: z.number().optional(),
        opacity: z.number().optional(),
      }),
      execute: async (input) => {
        style = { ...style, logo: { ...style.logo, ...clean(input) } }
        return { ok: true }
      },
    }),
    setSting: tool({
      description: 'Liga/ajusta intro ou outro de marca. which="intro"|"outro".',
      inputSchema: z.object({
        which: z.enum(['intro', 'outro']),
        enabled: z.boolean().optional(),
        text: z.string().optional(),
        durationMs: z.number().optional(),
      }),
      execute: async ({ which, ...rest }) => {
        style = { ...style, [which]: { ...style[which], ...clean(rest) } }
        return { ok: true }
      },
    }),
    getState: tool({
      description: 'Resumo do estado atual da edição (cortes, zooms, duração de saída, estilo).',
      inputSchema: z.object({}),
      execute: async () => {
        const plan = buildEditPlan(words, sourceDuration, edit.enabled ? edit.cuts : [])
        return {
          cortes: edit.cuts.length,
          zoomsCount: edit.zooms.length,
          zooms: edit.zooms.map((z, i) => ({ index: i, inicioSeg: +z.start.toFixed(1), fimSeg: +z.end.toFixed(1), scale: z.scale })),
          duracaoSaidaSeg: Math.round(plan.outDuration),
          legenda: style.caption,
          volumeDb: style.footage.volumeDb,
        }
      },
    }),
  }

  const system = `Você é um editor de Reels verticais (9:16) que opera por CONVERSA. O usuário gravou um vídeo falando; você corta silêncios/erros, dá zoom de ênfase, ajusta legenda, logo, intro/outro, enquadramento e volume — tudo via TOOLS.

REGRAS:
- Você pode chamar VÁRIAS tools em sequência num mesmo turno (faça quantas precisar até completar o pedido).
- Para cortar ou dar zoom em algo que a pessoa FALA, use cutPhrase / zoomOnPhrase com o texto exato — NÃO chute segundos. Só use addZoom/segundos se o usuário der o tempo explícito.

ZOOM — escolha a tool certa:
- "zoom QUANDO eu falo X" / "zoom em X" → zoomOnPhrase (UM, no trecho de X).
- "zoom nas partes importantes / vários zooms / mais dinâmico / dá dinamismo" → autoZoom (VÁRIOS de uma vez).
- "remove o zoom que inseri / esse zoom / o último" → chame getState para ver a LISTA de zooms (com index e tempo), depois removeZoom(index) do alvo. Para remover pelo conteúdo, removeZoomOnPhrase.
- clearZooms SOMENTE se pedir "remove TODOS / limpa os zooms". NUNCA use clearZooms para remover um zoom específico.

OUTROS:
- "auto-editar" / "edita pra mim" = autoCutSilence + autoZoom.
- Pedidos heurísticos, "como está?", ou remover algo específico → chame getState ANTES de decidir.
- Depois de aplicar, responda CURTO em português (1–2 frases), natural, sem citar nomes de tools nem JSON.
- Se for só conversa/pergunta sem mudança, responda sem chamar tools.

Duração do vídeo: ${sourceDuration.toFixed(1)}s. Cortes atuais: ${edit.cuts.length}. Zooms atuais: ${edit.zooms.length}.
Transcrição do que é falado:
«${transcript?.text ?? '(sem transcrição — rode a transcrição primeiro)'}»`

  const messages: { role: 'user' | 'assistant'; content: string }[] = []
  for (const m of body.history ?? []) messages.push(m)
  messages.push({ role: 'user', content: body.userMessage })

  let reply = ''
  try {
    const result = await generateText({
      model: openai('gpt-5.4-nano'),
      system,
      messages,
      tools,
      stopWhen: stepCountIs(20),
      providerOptions: { openai: { parallelToolCalls: false } },
    })
    reply = result.text
  } catch (e) {
    console.error('[api/video/chat] error:', e)
    return NextResponse.json({ error: 'Falha no agente.' }, { status: 502 })
  }

  return NextResponse.json({ reply, edit, style })
}
