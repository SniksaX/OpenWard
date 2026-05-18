'use client'

import { useState, useMemo, useEffect } from 'react'
import { ActionBar, RoutingTable } from '@/components/routing'
import { motion } from 'framer-motion'
import { Network } from 'lucide-react'
import { api, mapPeer } from '@/lib/api'

export default function DashboardPage() {
  const [peers, setPeers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('last_seen')

  // Fetch initial data and setup SSE stream
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Initial Fetch
    api.getPeers().then(data => {
        const rawPeers = Array.isArray(data?.peers) ? data.peers : []
        setPeers(rawPeers.map(mapPeer))
    }).catch(console.error)

    // Live Stream Setup
    const evtSource = new EventSource(`/api/streamStats?token=${token}`)
    evtSource.onmessage = (event) => {
      try {
        const stats = JSON.parse(event.data)
        setPeers(current => current.map(p => {
          const update = stats.find((s: any) => s.public_key === p.pubKey)
          if (update) {
            return {
              ...p,
              rxTraffic: update.transfer_rx,
              txTraffic: update.transfer_tx,
              status: update.is_online ? 'online' : 'idle',
              endpoint: update.endpoint
            }
          }
          return p
        }))
      } catch (err) {}
    }
    return () => evtSource.close()
  }, [])

  const filteredPeers = useMemo(() => {
    let filtered = [...peers]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p => p.identifier.toLowerCase().includes(q) || p.ip.toLowerCase().includes(q))
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(p => p.role === roleFilter)
    }
    return filtered
  }, [peers, searchQuery, roleFilter])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Network className="w-9 h-9 text-primary p-2 bg-primary/10 border border-primary/30 rounded-sm" />
          <div>
            <h1 className="text-lg font-mono uppercase tracking-tighter">{'>_'} ROUTING_MATRIX</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Live peer routing and traffic monitor</p>
          </div>
        </div>
      </div>

      <ActionBar
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        roleFilter={roleFilter} onRoleFilterChange={setRoleFilter}
        sortBy={sortBy} onSortChange={setSortBy}
      />

      {/* Passing REAL data to v0's component */}
      <RoutingTable peers={filteredPeers} />
    </motion.div>
  )
}