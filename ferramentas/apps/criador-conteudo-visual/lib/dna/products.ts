import fs from 'fs/promises'
import path from 'path'
import { getDnaPath } from '@/config/company'

export type ProductOption = { id: string; label: string }

function prettify(folder: string): string {
  return folder
    .replace(/^produto-/, '')
    .split('-')
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

// Lista os produtos a partir das subpastas de dna/produtos.
export async function listProducts(): Promise<ProductOption[]> {
  const dir = path.join(getDnaPath(), 'produtos')
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => ({ id: e.name, label: prettify(e.name) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
