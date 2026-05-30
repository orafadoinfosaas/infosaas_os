import fs from 'fs/promises'
import path from 'path'
import { experimental_generateImage as generateImage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getOutputPath } from '@/config/company'

const TYPE_DIRS = ['carroseis', 'estaticos', 'stories', 'anuncios', 'posts'] as const

// Encontra o diretório do slug iterando os tipos de conteúdo.
async function findSlugDir(slug: string): Promise<string | null> {
  const base = path.join(getOutputPath(), 'instagram')
  for (const t of TYPE_DIRS) {
    const dir = path.join(base, t, slug)
    try {
      await fs.access(dir)
      return dir
    } catch {}
  }
  return null
}

// Tamanho da imagem a gerar — casa com a proporção do quadro.
function pickSize(aspectRatio?: string): '1024x1024' | '1024x1536' | '1536x1024' {
  if (aspectRatio === '1:1') return '1024x1024'
  if (aspectRatio === '9:16' || aspectRatio === '4:5' || aspectRatio === '3:4') return '1024x1536'
  return '1024x1024'
}

export type GenerateImageInput = {
  prompt: string
  slug: string
  aspectRatio?: string
}

export type GenerateImageResult = { filename: string }

// Gera uma imagem via gpt-image-1 (quality low — tier mais barato) e salva em
// disco no diretório de assets do conteúdo. Retorna o filename relativo que vai
// no media.ref (ex.: "assets/ai-1717000000000.png").
export async function generateAndSaveImage({ prompt, slug, aspectRatio }: GenerateImageInput): Promise<GenerateImageResult> {
  const slugDir = await findSlugDir(slug)
  if (!slugDir) throw new Error('Conteúdo não encontrado para esse slug — salve antes de gerar imagens.')

  const size = pickSize(aspectRatio)

  const { image } = await generateImage({
    model: openai.image('gpt-image-1'),
    prompt,
    size,
    providerOptions: { openai: { quality: 'low' } },
  })

  const ts = Date.now()
  const name = `ai-${ts}.png`
  const assetsDir = path.join(slugDir, 'assets')
  await fs.mkdir(assetsDir, { recursive: true })
  await fs.writeFile(path.join(assetsDir, name), image.uint8Array)

  return { filename: `assets/${name}` }
}
