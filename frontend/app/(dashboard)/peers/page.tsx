'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock } from 'lucide-react'
import { CyberBadge, StatusDot } from '@/components/cyber'
import { TrafficChart, PeerConfig, NodeOperations } from '@/components/peer'
import { api } from '@/lib/api'

function PeerDetailContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  
  const [peer, setPeer] = useState<any>(null)
  const [error, setError] = useState(false)
  const [graphData, setGraphData] = useState<any[]>([])
  const prevStats = useRef({ rx: -1, tx: -1, time: Date.now() })

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Direct Bulletproof Fetch (Bypasses any potential api.ts mapPeer bugs)
    fetch('/api/peers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const rawPeers = data.peers || []
      
      // Match ID strictly treating both as Strings
      const found = rawPeers.find((p: any) => String(p.id) === String(id) || String(p.public_key) === String(id))
      
      if (found) {
        setPeer({
          id: found.id,
          pubKey: found.public_key,
          identifier: found.name,
          ip: found.ip_address,
          role: found.network_role,
          status: found.status === 'active' ? 'online' : 'offline',
          rxTraffic: found.transfer_rx,
          txTraffic: found.transfer_tx,
          endpoint: found.last_endpoint || 'N/A',
          operatorId: found.user_id,
          lastSeen: found.last_handshake > 0 ? new Date(found.last_handshake * 1000).toLocaleString() : 'NEVER'
        })
      } else {
        console.error("No peer found matching ID:", id)
        setError(true)
      }
    })
    .catch(err => {
      console.error("Failed to fetch peer data:", err)
      setError(true)
    })

    // Setup Live SSE
    const evtSource = new EventSource(`/api/streamStats?token=${token}`)
    evtSource.onmessage = (event) => {
      try {
        const stats = JSON.parse(event.data)
        
        setPeer((prev: any) => {
          if (!prev || !prev.pubKey) return prev; // Safety check
          
          const update = stats.find((s: any) => s.public_key === prev.pubKey)
          if (update) {
            return {
              ...prev,
              rxTraffic: update.transfer_rx,
              txTraffic: update.transfer_tx,
              status: update.is_online ? 'online' : 'idle',
              endpoint: update.endpoint
            }
          }
          return prev
        })
      } catch (err) {}
    }

    return () => evtSource.close()
  }, [id, router])

  // Process live graph data
  useEffect(() => {
    if (!peer) return
    setGraphData(prev => {
      const now = Date.now()
      const timeDiff = (now - prevStats.current.time) / 1000
      let currentRx = Number(peer.rxTraffic) || 0
      let currentTx = Number(peer.txTraffic) || 0

      if (prevStats.current.rx === -1) {
        prevStats.current = { rx: currentRx, tx: currentTx, time: now }
        return prev
      }

      if (timeDiff <= 0) return prev

      let rxSpeedBytes = Math.max(0, (currentRx - prevStats.current.rx) / timeDiff)
      let txSpeedBytes = Math.max(0, (currentTx - prevStats.current.tx) / timeDiff)

      let rxMBps = Number((rxSpeedBytes / 1048576).toFixed(2))
      let txMBps = Number((txSpeedBytes / 1048576).toFixed(2))

      prevStats.current = { rx: currentRx, tx: currentTx, time: now }

      const d = new Date()
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`

      const newData = [...prev, { time: timeStr, rx: rxMBps, tx: txMBps }]
      return newData.length > 30 ? newData.slice(newData.length - 30) : newData
    })
  }, [peer?.rxTraffic, peer?.txTraffic])

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive font-mono text-xl mb-4">[!] NODE_NOT_FOUND</div>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          {'<'} Return to Dashboard
        </Link>
      </div>
    )
  }

  if (!peer) {
    return <div className="p-6 text-primary font-mono animate-pulse">LOCATING_NODE...</div>
  }

  const configItems = [
    { label: 'Public Key', value: peer.pubKey },
    { label: 'Endpoint', value: peer.endpoint || 'N/A' },
    { label: 'Allowed IPs', value: peer.role === 'admin' ? '0.0.0.0/0' : '10.200.200.0/24' },
    { label: 'Latest Handshake', value: peer.lastSeen },
  ]

  const handleExportConfig = async () => {
    try {
      const res = await api.getPeerConfig(peer.pubKey)
      const blob = new Blob([res.config], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${peer.identifier.replace(/\s+/g, '_')}_wg0.conf`
      a.click()
    } catch (err) {
      alert("Failed to download config!")
    }
  }

  const handleRevoke = async () => {
    if (confirm('CRITICAL: Are you sure you want to permanently revoke this peer?')) {
      try {
        await api.revokePeer(peer.pubKey)
        router.push('/dashboard')
      } catch (err) {
        alert("Failed to revoke peer.")
      }
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-full flex flex-col min-h-0">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" />
        <span className="uppercase tracking-widest text-xs">{'[<]'} RETURN_TO_ROUTING_MATRIX</span>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-sm">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-mono uppercase tracking-tighter text-foreground">{peer.identifier}</h1>
              <CyberBadge variant="info">{peer.ip}</CyberBadge>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <StatusDot status={peer.status} />
              <span className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Lock className="w-3 h-3" /> STATE: ENCRYPTED_TUNNEL_ACTIVE
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">OPERATOR_ID</div>
          <div className="text-sm font-mono text-primary">{peer.operatorId || 'SYS'}</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        <div className="xl:col-span-2 min-h-[400px]">
          <TrafficChart data={graphData} />
        </div>
        <div className="flex flex-col gap-4">
          <PeerConfig config={configItems} />
          <NodeOperations 
            onExportConfig={handleExportConfig} 
            onRenderQR={() => alert('QR Not implemented yet')} 
            onDisconnect={() => alert('Force Disconnect clicked')} 
            onRevoke={handleRevoke} 
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function PeerDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-primary font-mono animate-pulse">LOADING_MODULE...</div>}>
      <PeerDetailContent />
    </Suspense>
  )
}