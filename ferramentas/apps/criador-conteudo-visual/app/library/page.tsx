'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { LibraryGrid } from '@/components/library/LibraryGrid'
import { PublishDrawer } from '@/components/library/PublishDrawer'
import type { CreationSummary } from '@/lib/content/reader'

export default function LibraryPage() {
  const [publishing, setPublishing] = useState<CreationSummary | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSuccess() {
    setPublishing(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-base font-bold tracking-wide mb-6 text-white/80">Biblioteca</h1>
          <LibraryGrid
            onPublish={setPublishing}
            refreshKey={refreshKey}
          />
        </div>
      </main>

      {publishing && (
        <PublishDrawer
          slug={publishing.slug}
          topic={publishing.topic}
          onClose={() => setPublishing(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
