import chokidar, { type FSWatcher } from 'chokidar'
import path from 'path'
import { getOutputPath } from '@/config/company'

type WatchHandler = (filePath: string) => void

// Singleton para sobreviver hot-reload em dev
const g = globalThis as typeof globalThis & {
  _contentWatcher?: FSWatcher
}

function getWatcher(): FSWatcher {
  if (!g._contentWatcher) {
    // chokidar v4+ removeu suporte a glob. Observamos o diretório de saída
    // recursivamente e filtramos por content.json no handler.
    g._contentWatcher = chokidar.watch(getOutputPath(), {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    })
  }
  return g._contentWatcher
}

export function watchContentDirectory(onUpdate: WatchHandler): () => void {
  const watcher = getWatcher()
  const handler = (filePath: string) => {
    if (path.basename(filePath) === 'content.json') onUpdate(filePath)
  }
  watcher.on('add', handler)
  watcher.on('change', handler)

  return () => {
    watcher.off('add', handler)
    watcher.off('change', handler)
  }
}
