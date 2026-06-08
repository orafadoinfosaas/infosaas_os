// Empacota o entry do iframe (mcp-app.ts: bridge MCP Apps + renderer Konva) num
// único JS e embute num HTML self-contained, exportado como módulo `PREVIEW_HTML`
// para o MCP servir como resource ui:// (text/html;profile=mcp-app).
import { build } from 'esbuild'
import { writeFile } from 'node:fs/promises'

const result = await build({
  entryPoints: ['src/mcp-app.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  write: false,
})
const js = result.outputFiles[0].text

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Infosaas Preview</title>
<style>
  html, body { margin: 0; background: #fff; font-family: Sora, system-ui, -apple-system, sans-serif; }
  #root { padding: 12px; color: #444; font-size: 14px; }
</style>
</head>
<body>
<div id="root">Carregando preview…</div>
<script>${js}</script>
</body>
</html>`

const mod = `// GERADO por build.mjs — não editar. HTML self-contained da view do preview.\nexport const PREVIEW_HTML = ${JSON.stringify(html)}\n`
await writeFile('dist/preview-html.js', mod)
await writeFile('dist/preview-html.d.ts', 'export declare const PREVIEW_HTML: string\n')

console.log(`[renderer] dist/preview-html.js gerado (${html.length} chars)`)
