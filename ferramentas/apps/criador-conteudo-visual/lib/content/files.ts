import fs from 'fs/promises'
import path from 'path'
import { getDnaPath, getSkillsPath } from '@/config/company'

export type FileScope = 'dna' | 'skills' | 'identidade'

export type FileNode = { scope: FileScope; path: string; name: string }

function rootOf(scope: FileScope): string {
  if (scope === 'dna') return getDnaPath()
  if (scope === 'skills') return getSkillsPath()
  return path.join(getDnaPath(), 'identidade-visual')
}

// Resolve um path relativo dentro do escopo, barrando traversal e não-.md.
export function safeAbs(scope: FileScope, rel: string): string | null {
  const root = path.resolve(rootOf(scope))
  const abs = path.resolve(root, rel)
  if (abs !== root && !abs.startsWith(root + path.sep)) return null
  if (!abs.toLowerCase().endsWith('.md')) return null
  return abs
}

async function walk(dir: string, base: string, out: string[]): Promise<void> {
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      await walk(full, base, out)
    } else if (e.name.toLowerCase().endsWith('.md')) {
      out.push(path.relative(base, full).split(path.sep).join('/'))
    }
  }
}

export async function listTree(scope: FileScope): Promise<FileNode[]> {
  const root = rootOf(scope)
  const rels: string[] = []
  await walk(root, root, rels)
  return rels
    .filter((rel) => (scope === 'dna' ? !rel.startsWith('identidade-visual/') : true))
    .sort()
    .map((rel) => ({ scope, path: rel, name: rel }))
}

export async function readScopedFile(scope: FileScope, rel: string): Promise<string | null> {
  const abs = safeAbs(scope, rel)
  if (!abs) return null
  try {
    return await fs.readFile(abs, 'utf-8')
  } catch {
    return null
  }
}

export async function writeScopedFile(scope: FileScope, rel: string, content: string): Promise<boolean> {
  const abs = safeAbs(scope, rel)
  if (!abs) return false
  await fs.writeFile(abs, content, 'utf-8')
  return true
}
