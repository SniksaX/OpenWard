'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Rocket, ArrowLeft, Terminal } from 'lucide-react'
import { CyberPanel, CyberPanelHeader, CyberInput, CyberSelect, CyberToggle, CyberButton } from '@/components/cyber'
import Link from 'next/link'
import { api } from '@/lib/api'

const roleOptions = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'employee', label: 'EMPLOYEE' },
  { value: 'guest', label: 'GUEST' }
]

const hardwareOptions = [
  { value: 'server', label: 'SERVER' },
  { value: 'desktop', label: 'DESKTOP' },
  { value: 'mobile', label: 'MOBILE' }
]

export default function DeployPage() {
  const router = useRouter()
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    identifier: '', 
    role: 'employee', 
    hardware: 'desktop', 
    routeAllTraffic: false, 
    enableAdGuard: true,
  })

  // Safely extract User ID from JWT Token
  const getUserId = () => {
    const token = localStorage.getItem('token')
    if (!token) return 1
    try { 
      return JSON.parse(atob(token.split('.')[1])).user_id || 1 
    } catch { 
      return 1 
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDeploying(true)
    setError('')
    
    try {
      const res = await api.createPeer({
        name: formData.identifier,
        user_id: getUserId(),
        device_type: formData.hardware,
        network_role: formData.role,
        full_tunnel: formData.routeAllTraffic,
        use_adguard: formData.enableAdGuard,
        passphrase: 'auto-generated'
      })

      // Download Config File automatically
      if (res.client_config) {
        const blob = new Blob([res.client_config], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${formData.identifier.replace(/\s+/g, '_')}_wg0.conf`
        a.click()
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || "Deployment Failed")
      setIsDeploying(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span className="uppercase tracking-widest text-xs">{'[<]'} ABORT_DEPLOYMENT</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-mono uppercase tracking-tighter text-foreground flex items-center gap-3">
          <Terminal className="w-6 h-6 text-primary" />
          DEPLOY_NEW_NODE
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure and generate credentials for a new WireGuard peer.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <CyberPanel glow="cyan">
          <CyberPanelHeader title="1. IDENTIFICATION" />
          <div className="p-4 space-y-4">
            <CyberInput 
              label="Node Identifier" 
              placeholder="e.g. John's iPhone, Prod DB Server..." 
              value={formData.identifier}
              onChange={(e: any) => setFormData({...formData, identifier: e.target.value})}
              required
            />
          </div>
        </CyberPanel>

        <CyberPanel glow="mint">
          <CyberPanelHeader title="2. TOPOLOGY_ASSIGNMENT" />
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <CyberSelect 
              label="Network Role" 
              options={roleOptions}
              value={formData.role}
              onChange={(e: any) => setFormData({...formData, role: e.target.value})}
            />
            <CyberSelect 
              label="Hardware Type" 
              options={hardwareOptions}
              value={formData.hardware}
              onChange={(e: any) => setFormData({...formData, hardware: e.target.value})}
            />
          </div>
        </CyberPanel>

        <CyberPanel glow="orange">
          <CyberPanelHeader title="3. SECURITY_POLICIES" />
          <div className="p-4 space-y-2">
            <CyberToggle
              label="FORCE_FULL_TUNNEL"
              description="Route all client internet traffic through the VPN (0.0.0.0/0)"
              checked={formData.routeAllTraffic}
              onChange={(checked) => setFormData({...formData, routeAllTraffic: checked})}
            />
            <CyberToggle
              label="ENABLE_DNS_FILTERING"
              description="Route DNS queries through internal AdGuard Home instance"
              checked={formData.enableAdGuard}
              onChange={(checked) => setFormData({...formData, enableAdGuard: checked})}
            />
          </div>
        </CyberPanel>

        {error && (
          <div className="text-destructive text-xs uppercase tracking-widest font-bold border border-destructive/30 bg-destructive/10 p-3 rounded-sm">
            [!] ERROR: {error}
          </div>
        )}

        <div className="pt-4">
          <CyberButton type="submit" size="lg" className="w-full" disabled={isDeploying || !formData.identifier}>
            <span className="flex items-center justify-center gap-2">
              <Rocket className="w-5 h-5" />
              {isDeploying ? 'GENERATING_KEYS...' : 'EXECUTE_DEPLOYMENT'}
            </span>
          </CyberButton>
        </div>
      </form>
    </motion.div>
  )
}