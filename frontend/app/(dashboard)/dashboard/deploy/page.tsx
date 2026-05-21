'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { Rocket, ArrowLeft, Terminal } from 'lucide-react'
import { CyberPanel, CyberPanelHeader, CyberInput, CyberSelect, CyberToggle, CyberButton } from '@/components/cyber'
import Link from 'next/link'
import { api } from '@/lib/api'

const roleOptions = [
  { value: 'admin', label: 'ADMIN [Full Network Access]' },
  { value: 'shared_server', label: 'SHARED SERVER [Visible to Admins & Employees]' },
  { value: 'hidden_server', label: 'HIDDEN SERVER [Visible to Admins Only]' },
  { value: 'employee', label: 'EMPLOYEE [Access to Servers Only]' },
  { value: 'gamer', label: 'GAMER [P2P LAN Access]' },
  { value: 'guest', label: 'GUEST [Isolated Internet Access]' }
]

const hardwareOptions = [
  { value: 'server', label: 'SERVER' },
  { value: 'desktop', label: 'DESKTOP' },
  { value: 'mobile', label: 'MOBILE' }
]

export default function DeployPage() {
  const router = useRouter()
  const [isDeploying, setIsDeploying] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    userId: 1,
    identifier: '',
    role: 'employee',
    hardware: 'desktop',
    routeAllTraffic: false,
    enableAdGuard: true,
  })

  const getUserId = () => {
    if (typeof window === 'undefined') return 1
    const token = localStorage.getItem('token')
    if (!token) return 1
    try {
      return JSON.parse(atob(token.split('.')[1])).user_id || 1
    } catch {
      return 1
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getUsers()
        setUsers(data || [])
        setFormData((prev: any) => ({ ...prev, userId: getUserId() }))
      } catch (err) {
        console.error("Failed to load users", err)
      }
    }
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDeploying(true)
    setError('')

    try {
      const res = await api.createPeer({
        name: formData.identifier,
        user_id: formData.userId,
        device_type: formData.hardware,
        network_role: formData.role,
        full_tunnel: formData.routeAllTraffic,
        use_adguard: formData.enableAdGuard,
        passphrase: 'auto-generated'
      })

      if (res.client_config) {
        setGeneratedConfig(res.client_config)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || "Deployment Failed")
      setIsDeploying(false)
    }
  }

  if (generatedConfig) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-mono uppercase tracking-tighter text-foreground flex items-center gap-3">
              <Rocket className="w-6 h-6 text-primary" />
              [+] NODE_DEPLOYMENT_SUCCESSFUL
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Provide this configuration to the operator.</p>
          </div>
        </div>

        <CyberPanel glow="mint">
          <CyberPanelHeader title="OUTPUT_CREDENTIALS" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="bg-secondary/50 p-4 border border-border text-primary font-mono text-xs overflow-auto h-[260px] whitespace-pre-wrap rounded-sm relative group">
                <pre>{generatedConfig}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedConfig)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-primary p-2 border border-border bg-background/50 rounded-sm uppercase tracking-widest text-[10px]"
                >
                  COPY
                </button>
              </div>
              <CyberButton
                onClick={() => {
                  const blob = new Blob([generatedConfig], { type: 'text/plain' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${formData.identifier.replace(/\s+/g, '_')}_wg0.conf`
                  a.click()
                }}
                className="w-full"
              >
                DOWNLOAD WG0.CONF
              </CyberButton>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 h-[312px]">
              <div className="bg-white p-4 rounded-md border-4 border-mint/20">
                <QRCodeSVG value={generatedConfig} size={220} />
              </div>
              <p className="text-xs uppercase font-mono text-muted-foreground text-center">
                Scan with WireGuard Mobile App
              </p>
              <CyberButton
                className="w-full mt-2"
                onClick={() => {
                  setGeneratedConfig(null)
                  setFormData({ ...formData, identifier: '' })
                }}
              >
                DEPLOY ANOTHER NODE
              </CyberButton>
            </div>
          </div>
        </CyberPanel>
      </motion.div>
    )
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
            <CyberSelect
              label="Operator (User)"
              options={users.length > 0
                ? users.map(u => ({ value: String(u.id), label: u.username }))
                : [{ value: String(formData.userId), label: 'LOADING_OPERATORS...' }]}
              value={String(formData.userId)}
              onChange={(e: any) => setFormData({ ...formData, userId: Number(e.target.value) })}
            />
            <CyberInput
              label="Node Identifier"
              placeholder="e.g. John's iPhone, Prod DB Server..."
              value={formData.identifier}
              onChange={(e: any) => setFormData({ ...formData, identifier: e.target.value })}
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
              onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}
            />
            <CyberSelect
              label="Hardware Type"
              options={hardwareOptions}
              value={formData.hardware}
              onChange={(e: any) => setFormData({ ...formData, hardware: e.target.value })}
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
              onChange={(checked) => setFormData({ ...formData, routeAllTraffic: checked })}
            />
            <CyberToggle
              label="ENABLE_DNS_FILTERING"
              description="Route DNS queries through internal AdGuard Home instance"
              checked={formData.enableAdGuard}
              onChange={(checked) => setFormData({ ...formData, enableAdGuard: checked })}
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