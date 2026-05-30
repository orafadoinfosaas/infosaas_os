import fs from 'fs/promises'
import path from 'path'
import { getOutputPath } from '@/config/company'
import { ThreadSchema, type Thread, type ThreadMessage, type ThreadMeta } from '@/lib/schemas/thread.schema'

function threadsDir(): string {
  return path.join(getOutputPath(), '_threads')
}

function threadPath(id: string): string {
  return path.join(threadsDir(), `${id}.json`)
}

async function exists(p: string): Promise<boolean> {
  return fs.access(p).then(() => true).catch(() => false)
}

function titleFromBrief(brief: string): string {
  const t = brief.trim().replace(/\s+/g, ' ')
  return t.length > 60 ? `${t.slice(0, 60)}…` : t || 'Sem título'
}

export type ThreadSummary = {
  id: string
  title: string
  slug?: string
  updated_at: string
}

export async function createThread(input: {
  brief: string
  meta: ThreadMeta
}): Promise<Thread> {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const thread: Thread = {
    id,
    title: titleFromBrief(input.brief),
    created_at: now,
    updated_at: now,
    meta: input.meta,
    messages: [
      { role: 'user', content: input.brief, ts: now, attachments: input.meta.attachments },
    ],
  }
  await fs.mkdir(threadsDir(), { recursive: true })
  await fs.writeFile(threadPath(id), JSON.stringify(thread, null, 2), 'utf-8')
  return thread
}

export async function getThread(id: string): Promise<Thread | null> {
  const p = threadPath(id)
  if (!(await exists(p))) return null
  try {
    return ThreadSchema.parse(JSON.parse(await fs.readFile(p, 'utf-8')))
  } catch {
    return null
  }
}

export async function listThreads(): Promise<ThreadSummary[]> {
  const dir = threadsDir()
  if (!(await exists(dir))) return []
  const files = await fs.readdir(dir)
  const out: ThreadSummary[] = []
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    try {
      const t = ThreadSchema.parse(JSON.parse(await fs.readFile(path.join(dir, f), 'utf-8')))
      out.push({ id: t.id, title: t.title, slug: t.slug, updated_at: t.updated_at })
    } catch {
      // ignora arquivo inválido
    }
  }
  return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

// Remove uma thread por id; devolve o slug vinculado (para excluir o conteúdo junto).
export async function deleteThread(id: string): Promise<{ removed: boolean; slug?: string }> {
  const t = await getThread(id)
  if (!t) return { removed: false }
  await fs.rm(threadPath(id), { force: true })
  return { removed: true, slug: t.slug }
}

// Remove threads vinculadas a um slug (usado ao excluir o conteúdo).
export async function deleteThreadsBySlug(slug: string): Promise<number> {
  const dir = threadsDir()
  if (!(await exists(dir))) return 0
  const files = await fs.readdir(dir)
  let removed = 0
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    try {
      const t = ThreadSchema.parse(JSON.parse(await fs.readFile(path.join(dir, f), 'utf-8')))
      if (t.slug === slug) {
        await fs.rm(path.join(dir, f), { force: true })
        removed++
      }
    } catch {
      // ignora arquivo inválido
    }
  }
  return removed
}

export async function updateThread(
  id: string,
  patch: { appendMessage?: ThreadMessage; slug?: string }
): Promise<Thread | null> {
  const current = await getThread(id)
  if (!current) return null
  const next: Thread = {
    ...current,
    slug: patch.slug ?? current.slug,
    messages: patch.appendMessage ? [...current.messages, patch.appendMessage] : current.messages,
    updated_at: new Date().toISOString(),
  }
  await fs.writeFile(threadPath(id), JSON.stringify(next, null, 2), 'utf-8')
  return next
}
