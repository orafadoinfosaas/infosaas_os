import fs from 'fs/promises'
import path from 'path'
import { getDnaPath, getSkillsPath } from '../../config/company'
import type { FunnelPhase, SystemPromptOptions, DNAFiles } from './types'

const PHASE_FILE: Record<FunnelPhase, string> = {
  descoberta: 'DESCOBERTA.md',
  relacionamento: 'RELACIONAMENTO.md',
  prontidao: 'PRONTIDAO.md',
}

async function readDNAFile(relativePath: string): Promise<string> {
  const fullPath = path.join(getDnaPath(), relativePath)
  return fs.readFile(fullPath, 'utf-8')
}

// Opcional: não quebra se o arquivo não existir.
async function readDNAFileOptional(relativePath: string): Promise<string> {
  return readDNAFile(relativePath).catch(() => '')
}

// Lê todos os .md de uma subpasta do DNA, concatenados com cabeçalho por arquivo.
async function readDNAFolder(relDir: string): Promise<string> {
  const dir = path.join(getDnaPath(), relDir)
  let entries: string[]
  try {
    entries = await fs.readdir(dir)
  } catch {
    return ''
  }
  const files = entries.filter((f) => f.toLowerCase().endsWith('.md')).sort()
  const parts = await Promise.all(
    files.map(async (f) => {
      const content = await fs.readFile(path.join(dir, f), 'utf-8').catch(() => '')
      return content.trim() ? `### ${f.replace(/\.md$/i, '')}\n${content.trim()}` : ''
    })
  )
  return parts.filter(Boolean).join('\n\n')
}

async function readSkillFile(filename: string): Promise<string> {
  const fullPath = path.join(getSkillsPath(), filename)
  return fs.readFile(fullPath, 'utf-8')
}

// Sanitiza o id do produto p/ evitar traversal (só nome de pasta).
function safeProductId(id?: string): string | null {
  if (!id || !/^[a-z0-9-]+$/i.test(id)) return null
  return id
}

export async function loadDNAFiles(funnelPhase: FunnelPhase, productId?: string): Promise<DNAFiles> {
  const safeId = safeProductId(productId)
  const [voz, design, empresa, posicionamento, icp, product, funnelSkill] = await Promise.all([
    readDNAFile('empresa/VOZ.md'),
    readDNAFile('empresa/DESIGN.md'),
    readDNAFileOptional('empresa/EMPRESA.md'),
    readDNAFileOptional('empresa/POSICIONAMENTO.md'),
    readDNAFolder('perfil-de-cliente-ideal'),
    safeId ? readDNAFolder(`produtos/${safeId}`) : Promise.resolve(''),
    readSkillFile(PHASE_FILE[funnelPhase]),
  ])
  return { voz, design, empresa, posicionamento, icp, product, funnelSkill }
}

export async function buildSystemPrompt(options: SystemPromptOptions): Promise<string> {
  const { voz, design, empresa, posicionamento, icp, product, funnelSkill } = await loadDNAFiles(
    options.funnelPhase,
    options.productId
  )

  const section = (title: string, body: string) => (body.trim() ? `\n\n## ${title}\n${body.trim()}` : '')

  return (
    `
Você é um especialista em criação de conteúdo visual para Instagram.
Crie conteúdo para a fase de ${options.funnelPhase} do funil.
O formato será: ${options.contentType} com template ${options.template}.
`.trim() +
    section('Sobre a empresa', empresa) +
    section('Posicionamento', posicionamento) +
    section('Perfil de Cliente Ideal (ICP)', icp) +
    section('Produto em destaque', product) +
    section('Voz e Tom', voz) +
    section('Identidade Visual', design) +
    section('Regras desta fase do funil', funnelSkill) +
    `

## Regras de output
- O conteúdo deve falar diretamente com o ICP acima: suas dores, urgências e linguagem.${
      product.trim()
        ? '\n- O CTA e o conteúdo devem promover o "Produto em destaque" (oferta, benefícios, transformações e quebra de objeções).'
        : ''
    }
- O conteúdo de cada slide deve seguir rigorosamente as regras da fase do funil.
- A legenda deve seguir as regras de voz da empresa.
- Nunca use palavras da lista de palavras proibidas presente em VOZ.md.`
  )
}
