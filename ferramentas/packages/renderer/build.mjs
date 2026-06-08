// Empacota o renderer do iframe num único arquivo IIFE (global `InfosaasPreview`).
// O shell HTML da view (Stage 3b) carrega este bundle e chama InfosaasPreview.mount().
import { build } from 'esbuild'

await build({
  entryPoints: ['src/preview.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'InfosaasPreview',
  outfile: 'dist/preview.iife.js',
  target: 'es2020',
  minify: true,
  sourcemap: false,
})

console.log('[renderer] bundle gerado: dist/preview.iife.js')
