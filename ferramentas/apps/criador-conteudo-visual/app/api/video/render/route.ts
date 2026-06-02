import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { bundle } from '@remotion/bundler'
import { selectComposition, renderMedia, ensureBrowser } from '@remotion/renderer'
import { readContent } from '@/lib/content/reader'
import { updateContentFile, getContentDir } from '@/lib/content/writer'

export const runtime = 'nodejs'
export const maxDuration = 600

// Progresso por slug (0..1) — POST escreve via onProgress, GET lê (cliente faz poll).
const renderProgress = new Map<string, number>()

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const p = slug ? renderProgress.get(slug) : undefined
  return NextResponse.json({ progress: p ?? null })
}

// Bundle da composição Remotion — caro; memoiza por processo (1x) em produção.
// Em dev re-bundla sempre (a composição muda enquanto se desenvolve).
// webpackOverride: o bundler do Remotion não conhece o alias '@/' do Next.
const isProd = process.env.NODE_ENV === 'production'
let bundlePromise: Promise<string> | null = null
function getBundle(): Promise<string> {
  if (!bundlePromise || !isProd) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), 'remotion', 'index.ts'),
      publicDir: path.join(process.cwd(), 'public'),
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: { ...(config.resolve?.alias ?? {}), '@': process.cwd() },
        },
      }),
    })
  }
  return bundlePromise
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const slug = typeof body.slug === 'string' ? body.slug : null
  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })

  let data
  try {
    data = await readContent(slug)
  } catch {
    return NextResponse.json({ error: 'conteúdo não encontrado' }, { status: 404 })
  }
  const content = data.content
  if (content.content_type !== 'video' || !content.video.ref) {
    return NextResponse.json({ error: 'vídeo não enviado' }, { status: 400 })
  }
  if (!content.video.duration) {
    return NextResponse.json({ error: 'duração do vídeo não detectada — abra no editor primeiro' }, { status: 400 })
  }

  // URL absoluta servida pelo próprio app — o Chromium headless do render busca daqui.
  const videoSrc = `${req.nextUrl.origin}/api/assets/${slug}/${content.video.ref}`
  const inputProps = {
    videoSrc,
    sourceDuration: content.video.duration,
    transcript: content.video.transcript ?? null,
    edit: content.video.edit,
    style: content.video.style,
  }

  renderProgress.set(slug, 0)
  try {
    await ensureBrowser()
    const serveUrl = await getBundle()
    const composition = await selectComposition({ serveUrl, id: 'Reel', inputProps })

    const outName = `rendered-${Date.now()}.mp4`
    const outPath = path.join(getContentDir('video', slug), 'assets', outName)
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      crf: 23, // qualidade-base; o teto de bitrate (VBV) garante peso previsível
      encodingMaxRate: '8M',
      encodingBufferSize: '16M',
      // Compatibilidade mobile: limited-range yuv420p + bt709 (evita flicker/desvio
      // de cor em decoders de celular, que sofrem com o yuvj420p full-range padrão).
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      outputLocation: outPath,
      inputProps,
      concurrency: null, // auto (usa os cores disponíveis)
      onProgress: ({ progress }) => renderProgress.set(slug, progress),
    })

    content.video.rendered_ref = `assets/${outName}`
    await updateContentFile('video', slug, content)
    return NextResponse.json({ rendered_ref: content.video.rendered_ref })
  } catch (e) {
    return NextResponse.json({ error: `Falha no render: ${(e as Error).message}` }, { status: 500 })
  } finally {
    renderProgress.delete(slug)
  }
}
