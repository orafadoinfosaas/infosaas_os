// Entry do iframe (MCP Apps). Conecta na bridge do host, recebe o resultado da tool
// (structuredContent.content = o Content JSON) e desenha via mount().
//
// Claude/Goose/VS Code: padrão MCP Apps (@modelcontextprotocol/ext-apps `App`).
// ChatGPT: Apps SDK da OpenAI (window.openai) — branch best-effort (confirmar no teste).
import { App } from '@modelcontextprotocol/ext-apps'
import type { Content } from '@infosaas/content'
import { mount } from './preview.js'

const root = (document.getElementById('root') as HTMLDivElement) ?? document.body

function contentFrom(payload: unknown): Content | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as { content?: unknown; structuredContent?: { content?: unknown } }
  const c = p.structuredContent?.content ?? p.content
  return c && typeof c === 'object' ? (c as Content) : null
}

function render(content: Content | null) {
  if (!content) return
  void mount(root, content, {})
}

const w = window as unknown as { openai?: { toolOutput?: unknown } }

if (w.openai) {
  // ── ChatGPT (Apps SDK) — best-effort ──
  try {
    render(contentFrom(w.openai.toolOutput))
    window.addEventListener('openai:set_globals', () => render(contentFrom(w.openai!.toolOutput)))
  } catch {
    /* API da OpenAI diferente do esperado — confirmar no teste do GPT */
  }
} else {
  // ── Claude / MCP Apps ──
  const app = new App({ name: 'Infosaas Preview', version: '1.0.0' })
  app.connect()
  app.ontoolresult = (result: unknown) => render(contentFrom(result))
}
