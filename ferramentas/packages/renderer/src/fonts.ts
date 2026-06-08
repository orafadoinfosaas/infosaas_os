// Garante que as fontes da marca estejam carregadas ANTES de medir/desenhar texto —
// senão a medição (composeFrame) usa métricas erradas. No iframe, o shell HTML deve
// carregar a Sora (@font-face / Google Fonts) para estas chamadas resolverem.
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.ready
    await Promise.all([
      document.fonts.load('800 64px Sora'),
      document.fonts.load('700 32px Sora'),
      document.fonts.load('400 24px Sora'),
    ])
  } catch {
    /* fontes indisponíveis — segue com fallback sans-serif */
  }
}
