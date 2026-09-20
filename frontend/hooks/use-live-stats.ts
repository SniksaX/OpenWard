'use client'

import { useEffect, useRef } from 'react'
import { API_URL, api } from '@/lib/api'
import type { LivePeerStats } from '@/lib/types'

const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30000

export function useLiveStats(onUpdate: (stats: LivePeerStats[]) => void) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    let cancelled = false
    let evtSource: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let backoff = INITIAL_BACKOFF_MS

    const clearTimer = () => {
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
    }

    const closeSource = () => {
      if (evtSource) {
        evtSource.close()
        evtSource = null
      }
    }

    const scheduleReconnect = () => {
      if (cancelled) return
      clearTimer()
      const wait = backoff
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
      retryTimer = setTimeout(() => {
        void connect()
      }, wait)
    }

    const connect = async () => {
      if (cancelled) return
      closeSource()
      try {
        const { token } = await api.getStreamToken()
        if (cancelled) return
        const es = new EventSource(
          `${API_URL}/api/streamStats?token=${encodeURIComponent(token)}`
        )
        evtSource = es

        es.onopen = () => {
          backoff = INITIAL_BACKOFF_MS
        }

        es.onmessage = (event) => {
          try {
            const stats = JSON.parse(event.data) as LivePeerStats[]
            if (!Array.isArray(stats)) return
            backoff = INITIAL_BACKOFF_MS
            onUpdateRef.current(stats)
          } catch {
            // ignore malformed frames
          }
        }

        es.onerror = () => {
          closeSource()
          scheduleReconnect()
        }
      } catch {
        scheduleReconnect()
      }
    }

    void connect()

    return () => {
      cancelled = true
      clearTimer()
      closeSource()
    }
  }, [])
}
