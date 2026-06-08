// Superfície consumida pelo APP (editor): só o compose (layout). O desenho Konva
// (render.ts) e a entrada do iframe (preview.ts) NÃO entram aqui — são empacotados
// à parte pelo esbuild (build.mjs), pra não arrastar Konva pro build do app.
export * from './compose.js'
