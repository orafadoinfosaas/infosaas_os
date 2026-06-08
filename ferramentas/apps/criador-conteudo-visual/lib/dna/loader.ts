import fs from 'fs/promises'
import path from 'path'
import { getDnaPath, getSkillsPath } from '../../config/company'
import { loadDNAFiles as loadShared, assembleSystemPrompt, type DnaReader } from '@infosaas/content'
import type { FunnelPhase, SystemPromptOptions, DNAFiles } from './types'

// Reader backed por filesystem — a raiz do DNA/skills vem de company.ts (relativa ao
// monorepo). O núcleo (montagem do prompt) vive em @infosaas/content e é o MESMO usado
// pelo MCP no chat-native; aqui só fornecemos COMO ler os arquivos.
const fsReader: DnaReader = {
  async readDnaFile(relativePath) {
    return fs.readFile(path.join(getDnaPath(), relativePath), 'utf-8')
  },
  async listDnaMarkdown(relativeDir) {
    try {
      const entries = await fs.readdir(path.join(getDnaPath(), relativeDir))
      return entries.filter((f) => f.toLowerCase().endsWith('.md'))
    } catch {
      return []
    }
  },
  async readSkillFile(filename) {
    return fs.readFile(path.join(getSkillsPath(), filename), 'utf-8')
  },
}

export async function loadDNAFiles(funnelPhase: FunnelPhase, productId?: string): Promise<DNAFiles> {
  return loadShared(fsReader, funnelPhase, productId)
}

export async function buildSystemPrompt(options: SystemPromptOptions): Promise<string> {
  const dna = await loadShared(fsReader, options.funnelPhase, options.productId)
  return assembleSystemPrompt(dna, options)
}
