import { NextRequest } from 'next/server'
import path from 'path'
import { watchContentDirectory } from '@/lib/content/watcher'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // Envia heartbeat inicial para confirmar conexão
      send('connected', { ok: true })

      const unsubscribe = watchContentDirectory((filePath) => {
        // slug = nome da pasta que contém o content.json
        const slug = path.basename(path.dirname(filePath))
        send('content_updated', { slug, path: filePath, ts: Date.now() })
      })

      // Heartbeat a cada 25s para manter a conexão SSE viva
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 25000)

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
