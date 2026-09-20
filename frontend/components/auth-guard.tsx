'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="p-6 text-primary font-mono animate-pulse">
        AUTHENTICATING...
      </div>
    )
  }

  return <>{children}</>
}
