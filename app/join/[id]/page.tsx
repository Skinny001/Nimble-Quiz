'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// /join/[id] — invite link landing page.
// Redirects immediately into the main SPA with the round pre-selected.
// The main page.tsx reads ?join= and auto-opens the round detail view.
export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/?join=${id}`)
    }
  }, [id, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </div>
        <p className="text-lg font-semibold">Opening round…</p>
        <p className="mt-2 text-sm text-muted-foreground">Opening this inside Nimiq Pay</p>
      </div>
    </main>
  )
}
