'use client'

import { useEffect, useState } from 'react'

export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined') return
  await document.fonts.ready
  await Promise.all([
    document.fonts.load('800 64px Sora'),
    document.fonts.load('700 32px Sora'),
    document.fonts.load('400 24px Sora'),
  ])
}

// Re-renderiza o componente quando as fontes terminam de carregar — necessário
// para que a medição de texto (composeFrame) use as métricas reais da fonte.
export function useFontReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    waitForFonts().then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])
  return ready
}
