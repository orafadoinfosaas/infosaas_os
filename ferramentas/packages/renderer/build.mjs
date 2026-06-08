// Empacota o entry do iframe (mcp-app.ts: bridge MCP Apps + renderer Konva) num único
// JS e embute num HTML self-contained — com as fontes Sora (@font-face base64) e os
// logos da marca (mapa global window.__INFOSAAS_BRAND__) inline, pra não depender de CSP
// nem de origem externa. Exporta como módulo `PREVIEW_HTML` pro MCP servir (ui://).
import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'

const result = await build({
  entryPoints: ['src/mcp-app.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  write: false,
})
const js = result.outputFiles[0].text

// ── Fontes Sora embutidas (Konva usa só normal/400 e bold/700) ──
const fontB64 = async (f) => (await readFile(`assets/fonts/${f}`)).toString('base64')
const [soraRegular, soraBold] = await Promise.all([fontB64('Sora-Regular.ttf'), fontB64('Sora-Bold.ttf')])
const fontFace =
  `@font-face{font-family:'Sora';font-weight:400;font-style:normal;font-display:block;` +
  `src:url(data:font/ttf;base64,${soraRegular}) format('truetype');}` +
  `@font-face{font-family:'Sora';font-weight:700;font-style:normal;font-display:block;` +
  `src:url(data:font/ttf;base64,${soraBold}) format('truetype');}`

// ── Logos da marca embutidos (data URI por nome de arquivo) ──
const svgDataUri = async (f) => `data:image/svg+xml;base64,${(await readFile(`assets/brand/${f}`)).toString('base64')}`
const brand = {
  'logo-black.svg': await svgDataUri('logo-black.svg'),
  'logo-branco.svg': await svgDataUri('logo-branco.svg'),
  'logo-laranja.svg': await svgDataUri('logo-laranja.svg'),
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Infosaas Preview</title>
<style>
${fontFace}
html, body { margin: 0; background: #fff; font-family: Sora, system-ui, -apple-system, sans-serif; }
#root { padding: 12px; color: #444; font-size: 14px; }
</style>
</head>
<body>
<div id="root">Carregando preview…</div>
<script>window.__INFOSAAS_BRAND__=${JSON.stringify(brand)}</script>
<script>${js}</script>
</body>
</html>`

const mod = `// GERADO por build.mjs — não editar. HTML self-contained da view do preview.\nexport const PREVIEW_HTML = ${JSON.stringify(html)}\n`
await writeFile('dist/preview-html.js', mod)
await writeFile('dist/preview-html.d.ts', 'export declare const PREVIEW_HTML: string\n')

console.log(`[renderer] dist/preview-html.js gerado (${html.length} chars; fontes+logos embutidos)`)
