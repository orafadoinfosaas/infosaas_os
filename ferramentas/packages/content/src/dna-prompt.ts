import type { FunnelPhase } from './schemas/content.schema.js'
import type { DNAFiles, SystemPromptOptions } from './types.js'

export const PHASE_FILE: Record<FunnelPhase, string> = {
  descoberta: 'DESCOBERTA.md',
  relacionamento: 'RELACIONAMENTO.md',
  prontidao: 'PRONTIDAO.md',
}

/**
 * Fonte de leitura do DNA, INJETADA pelo consumidor — é o que torna o núcleo
 * portável sem acoplar a um backend de arquivos:
 *   - app criador: backed por `fs` (getDnaPath/getSkillsPath)
 *   - MCP: backed pelo storage do tenant (WebDAV/local)
 * A montagem do prompt (assembleSystemPrompt) é PURA e idêntica nos dois lados —
 * é isso que garante "mesmas regras no chat e no editor".
 */
export interface DnaReader {
  /** Lê um arquivo dentro de `dna/` (caminho relativo). DEVE rejeitar se não existir. */
  readDnaFile(relativePath: string): Promise<string>
  /** Lista os nomes de arquivo `.md` de uma subpasta de `dna/`. `[]` se não existir. */
  listDnaMarkdown(relativeDir: string): Promise<string[]>
  /** Lê um arquivo de skill da fase do funil. DEVE rejeitar se não existir. */
  readSkillFile(filename: string): Promise<string>
}

// Sanitiza o id do produto p/ evitar traversal (só nome de pasta).
function safeProductId(id?: string): string | null {
  if (!id || !/^[a-z0-9-]+$/i.test(id)) return null
  return id
}

function readOptional(reader: DnaReader, relativePath: string): Promise<string> {
  return reader.readDnaFile(relativePath).catch(() => '')
}

// Lê todos os .md de uma subpasta do DNA, concatenados com cabeçalho por arquivo.
async function readFolderConcat(reader: DnaReader, relDir: string): Promise<string> {
  const files = (await reader.listDnaMarkdown(relDir))
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort()
  const parts = await Promise.all(
    files.map(async (f) => {
      const content = (await reader.readDnaFile(`${relDir}/${f}`).catch(() => '')).trim()
      return content ? `### ${f.replace(/\.md$/i, '')}\n${content}` : ''
    }),
  )
  return parts.filter(Boolean).join('\n\n')
}

export async function loadDNAFiles(
  reader: DnaReader,
  funnelPhase: FunnelPhase,
  productId?: string,
): Promise<DNAFiles> {
  const safeId = safeProductId(productId)
  const [voz, design, empresa, posicionamento, icp, product, funnelSkill] = await Promise.all([
    reader.readDnaFile('empresa/VOZ.md'), // obrigatório (rejeita se faltar)
    reader.readDnaFile('empresa/DESIGN.md'), // obrigatório
    readOptional(reader, 'empresa/EMPRESA.md'),
    readOptional(reader, 'empresa/POSICIONAMENTO.md'),
    readFolderConcat(reader, 'perfil-de-cliente-ideal'),
    safeId ? readFolderConcat(reader, `produtos/${safeId}`) : Promise.resolve(''),
    reader.readSkillFile(PHASE_FILE[funnelPhase]),
  ])
  return { voz, design, empresa, posicionamento, icp, product, funnelSkill }
}

/**
 * PURA: monta o system prompt a partir do DNA já carregado. Esta é a "regra"
 * compartilhada — qualquer mudança aqui reflete no editor E no chat ao mesmo tempo.
 */
export function assembleSystemPrompt(dna: DNAFiles, options: SystemPromptOptions): string {
  const { voz, design, empresa, posicionamento, icp, product, funnelSkill } = dna
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

/** Conveniência: carrega o DNA (via reader) e monta o prompt numa tacada. */
export async function buildSystemPrompt(reader: DnaReader, options: SystemPromptOptions): Promise<string> {
  const dna = await loadDNAFiles(reader, options.funnelPhase, options.productId)
  return assembleSystemPrompt(dna, options)
}
