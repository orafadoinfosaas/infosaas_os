import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

// Paleta Infosaas® (mirror de lib/templates/*.ts)
export const BRAND = {
  orange: '#FF3D00',
  black: '#000000',
  offwhite: '#F5F5F5',
  gray: '#D9D9D9',
  white: '#FFFFFF',
} as const

// Safe-areas (mirror de lib/renderer/compose.ts)
export const SAFE = { PAD: 72, BRAND_PAD: 48, LOGO_H: 40, SAFE_GAP: 44 } as const

// Variante → arquivo de logo (mesmo mapa de compose.ts)
export const LOGO_FILE: Record<'preto' | 'branco' | 'laranja', string> = {
  preto: 'black',
  branco: 'branco',
  laranja: 'laranja',
}

// Sora local (copiada para public/fonts). Carrega no Player (browser) e no
// renderer (staticFile resolve do publicDir do bundle).
let fontsLoaded = false
export function ensureFonts() {
  if (fontsLoaded) return
  fontsLoaded = true
  loadFont({ family: 'Sora', url: staticFile('fonts/Sora-Regular.ttf'), weight: '400' }).catch(() => {})
  loadFont({ family: 'Sora', url: staticFile('fonts/Sora-SemiBold.ttf'), weight: '600' }).catch(() => {})
  loadFont({ family: 'Sora', url: staticFile('fonts/Sora-Bold.ttf'), weight: '700' }).catch(() => {})
  loadFont({ family: 'Sora', url: staticFile('fonts/Sora-ExtraBold.ttf'), weight: '800' }).catch(() => {})
}
