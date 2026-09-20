'use client'

import { useState, useMemo, useEffect } from 'react'
import { ActionBar, RoutingTable } from '@/components/routing'
import { motion } from 'framer-motion'
import { Network } from 'lucide-react'
import { api, mapPeer } from '@/lib/api'
import { useLiveStats } from '@/hooks/use-live-stats'
import type { LivePeerStats, MappedPeer } from '@/lib/types'

export default function DashboardPage() {
  const [peers, setPeers] = useState<MappedPeer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('last_seen')

  useEffect(() => {
    api.getPeers().then(data => {
      const rawPeers = Array.isArray(data?.peers) ? data.peers : []
      setPeers(rawPeers.map(mapPeer).filter((p): p is MappedPeer => p != null))
    }).catch(console.error)
  }, [])

  useLiveStats((stats: LivePeerStats[]) => {
    setPeers(current => current.map(p => {
      const update = stats.find(s => s.public_key === p.pubKey)
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
  })

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

      <RoutingTable peers={filteredPeers} />
    </motion.div>
  )
}
