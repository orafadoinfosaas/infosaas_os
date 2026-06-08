import type Konva from 'konva'
import { composeFrame, type ComposeOpts } from './compose.js'
import { renderSpec } from './render.js'
import { waitForFonts } from './fonts.js'
import type { Content } from '@infosaas/content'

// Entry do BUNDLE do iframe (esbuild → preview.iife.js, global `InfosaasPreview`).
// O shell HTML chama `InfosaasPreview.mount(container, content, opts)` com o dado
// vindo do host (MCP Apps bridge — ver Stage 3c).

export type MountOpts = ComposeOpts & { slug?: string }

function frameCount(c: Content): number {
  if (c.content_type === 'carrossel') return c.slides.length
  if (c.content_type === 'anuncio') return Math.max(1, c.headlines.length)
  return 1
}

export async function mount(container: HTMLElement, content: Content, opts: MountOpts = {}): Promise<void> {
  await waitForFonts()
  const total = frameCount(content)
  let index = 0

  container.innerHTML = ''
  Object.assign(container.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' })

  const stageHost = document.createElement('div')
  Object.assign(stageHost.style, { width: '100%', maxWidth: '420px', borderRadius: '16px', overflow: 'hidden' })
  container.appendChild(stageHost)

  const nav = document.createElement('div')
  Object.assign(nav.style, { display: total > 1 ? 'flex' : 'none', alignItems: 'center', gap: '16px' })
  const prev = document.createElement('button')
  prev.textContent = '‹'
  const counter = document.createElement('span')
  const next = document.createElement('button')
  next.textContent = '›'
  for (const b of [prev, next]) {
    b.style.cssText = 'border:none;background:#111;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1'
  }
  counter.style.cssText = 'font:600 14px Sora,sans-serif;color:#444;min-width:56px;text-align:center'
  nav.append(prev, counter, next)
  container.appendChild(nav)

  let stage: Konva.Stage | null = null

  async function draw() {
    const w = stageHost.clientWidth || 420
    const activeHeadline = content.content_type === 'anuncio' ? index : 0
    const spec = composeFrame(content, index, opts.slug, activeHeadline, opts)
    const scale = w / spec.width
    if (stage) stage.destroy()
    stageHost.innerHTML = ''
    stage = await renderSpec(stageHost, spec, scale)
    counter.textContent = `${index + 1} / ${total}`
  }

  prev.onclick = () => {
    index = (index - 1 + total) % total
    void draw()
  }
  next.onclick = () => {
    index = (index + 1) % total
    void draw()
  }

  await draw()
}
