'use client'
export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="p-8 text-red-500">
      <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
      <pre className="text-xs bg-red-950 p-4 rounded mb-4 overflow-auto">{error.message}</pre>
      <pre className="text-xs bg-red-950 p-4 rounded mb-4 overflow-auto">{error.stack}</pre>
      <button onClick={() => reset()} className="px-4 py-2 bg-red-600 text-white rounded">Try again</button>
    </div>
  )
}
