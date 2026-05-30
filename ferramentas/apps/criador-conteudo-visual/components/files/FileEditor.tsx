'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Save, ChevronRight } from 'lucide-react'
import type { FileScope, FileNode } from '@/lib/content/files'

type ScopeCfg = { scope: FileScope; label: string }
type Selected = { scope: FileScope; path: string }

type TreeFile = { kind: 'file'; key: string; label: string; scope: FileScope; path: string }
type TreeFolder = { kind: 'folder'; key: string; label: string; children: TreeNode[] }
type TreeNode = TreeFile | TreeFolder

const SMALL_WORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'e'])
function prettify(seg: string): string {
  return seg
    .split('-')
    .map((w, i) => {
      const lw = w.toLowerCase()
      if (i > 0 && SMALL_WORDS.has(lw)) return lw
      return lw.charAt(0).toUpperCase() + lw.slice(1)
    })
    .join(' ')
}

type MutNode = { folders: Map<string, MutNode>; files: { label: string; scope: FileScope; path: string }[] }
const emptyMut = (): MutNode => ({ folders: new Map(), files: [] })

function insert(root: MutNode, scope: FileScope, rel: string) {
  const segs = rel.split('/')
  const fileName = segs.pop()!
  let cur = root
  for (const s of segs) {
    if (!cur.folders.has(s)) cur.folders.set(s, emptyMut())
    cur = cur.folders.get(s)!
  }
  cur.files.push({ label: fileName.replace(/\.md$/i, ''), scope, path: rel })
}

function toNodes(m: MutNode, keyPrefix: string): TreeNode[] {
  const folders: TreeNode[] = [...m.folders.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, child]) => ({
      kind: 'folder' as const,
      key: `${keyPrefix}/${name}`,
      label: prettify(name),
      children: toNodes(child, `${keyPrefix}/${name}`),
    }))
  const files: TreeNode[] = [...m.files]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((f) => ({ kind: 'file' as const, key: `${f.scope}:${f.path}`, label: f.label, scope: f.scope, path: f.path }))
  return [...folders, ...files]
}

export function FileEditor({ title, scopes }: { title: string; scopes: ScopeCfg[] }) {
  const [groups, setGroups] = useState<{ cfg: ScopeCfg; files: FileNode[] }[]>([])
  const [selected, setSelected] = useState<Selected | null>(null)
  const [content, setContent] = useState('')
  const [original, setOriginal] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const tree = useMemo<TreeNode[]>(() => {
    const top: TreeNode[] = []
    for (const { cfg, files } of groups) {
      const root = emptyMut()
      files.forEach((f) => insert(root, cfg.scope, f.path))
      const prefix = `scope:${cfg.scope}`
      if (root.files.length > 0) {
        // Escopo com arquivos na raiz → agrupa sob o rótulo do escopo.
        top.push({ kind: 'folder', key: prefix, label: cfg.label, children: toNodes(root, prefix) })
      } else {
        // Sem arquivos na raiz → promove as pastas de topo (ex.: Empresa, Produtos).
        top.push(...toNodes(root, prefix))
      }
    }
    return top
  }, [groups])

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    Promise.all(
      scopes.map((cfg) =>
        fetch(`/api/files/tree?scope=${cfg.scope}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((files: FileNode[]) => ({ cfg, files }))
          .catch(() => ({ cfg, files: [] as FileNode[] }))
      )
    ).then(setGroups)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function open(scope: FileScope, path: string) {
    fetch(`/api/files?scope=${scope}&path=${encodeURIComponent(path)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { content: string }) => {
        setSelected({ scope, path })
        setContent(data.content)
        setOriginal(data.content)
      })
      .catch(() => {})
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selected, content }),
      })
      if (!res.ok) throw new Error()
      setOriginal(content)
      setMsg('Salvo!')
    } catch {
      setMsg('Erro ao salvar')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 2000)
    }
  }

  const dirty = content !== original

  function renderNode(node: TreeNode, depth: number) {
    const pad = 10 + depth * 14
    if (node.kind === 'folder') {
      const isOpen = expanded.has(node.key)
      return (
        <div key={node.key}>
          <button
            onClick={() => toggle(node.key)}
            style={{ paddingLeft: pad }}
            className="flex w-full items-center gap-1.5 rounded-lg pr-2.5 h-8 text-left text-[13px] font-medium text-[#0d0d0d] hover:bg-black/5"
          >
            <ChevronRight size={14} className={`flex-none text-[#9d9d9d] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            <span className="truncate">{node.label}</span>
          </button>
          {isOpen && <div className="flex flex-col gap-0.5">{node.children.map((c) => renderNode(c, depth + 1))}</div>}
        </div>
      )
    }
    const active = selected?.scope === node.scope && selected?.path === node.path
    return (
      <button
        key={node.key}
        onClick={() => open(node.scope, node.path)}
        style={{ paddingLeft: pad }}
        className={`flex w-full items-start gap-2 rounded-lg pr-2.5 py-1.5 text-left text-[13px] transition-colors ${
          active ? 'bg-black/[0.06] text-[#0d0d0d]' : 'text-[#5d5d5d] hover:bg-black/5'
        }`}
      >
        <FileText size={14} className="flex-none mt-[3px] text-[#9d9d9d]" />
        <span className="leading-snug break-words">{node.label}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 bg-white">
      {/* Árvore de arquivos */}
      <div className="w-[280px] flex-none border-r border-black/5 flex flex-col">
        <div className="h-14 flex-none flex items-center px-4 border-b border-black/5">
          <h1 className="text-sm font-semibold text-[#0d0d0d]">{title}</h1>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-0.5">
          {tree.map((node) => renderNode(node, 0))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selected ? (
          <>
            <div className="h-14 flex-none flex items-center gap-3 px-5 border-b border-black/5">
              <span className="text-sm text-[#5d5d5d] truncate">{selected.path}</span>
              <div className="ml-auto flex items-center gap-3">
                {msg && <span className={`text-xs ${msg.startsWith('Erro') ? 'text-red-500' : 'text-green-600'}`}>{msg}</span>}
                <button
                  onClick={save}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-[#0d0d0d] px-3.5 text-sm text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Save size={15} />
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="flex-1 min-h-0 w-full resize-none bg-white px-6 py-5 font-mono text-[13px] leading-relaxed text-[#0d0d0d] outline-none"
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-[#8e8e8e]">Selecione um arquivo para editar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
