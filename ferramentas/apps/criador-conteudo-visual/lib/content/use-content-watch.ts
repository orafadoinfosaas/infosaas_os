'use client'

import { useEffect, useRef } from 'react'

export type ContentUpdate = { slug: string; path: string; ts: number }

// Assina o SSE de /api/content/watch e dispara onUpdate a cada content.json
// criado/alterado em disco (modo IDE: a LLM escreve o arquivo, o app reage).
export function useContentWatch(onUpdate: (update: ContentUpdate) => void) {
  const cbRef = useRef(onUpdate)
  cbRef.current = onUpdate

  useEffect(() => {
    const source = new EventSource('/api/content/watch')

    function handle(e: MessageEvent) {
      try {
        const data = JSON.parse(e.data) as ContentUpdate
        if (data?.slug) cbRef.current(data)
      } catch {
        // evento malformado — ignora
      }
    }

    source.addEventListener('content_updated', handle as EventListener)

    return () => {
      source.removeEventListener('content_updated', handle as EventListener)
      source.close()
    }
  }, [])
}
