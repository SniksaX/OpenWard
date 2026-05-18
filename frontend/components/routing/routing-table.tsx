'use client'

import { StatusDot, CyberBadge, CyberProgress } from '@/components/cyber'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export interface PeerData {
  id: string
  identifier: string
  ip: string
  publicKey?: string // Made optional
  pubKey?: string    // Added to match your API mapper
  role: 'admin' | 'employee' | 'guest'
  device: string
  status: 'online' | 'warning' | 'offline' | 'idle'
  rxTraffic: number
  txTraffic: number
  lastSeen: string
  operatorId: string
}

interface PeerTableRowProps {
  peer: PeerData
}

function PeerTableRow({ peer }: PeerTableRowProps) {
  const keyToDisplay = peer.publicKey || peer.pubKey || ''
  const targetId = peer.id || peer.pubKey

  return (
    <Link
      href={`/peers?id=${targetId}`} 
      prefetch={false}
      className="flex items-center px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border/50 group"
    >
      <div className="w-12">
        <StatusDot status={peer.status} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono text-foreground truncate">{peer.identifier}</div>
        <div className="text-xs text-muted-foreground font-mono">{peer.ip}</div>
      </div>

      <div className="w-48 hidden lg:block">
        <code className="text-xs text-muted-foreground font-mono">
          {keyToDisplay.slice(0, 20)}...
        </code>
      </div>

      <div className="w-40 flex items-center gap-2">
        <CyberBadge
          variant={
            peer.role === 'admin' ? 'info' : peer.role === 'employee' ? 'success' : 'default'
          }
        >
          {peer.role}
        </CyberBadge>
        <span className="text-xs text-muted-foreground uppercase">{peer.device}</span>
      </div>

      <div className="w-40 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-accent w-6">RX</span>
          <CyberProgress value={peer.rxTraffic} max={100} color="accent" className="flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-warning w-6">TX</span>
          <CyberProgress value={peer.txTraffic} max={100} color="warning" className="flex-1" />
        </div>
      </div>

      <div className="w-32 text-right">
        <span className="text-xs text-muted-foreground font-mono">{peer.lastSeen}</span>
      </div>

      <div className="w-8 flex justify-end">
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  )
}


interface OperatorGroupProps {
  operatorId: string
  peers: PeerData[]
}

function OperatorGroup({ operatorId, peers }: OperatorGroupProps) {
  return (
    <div className="mb-4">
      {/* Operator Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border-y border-border">
        <span className="text-[10px] text-primary uppercase tracking-widest">[#]</span>
        <span className="text-xs font-mono uppercase tracking-wider text-foreground">
          OPERATOR_ID: {operatorId}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {peers.length} PEER{peers.length !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* Peer Rows */}
      {peers.map((peer) => (
        <PeerTableRow key={peer.id} peer={peer} />
      ))}
    </div>
  )
}

interface RoutingTableProps {
  peers: PeerData[]
}

export function RoutingTable({ peers }: RoutingTableProps) {
  // Group peers by operator
  const grouped = peers.reduce((acc, peer) => {
    if (!acc[peer.operatorId]) {
      acc[peer.operatorId] = []
    }
    acc[peer.operatorId].push(peer)
    return acc
  }, {} as Record<string, PeerData[]>)

  return (
    <div className="flex-1 overflow-auto">
      {/* Table Header */}
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 bg-background/95 backdrop-blur border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
        <div className="w-12">STS</div>
        <div className="flex-1">IDENTIFIER / IP</div>
        <div className="w-48 hidden lg:block">PUBKEY</div>
        <div className="w-40">TOPOLOGY</div>
        <div className="w-40">TRAFFIC</div>
        <div className="w-32 text-right">LAST_SEEN</div>
        <div className="w-8" />
      </div>

      {/* Grouped Rows */}
      <div className="divide-y divide-border/30">
        {Object.entries(grouped).map(([operatorId, operatorPeers]) => (
          <OperatorGroup key={operatorId} operatorId={operatorId} peers={operatorPeers} />
        ))}
      </div>

      {/* Empty State */}
      {peers.length === 0 && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <div className="text-sm uppercase tracking-widest mb-2">NO PEERS FOUND</div>
            <div className="text-xs">Deploy a new peer to get started</div>
          </div>
        </div>
      )}
    </div>
  )
}
